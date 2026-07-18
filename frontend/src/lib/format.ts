let currency = "₪";
export function setCurrency(c: string) {
  currency = c;
}

export function formatCurrency(amount: number): string {
  return `${currency}${amount.toLocaleString()}`;
}
