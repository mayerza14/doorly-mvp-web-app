// ─────────────────────────────────────────────────────────────────────────────
// Configuración de comisiones Doorly
//
// Para activar las comisiones: cambiar DOORLY_COMMISSION_ENABLED a true
// Las tasas se pueden ajustar sin tocar más código.
// ─────────────────────────────────────────────────────────────────────────────

export const DOORLY_COMMISSION_ENABLED = false;

// Comisión que se le suma al inquilino (guardador) sobre el precio base
export const COMMISSION_RENTER_RATE = 0.12; // 12%

// Comisión que se le descuenta al host (propietario) de lo que le corresponde
export const COMMISSION_HOST_RATE = 0.03; // 3%

/**
 * Comisión que paga el inquilino (se suma al precio base).
 * Cuando está desactivada, devuelve 0.
 */
export function calcRenterCommission(basePrice: number): number {
  if (!DOORLY_COMMISSION_ENABLED) return 0;
  return Math.round(basePrice * COMMISSION_RENTER_RATE);
}

/**
 * Total que paga el inquilino (precio base + comisión inquilino).
 * Este es el monto que se cobra en MercadoPago.
 */
export function calcRenterTotal(basePrice: number): number {
  return basePrice + calcRenterCommission(basePrice);
}

/**
 * Comisión que se descuenta al host (se resta del precio base).
 * Cuando está desactivada, devuelve 0.
 */
export function calcHostCommission(basePrice: number): number {
  if (!DOORLY_COMMISSION_ENABLED) return 0;
  return Math.round(basePrice * COMMISSION_HOST_RATE);
}

/**
 * Lo que efectivamente recibe el host (precio base - comisión host).
 * Este es el monto que Doorly le transfiere al host.
 */
export function calcHostPayout(basePrice: number): number {
  return basePrice - calcHostCommission(basePrice);
}