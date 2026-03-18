const VALID_PATTERN = /^[A-Za-z]$/;

export function isValidInitial(char: string): boolean {
  return VALID_PATTERN.test(char);
}

export function normaliseInitial(char: string): string {
  return char.toUpperCase();
}

export function getEngravingFontFamily(): string {
  return "'Classique Script', cursive";
}
