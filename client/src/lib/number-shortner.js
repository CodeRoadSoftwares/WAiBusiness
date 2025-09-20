/**
 * Shortens a number to a human-readable format (e.g., 1.2K, 3.4M, 5B).
 * @param {number} num - The number to shorten.
 * @param {number} [digits=1] - Number of decimal digits to show.
 * @returns {string} The shortened number as a string.
 */
export function shortNumber(num, digits = 1) {
  if (num === null || num === undefined || isNaN(num)) return "0";
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (absNum < 1000) return sign + absNum.toString();

  const units = [
    { value: 1e9, symbol: "B" },
    { value: 1e6, symbol: "M" },
    { value: 1e3, symbol: "K" },
  ];

  for (let i = 0; i < units.length; i++) {
    if (absNum >= units[i].value) {
      let short = (absNum / units[i].value).toFixed(digits);
      // Remove trailing .0 if present
      short = short.replace(/\.0+$/, "");
      return sign + short + units[i].symbol;
    }
  }
  return sign + absNum.toString();
}
