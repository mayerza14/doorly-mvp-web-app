"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Send, Flag, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { mockBookings } from "@/lib/mock-bookings";
import { mockConversations, mockMessages, addMessage, createReport } from "@/lib/mock-bookings";
import { validateMessage } from "@/lib/chat-utils";
import type { Booking, Message } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth?returnUrl=/mensajes/${params.bookingId}`);
    }
  }, [user, authLoading, router, params.bookingId]);

  useEffect(() => {
    const foundBooking = mockBookings.find((b) => b.id === params.bookingId);
    setBooking(foundBooking || null);

    if (foundBooking) {
      const conversation = mockConversations.find((c) => c.bookingId === foundBooking.id);
      if (conversation) {
        const conversationMessages = mockMessages.filter(
          (m) => m.conversationId === conversation.id
        );
        setMessages(conversationMessages);
      }
    }
  }, [params.bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (authLoading || !user) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </AppShell>
    );
  }

  if (!booking) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Conversación no encontrada</h1>
          <Button onClick={() => router.back()}>Volver</Button>
        </div>
      </AppShell>
    );
  }

  const isConfirmed = booking.status === "confirmed";
  const otherUserId = user.id === booking.renterId ? booking.hostId : booking.renterId;

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // Validate message
    const validation = validateMessage(newMessage);
    if (!validation.isValid) {
      setValidationError(validation.reason || "Mensaje no válido");
      return;
    }

    // TODO: Integrate with Supabase Realtime for live chat
    const conversation = mockConversations.find((c) => c.bookingId === booking.id);
    if (!conversation) return;

    const message = addMessage(conversation.id, user.id, newMessage);
    setMessages([...messages, message]);
    setNewMessage("");
    setValidationError(null);
  };

  const handleReport = () => {
    if (!reportReason) return;

    // TODO: Integrate with Supabase to store report
    createReport({
      bookingId: booking.id,
      reporterId: user.id,
      reason: reportReason,
      details: "Reporte desde el chat",
    });

    setReportDialogOpen(false);
    setReportReason("");

    // Show success message (could use a toast in production)
    alert("Reporte enviado. Nuestro equipo lo revisará pronto.");
  };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6 max-w-4xl h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  Chat - Reserva #{booking.id.slice(0, 8)}
                </CardTitle>
                <CardDescription>
                  {user.id === booking.renterId ? "Con el propietario" : "Con el inquilino"}
                </CardDescription>
              </div>
              <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Flag className="h-4 w-4 mr-2" />
                    Reportar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reportar un problema</DialogTitle>
                    <DialogDescription>
                      Contanos qué está pasando y nuestro equipo lo revisará.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <RadioGroup value={reportReason} onValueChange={setReportReason}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="contact_evasion" id="contact_evasion" />
                        <Label htmlFor="contact_evasion">
                          Intento de coordinación fuera de la plataforma
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="harassment" id="harassment" />
                        <Label htmlFor="harassment">Acoso o lenguaje inapropiado</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="scam" id="scam" />
                        <Label htmlFor="scam">Posible estafa o fraude</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other">Otro motivo</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleReport} disabled={!reportReason}>
                      Enviar reporte
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>

        {/* Anti-evasion Banner */}
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Mantené la coordinación dentro de Doorly</p>
            <p className="text-blue-700 mt-1">
              Por tu seguridad, evitá compartir información de contacto personal (teléfonos,
              emails, WhatsApp). Toda la comunicación debe hacerse por este chat.
            </p>
          </div>
        </div>

        {/* Chat not enabled yet */}
        {!isConfirmed && (
          <Card className="flex-1 flex items-center justify-center">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chat no disponible</h3>
              <p className="text-muted-foreground max-w-md">
                El chat se habilita automáticamente cuando la reserva está confirmada. Completá el
                pago para poder comunicarte con el propietario.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        {isConfirmed && (
          <>
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No hay mensajes aún. ¡Enviá el primero!
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.senderId === user.id;
                    return (
                      <div
                        key={message.id}
                        className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-4 py-2",
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}
                          >
                            {new Date(message.createdAt).toLocaleTimeString("es-AR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>
            </Card>

            {/* Message Input */}
            <Card className="mt-4">
              <CardContent className="p-4">
                {validationError && (
                  <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800">{validationError}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Escribí tu mensaje..."
                    className="min-h-[80px] resize-none"
                  />
                  <Button onClick={handleSendMessage} size="icon" className="h-[80px] w-[80px]">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Presioná Enter para enviar, Shift+Enter para nueva línea
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
