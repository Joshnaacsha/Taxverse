"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatInr = formatInr;
exports.formatMoney = formatMoney;
function formatInr(value) {
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(value);
    }
    catch {
        return `₹${Math.round(value).toLocaleString("en-IN")}`;
    }
}
function formatMoney(value, currency) {
    const locale = currency === "USD"
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
    }
    catch {
        return `${Math.round(value).toLocaleString(locale)} ${currency}`;
    }
}
