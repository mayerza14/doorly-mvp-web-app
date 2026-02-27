"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Loader2, ChevronDown, ChevronUp, Send, Lock } from "lucide-react";
import Link from "next/link";

// Patrones de contacto prohibidos
const BLOCKED_PATTERNS = [
  /\b(\+?54)?[\s.-]?9?[\s.-]?11[\s.-]?\d{4}[\s.-]?\d{4}\b/,  // teléfonos AR
  /\b\d{10,11}\b/,                                               // números largos
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,           // emails
  /instagram|whatsapp|telegram|facebook|twitter|tiktok/i,        // redes
  /transferencia|efectivo|mercadopago|mp\s|alias|cbu|cvu/i,     // pagos externos
  /te\s*llamo|llam[aá]me|escribime|contact[aá]me/i,             // invitaciones a salir
];

function validateQuestion(text: string): string | null {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return "Tu pregunta contiene información de contacto o de pago externo. Por seguridad, toda la comunicación debe ser dentro de Doorly.";
    }
  }
  if (text.trim().length < 10) return "La pregunta es muy corta.";
  if (text.trim().length > 500) return "La pregunta no puede superar los 500 caracteres.";
  return null;
}

interface Question {
  id: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
  user_id: string;
  asker?: { full_name: string | null };
}

interface ListingQuestionsProps {
  listingId: string;
  hostId: string;
}

export function ListingQuestions({ listingId, hostId }: ListingQuestionsProps) {
  const { user, profile } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [questionText, setQuestionText] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const isHost = user?.id === hostId;

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from("listing_questions")
      .select(`
        id, question, answer, answered_at, created_at, user_id,
        asker:user_id ( full_name )
      `)
      .eq("listing_id", listingId)
      .eq("is_visible", true)
      .order("created_at", { ascending: false });

    if (!error && data) setQuestions(data as Question[]);
    setIsLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, [listingId]);

  const handleSubmitQuestion = async () => {
    const error = validateQuestion(questionText);
    if (error) { setValidationError(error); return; }
    setValidationError("");
    setIsSubmitting(true);

    try {
      const { data: newQ, error: insertError } = await supabase
        .from("listing_questions")
        .insert({
          listing_id: listingId,
          user_id: user!.id,
          question: questionText.trim(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Disparar notificación al anfitrión
      await supabase.functions.invoke("notify-question", {
        body: { questionId: newQ.id },
      });

      setQuestionText("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
      fetchQuestions();
    } catch (err) {
      console.error(err);
      setValidationError("Error al enviar la pregunta. Intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    const answer = answerText[questionId]?.trim();
    if (!answer) return;

    const validationErr = validateQuestion(answer);
    if (validationErr) { setValidationError(validationErr); return; }

    setIsAnswering(questionId);
    try {
      const { error } = await supabase
        .from("listing_questions")
        .update({
          answer,
          answered_by: user!.id,
          answered_at: new Date().toISOString(),
        })
        .eq("id", questionId);

      if (error) throw error;
      setAnsweringId(null);
      setAnswerText((prev) => ({ ...prev, [questionId]: "" }));
      fetchQuestions();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnswering(null);
    }
  };

  const visibleQuestions = showAll ? questions : questions.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground text-lg">
          Preguntas{questions.length > 0 && <span className="text-muted-foreground font-normal text-base ml-1">({questions.length})</span>}
        </h3>
      </div>

      {/* Formulario para preguntar */}
      {user ? (
        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Hacé una pregunta al anfitrión</p>
          <Textarea
            placeholder="¿Tiene vigilancia? ¿Puedo acceder los fines de semana?..."
            value={questionText}
            onChange={(e) => {
              setQuestionText(e.target.value);
              setValidationError("");
            }}
            rows={3}
            className="resize-none text-sm"
            maxLength={500}
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              {validationError && (
                <p className="text-xs text-destructive">{validationError}</p>
              )}
              {submitSuccess && (
                <p className="text-xs text-green-600 font-medium">
                  ✓ Pregunta enviada. El anfitrión fue notificado.
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {questionText.length}/500 · No incluyas datos de contacto ni pagos externos
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleSubmitQuestion}
              disabled={isSubmitting || !questionText.trim()}
              className="shrink-0"
            >
              {isSubmitting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><Send className="h-3.5 w-3.5 mr-1.5" />Preguntar</>}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-muted/30 border border-border rounded-xl p-4 flex items-center gap-3">
          <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            <Link href="/auth" className="text-primary font-semibold hover:underline">
              Iniciá sesión
            </Link>{" "}
            para hacer una pregunta al anfitrión.
          </p>
        </div>
      )}

      {/* Lista de preguntas */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : questions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Todavía no hay preguntas. ¡Sé el primero en preguntar!
        </p>
      ) : (
        <div className="space-y-4">
          {visibleQuestions.map((q) => (
            <div key={q.id} className="border border-border rounded-xl overflow-hidden">
              {/* Pregunta */}
              <div className="p-4 bg-background">
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">?</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed">{q.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(q.created_at).toLocaleDateString("es-AR", {
                        day: "numeric", month: "long", year: "numeric"
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Respuesta existente */}
              {q.answer && (
                <div className="p-4 bg-primary/5 border-t border-border">
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary-foreground">A</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-primary">Anfitrión</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary">
                          Verificado
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{q.answer}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sin respuesta aún */}
              {!q.answer && !isHost && (
                <div className="px-4 py-3 bg-muted/30 border-t border-border">
                  <p className="text-xs text-muted-foreground italic">Sin respuesta aún</p>
                </div>
              )}

              {/* Panel de respuesta para el anfitrión */}
              {!q.answer && isHost && (
                <div className="p-4 bg-muted/30 border-t border-border space-y-2">
                  {answeringId === q.id ? (
                    <>
                      <Textarea
                        placeholder="Escribí tu respuesta..."
                        value={answerText[q.id] || ""}
                        onChange={(e) =>
                          setAnswerText((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        rows={2}
                        className="resize-none text-sm"
                        maxLength={500}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAnsweringId(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitAnswer(q.id)}
                          disabled={isAnswering === q.id}
                        >
                          {isAnswering === q.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : "Publicar respuesta"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-primary border-primary/30 hover:bg-primary/5"
                      onClick={() => setAnsweringId(q.id)}
                    >
                      Responder esta pregunta
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {questions.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline mx-auto"
            >
              {showAll ? (
                <><ChevronUp className="h-4 w-4" />Ver menos</>
              ) : (
                <><ChevronDown className="h-4 w-4" />Ver las {questions.length - 3} preguntas restantes</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}