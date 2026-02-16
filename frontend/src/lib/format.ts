export function formatInr(value: number): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `₹${Math.round(value).toLocaleString("en-IN")}`;
  }
}

export function formatMoney(value: number, currency: string): string {
  const locale =
    currency === "USD"
      ? "en-US"
      : currency === "GBP"
        ? "en-GB"
        : currency === "SGD"
          ? "en-SG"
          : currency === "AED"
            ? "en-AE"
            : "en-IN";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${Math.round(value).toLocaleString(locale)} ${currency}`;
  }
}

export function formatPct(value: number): string {
  return `${value.toFixed(2)}%`;
}
