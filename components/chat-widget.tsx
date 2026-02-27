"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabaseClient";
import { MessageData } from "@/lib/types";
import { Send } from "lucide-react";

interface ChatWidgetProps {
  bookingId: string;
}

export function ChatWidget({ bookingId }: ChatWidgetProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const normalizeMessage = (msg: any): MessageData => ({
    id: msg.id,
    bookingId: msg.booking_id,
    senderId: msg.sender_id,
    text: msg.text,
    createdAt: msg.created_at,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "44px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [newMessage]);

  useEffect(() => {
    if (!bookingId) return;

    const fetchThread = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          `get-thread?booking_id=${bookingId}`,
          { method: "GET" }
        );
        if (error) { console.error("Error de conexión:", error); return; }
        if (data?.messages) setMessages(data.messages.map(normalizeMessage));
      } catch (err) {
        console.error("Error cargando chat:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThread();

    const channel = supabase
      .channel(`chat_booking_${bookingId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `booking_id=eq.${bookingId}`,
      }, (payload) => {
        const newMsg = normalizeMessage(payload.new);
        setMessages((prev) => prev.find((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [bookingId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user || isSending) return;
    const textToSend = newMessage.trim();
    setNewMessage("");
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-message", {
        method: "POST",
        body: { booking_id: bookingId, text: textToSend },
      });
      if (error || (data && data.success === false)) {
        setNewMessage(textToSend);
        alert("No se pudo enviar el mensaje. Intentá de nuevo.");
      }
    } catch {
      setNewMessage(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Hoy";
    if (date.toDateString() === yesterday.toDateString()) return "Ayer";
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
  };

  // Función que calcula border-radius con inline styles (Tailwind no puede generar clases dinámicas)
  const getBubbleStyle = (isMine: boolean, isFirst: boolean, isLast: boolean): React.CSSProperties => {
    const r = "18px";
    const s = "5px";
    if (isMine) {
      return {
        borderRadius: isFirst && isLast
          ? `${r} ${r} ${s} ${r}`
          : isFirst ? `${r} ${r} ${s} ${r}`
          : isLast  ? `${r} ${r} ${s} ${r}`
          : `${r} ${r} ${s} ${r}`,
      };
    } else {
      return {
        borderRadius: isFirst && isLast
          ? `${r} ${r} ${r} ${s}`
          : isFirst ? `${r} ${r} ${r} ${s}`
          : isLast  ? `${r} ${r} ${r} ${s}`
          : `${r} ${r} ${r} ${s}`,
      };
    }
  };

  const groupedMessages = messages.reduce<{ date: string; msgs: MessageData[] }[]>(
    (groups, msg) => {
      const day = new Date(msg.createdAt).toDateString();
      const last = groups[groups.length - 1];
      if (last && last.date === day) { last.msgs.push(msg); }
      else { groups.push({ date: day, msgs: [msg] }); }
      return groups;
    }, []
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[300px] rounded-xl bg-muted/20">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs">Cargando conversación...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col bg-white border rounded-xl shadow-sm overflow-hidden w-full"
      style={{ height: "460px" }}
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b bg-white flex items-center gap-3 flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
          💬
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground leading-tight">Chat de la reserva</p>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-[11px] text-muted-foreground">En línea</span>
          </div>
        </div>
      </div>

      {/* Mensajes — scroll interno */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-0.5"
        style={{ background: "hsl(var(--muted) / 0.25)" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <div className="text-3xl">👋</div>
            <p className="text-sm font-medium text-foreground">¡Iniciá la conversación!</p>
            <p className="text-xs text-muted-foreground">
              Coordiná los detalles del alquiler con el propietario
            </p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Separador de fecha */}
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
                  {formatDateSeparator(group.msgs[0].createdAt)}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-0.5">
                {group.msgs.map((msg, i) => {
                  const isMine = msg.senderId === user?.id;
                  const isFirst = i === 0 || group.msgs[i - 1]?.senderId !== msg.senderId;
                  const isLast = i === group.msgs.length - 1 || group.msgs[i + 1]?.senderId !== msg.senderId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"} ${isFirst ? "mt-2" : "mt-0.5"}`}
                    >
                      <div
                        style={{
                          ...getBubbleStyle(isMine, isFirst, isLast),
                          maxWidth: "75%",
                        }}
                        className={`px-3 py-2 ${
                          isMine
                            ? "bg-primary text-primary-foreground"
                            : "bg-white border shadow-sm text-foreground"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.text}
                        </p>
                        <p
  style={{ fontSize: "10px", lineHeight: 1 }}
  className={`mt-0.5 text-right ${
    isMine ? "text-primary-foreground/60" : "text-muted-foreground"
  }`}
>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t bg-white flex items-end gap-2 flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí un mensaje..."
          disabled={isSending}
          rows={1}
          className="flex-1 px-3.5 py-2.5 text-sm bg-muted/40 border border-border rounded-2xl
                     focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background
                     resize-none overflow-y-auto transition-colors placeholder:text-muted-foreground"
          style={{ minHeight: "40px", maxHeight: "120px" }}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!newMessage.trim() || isSending}
          className="h-10 w-10 flex-shrink-0 flex items-center justify-center
                     bg-primary text-primary-foreground rounded-full
                     disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {isSending
            ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            : <Send className="h-4 w-4" />
          }
        </button>
      </div>
    </div>
  );
}