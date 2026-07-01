export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isValidIsraeliPhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  return /^0\d{8,9}$/.test(digits);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
