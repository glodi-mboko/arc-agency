export type Currency = "USD" | "EUR";

const SYMBOLS: Record<Currency, string> = { USD: "$", EUR: "€" };

export function formatMoney(
  amount: number,
  currency: Currency | null | undefined,
): string {
  const symbol = SYMBOLS[currency ?? "USD"];
  return `${amount.toFixed(2)} ${symbol}`;
}

export function currencySymbol(currency: Currency | null | undefined): string {
  return SYMBOLS[currency ?? "USD"];
}
