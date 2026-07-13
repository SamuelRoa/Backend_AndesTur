import crypto from "crypto";

const CARD_BINS = {
  visa: ["4"],
  mastercard: ["51", "52", "53", "54", "55"],
  amex: ["34", "37"],
  discover: ["6011", "65"],
};

const CARD_TEST_NUMBERS = [
  "4111111111111111",
  "4242424242424242",
  "4000056655665556",
  "5555555555554444",
  "5105105105105100",
  "378282246310005",
  "371449635398431",
  "6011111111111117",
  "6011000990139424",
];

function normalizeCardNumber(value = "") {
  return String(value).replace(/\D/g, "");
}

function luhnCheck(digits) {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function detectCardBrand(number) {
  for (const [brand, prefixes] of Object.entries(CARD_BINS)) {
    for (const prefix of prefixes) {
      if (number.startsWith(prefix)) return brand;
    }
  }
  return "unknown";
}

function isValidCardNumber(value) {
  const digits = normalizeCardNumber(value);
  if (!digits || digits.length < 13 || digits.length > 19) return false;
  if (CARD_TEST_NUMBERS.includes(digits)) return true;
  return luhnCheck(digits);
}

function isValidExpiry(value) {
  if (!value) return false;
  const match = String(value).match(/^(0[1-9]|1[0-2])\/(\d{2,4})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = Number(match[2]);
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  const expiryYear = year < 100 ? year + 2000 : year;
  const expiryMonth = month;
  return (
    expiryYear > currentYear ||
    (expiryYear === currentYear && expiryMonth >= currentMonth)
  );
}

function isValidCvv(value) {
  return /^\d{3,4}$/.test(String(value || ""));
}

export function simulatePayment(payload = {}) {
  const {
    payment_method,
    amount,
    cardNumber,
    expiry,
    cvv,
    zelleIdentifier,
    transferReference,
    bankName,
    phoneNumber,
    bankOperator,
  } = payload;

  const normalizedAmount = Number(amount || 0);
  const reference = `SIM-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  // Helper for rejected response
  const reject = (message) => ({
    approved: false,
    status: "rejected",
    message,
    reference,
    payment_method,
    amount: normalizedAmount,
    cardBrand: null,
    lastFour: null,
  });

  if (payment_method === "card") {
    const digits = normalizeCardNumber(cardNumber);
    if (!digits) return reject("Número de tarjeta requerido");
    if (digits.length < 13 || digits.length > 19)
      return reject("Número de tarjeta inválido (debe tener 13-19 dígitos)");
    if (!isValidCardNumber(cardNumber))
      return reject("Número de tarjeta no válido");
    if (!isValidExpiry(expiry))
      return reject("Fecha de expiración inválida o vencida");
    if (!isValidCvv(cvv))
      return reject("Código de seguridad inválido (3-4 dígitos)");

    const brand = detectCardBrand(digits);
    const lastFour = digits.slice(-4);
    return {
      approved: true,
      status: "approved",
      message: `Pago con ${brand.charAt(0).toUpperCase() + brand.slice(1)} aprobado para ${normalizedAmount.toFixed(2)} USD`,
      reference,
      payment_method: "card",
      amount: normalizedAmount,
      cardBrand: brand,
      lastFour,
    };
  }

  if (payment_method === "zelle") {
    const ok = Boolean(zelleIdentifier && String(zelleIdentifier).trim());
    if (!ok) return reject("Correo o teléfono de Zelle es requerido");
    return {
      approved: true,
      status: "approved",
      message: `Pago por Zelle aprobado para ${normalizedAmount.toFixed(2)} USD`,
      reference,
      payment_method: "zelle",
      amount: normalizedAmount,
      zelleIdentifier: String(zelleIdentifier).trim(),
    };
  }

  if (payment_method === "pago_movil") {
    const phoneOk = Boolean(phoneNumber && String(phoneNumber).trim());
    const bankOk = Boolean(bankOperator && String(bankOperator).trim());
    if (!phoneOk) return reject("Número de teléfono es requerido para Pago Móvil");
    if (!bankOk) return reject("Banco/operadora es requerido para Pago Móvil");
    return {
      approved: true,
      status: "approved",
      message: `Pago Móvil aprobado para ${normalizedAmount.toFixed(2)} USD`,
      reference,
      payment_method: "pago_movil",
      amount: normalizedAmount,
      phoneNumber: String(phoneNumber).trim(),
      bankOperator: String(bankOperator).trim(),
    };
  }

  if (payment_method === "transfer") {
    const refOk = Boolean(transferReference && String(transferReference).trim());
    const bankOk = Boolean(bankName && String(bankName).trim());
    if (!refOk) return reject("Referencia de transferencia es requerida");
    if (!bankOk) return reject("Nombre del banco es requerido");
    return {
      approved: true,
      status: "approved",
      message: `Transferencia aprobada para ${normalizedAmount.toFixed(2)} USD`,
      reference,
      payment_method: "transfer",
      amount: normalizedAmount,
    };
  }

  if (payment_method === "paypal") {
    return {
      approved: true,
      status: "approved",
      message: `Pago PayPal aprobado para ${normalizedAmount.toFixed(2)} USD`,
      reference: `PYPL-${Date.now()}`,
      payment_method: "paypal",
      amount: normalizedAmount,
    };
  }

  return reject("Método de pago inválido");
}
