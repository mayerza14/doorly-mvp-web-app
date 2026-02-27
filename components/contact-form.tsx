"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.querySelector("#name") as HTMLInputElement)?.value || "";
    const email = (form.querySelector("#email") as HTMLInputElement)?.value || "";
    const message = (form.querySelector("#message") as HTMLTextAreaElement)?.value || "";
    const subject = encodeURIComponent(`Consulta de ${name} — Doorly`);
    const body = encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`);
    window.location.href = `mailto:soporte.doorly@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Nombre
        </label>
        <Input id="name" placeholder="Tu nombre" className="mt-1" required />
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input id="email" type="email" placeholder="tu@email.com" className="mt-1" required />
      </div>
      <div>
        <label htmlFor="message" className="text-sm font-medium text-foreground">
          Mensaje
        </label>
        <Textarea id="message" placeholder="Tu mensaje..." rows={4} className="mt-1" required />
      </div>
      <Button type="submit" className="w-full">
        Enviar mensaje
      </Button>
    </form>
  );
}