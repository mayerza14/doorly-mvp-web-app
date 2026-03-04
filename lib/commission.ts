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
export const COMMISSION_HOST_RATE = 0.05; // 5%

// Comisión que cobra MercadoPago sobre el total cobrado al inquilino
// Checkout Pro Argentina — puede variar levemente según medio de pago
export const MP_FEE_RATE = 0.0761;      // 7,61% comisión MP
export const MP_SIRTAC_RATE = 0.015;    // 1,5% retención SIRTAC CABA
export const MP_TOTAL_RATE = MP_FEE_RATE + MP_SIRTAC_RATE; // 9,11% total

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
 * Lo que efectivamente recibe el host (precio base - comisión host Doorly).
 * Este es el monto que Doorly le transfiere al host.
 */
export function calcHostPayout(basePrice: number): number {
  return basePrice - calcHostCommission(basePrice);
}

/**
 * Comisión de MercadoPago sobre el monto cobrado.
 * Se descuenta antes de que el dinero llegue a la cuenta de Doorly.
 */
export function calcMpFee(chargedAmount: number): number {
  const mpFee = Math.round(chargedAmount * MP_FEE_RATE);
  const sirtac = Math.round(chargedAmount * MP_SIRTAC_RATE);
  return mpFee + sirtac;
}

export function calcMpFeeBreakdown(chargedAmount: number) {
  return {
    mpFee: Math.round(chargedAmount * MP_FEE_RATE),
    sirtac: Math.round(chargedAmount * MP_SIRTAC_RATE),
    total: Math.round(chargedAmount * MP_TOTAL_RATE),
  };
}

/**
 * Neto estimado que recibe Doorly después de la comisión de MP.
 * Nota: puede variar levemente según retenciones impositivas de la provincia del pagador.
 */
export function calcNetAfterMp(chargedAmount: number): number {
  return chargedAmount - calcMpFee(chargedAmount);
}

/**
 * Desglose completo para mostrarle al host en su dashboard.
 * totalCharged = lo que pagó el inquilino (total_amount en la reserva)
 * basePrice    = precio base del espacio (amount en la reserva)
 */
export function calcHostBreakdown(totalCharged: number, basePrice: number) {
  const mpFee = calcMpFee(totalCharged);
  const netAfterMp = totalCharged - mpFee;
  const doorlyCommission = calcHostCommission(basePrice);
  const hostPayout = netAfterMp - doorlyCommission;

  return {
    totalCharged,      // Lo que pagó el inquilino
    mpFee,             // Comisión MP (~7,61%)
    netAfterMp,        // Lo que entra a la cuenta Doorly
    doorlyCommission,  // Comisión Doorly al host (0 durante lanzamiento)
    hostPayout,        // Lo que Doorly le transfiere al host
  };
}
