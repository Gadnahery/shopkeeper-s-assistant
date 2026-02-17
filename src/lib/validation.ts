/**
 * Input validation utilities
 */

/** Strip HTML tags for safe display */
export function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function isValidBarcode(barcode: string): boolean {
  return (
    /^[0-9]{8,14}$/.test(barcode) || /^[A-Z0-9\-\.\/\+]{4,}$/.test(barcode)
  );
}

export function isValidSKU(sku: string): boolean {
  return /^[A-Z0-9\-]{3,}$/.test(sku);
}

export function isValidPrice(price: number): boolean {
  return price >= 0 && Number.isFinite(price);
}

export function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 0;
}

export function isValidTaxRate(rate: number): boolean {
  return rate >= 0 && rate <= 100;
}

export function isValidDiscount(
  discountType: "percentage" | "fixed",
  discountValue: number,
  totalAmount: number
): boolean {
  if (discountType === "percentage") {
    return discountValue >= 0 && discountValue <= 100;
  }
  return discountValue >= 0 && discountValue <= totalAmount;
}

export interface PasswordStrength {
  score: number;
  label: string;
  suggestions: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length < 8) {
    suggestions.push("Use at least 8 characters");
  } else score++;

  if (password.length >= 12) score++;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else suggestions.push("Use both uppercase and lowercase letters");

  if (/\d/.test(password)) score++;
  else suggestions.push("Include at least one number");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else suggestions.push("Include at least one special character");

  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    suggestions,
  };
}
