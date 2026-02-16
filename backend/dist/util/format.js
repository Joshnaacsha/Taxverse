"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatInr = formatInr;
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
