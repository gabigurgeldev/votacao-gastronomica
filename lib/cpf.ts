/**
 * Utilitários de CPF — validação por dígito verificador + formatação.
 */

export function sanitizeCPF(input: string): string {
  return input.replace(/\D/g, "");
}

export function formatCPF(input: string): string {
  const digits = sanitizeCPF(input).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function isValidCPF(input: string): boolean {
  const cpf = sanitizeCPF(input);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);
  const calcCheck = (slice: number[], factorStart: number): number => {
    let sum = 0;
    for (let i = 0; i < slice.length; i++) {
      sum += slice[i] * (factorStart - i);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  const check1 = calcCheck(digits.slice(0, 9), 10);
  if (check1 !== digits[9]) return false;

  const check2 = calcCheck(digits.slice(0, 10), 11);
  if (check2 !== digits[10]) return false;

  return true;
}

export function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function sanitizePhone(input: string): string {
  return input.replace(/\D/g, "");
}
