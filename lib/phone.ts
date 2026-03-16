const LOCAL_PHONE_DIGITS = 10;

export function extractRussianPhoneDigits(input: string): string {
  const trimmed = input.trim();
  const digitsOnly = input.replace(/\D/g, "");

  if (digitsOnly.length === 0) {
    return "";
  }

  if (trimmed.startsWith("+7")) {
    return digitsOnly.slice(1, 11);
  }

  if (trimmed.startsWith("8")) {
    return digitsOnly.slice(1, 11);
  }

  if ((digitsOnly.startsWith("7") || digitsOnly.startsWith("8")) && digitsOnly.length >= 11) {
    return digitsOnly.slice(1, 11);
  }

  return digitsOnly.slice(0, LOCAL_PHONE_DIGITS);
}

export function normalizeRussianPhone(input: string): string | null {
  const digits = extractRussianPhoneDigits(input);

  if (digits.length !== LOCAL_PHONE_DIGITS) {
    return null;
  }

  return `+7${digits}`;
}

export function formatRussianPhoneMask(input: string): string {
  const digits = extractRussianPhoneDigits(input);
  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 8);
  const part4 = digits.slice(8, 10);

  let formatted = "+7";

  if (digits.length > 0) {
    formatted += ` (${part1}`;
  }
  if (digits.length >= 3) {
    formatted += ")";
  }
  if (digits.length > 3) {
    formatted += ` ${part2}`;
  }
  if (digits.length > 6) {
    formatted += `-${part3}`;
  }
  if (digits.length > 8) {
    formatted += `-${part4}`;
  }

  return formatted;
}

export function formatRussianPhoneDisplay(input: string): string {
  const normalized = normalizeRussianPhone(input);
  return normalized ? formatRussianPhoneMask(normalized) : formatRussianPhoneMask(input);
}

export function maskRussianPhone(input: string): string {
  const normalized = normalizeRussianPhone(input);

  if (!normalized) {
    return formatRussianPhoneMask(input);
  }

  const digits = normalized.slice(2);
  return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
}

export function sanitizeSmsCode(input: string): string {
  return input.replace(/\D/g, "").slice(0, 6);
}
