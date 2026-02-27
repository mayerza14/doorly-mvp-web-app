// Anti-evasion chat utilities

const BLOCKED_PATTERNS = [
  // Email patterns
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Phone patterns (Argentina)
  /(\+?54)?[\s-]?(\d{2,4})[\s-]?\d{3,4}[\s-]?\d{4}/g,
  /(\+?54)?[\s-]?11[\s-]?\d{4}[\s-]?\d{4}/g,
  // WhatsApp mentions
  /whatsapp|wsp|wasap/gi,
  // Direct contact mentions
  /llam[aá]me|llamame|te llamo|contactame|cont[aá]ctame/gi,
];

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export function validateMessage(text: string): ValidationResult {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isValid: false,
        reason: "El mensaje contiene información de contacto. Por tu seguridad, mantené toda la comunicación dentro de Doorly.",
      };
    }
  }
  return { isValid: true };
}

export function highlightBlockedContent(text: string): string {
  let result = text;
  for (const pattern of BLOCKED_PATTERNS) {
    result = result.replace(pattern, (match) => `<mark class="bg-red-100">${match}</mark>`);
  }
  return result;
}
