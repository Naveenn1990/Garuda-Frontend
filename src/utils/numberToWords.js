// Indian Currency Number to Words converter
export function numberToWords(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "";
  const num = Math.round(Number(amount) * 100) / 100;
  if (num === 0) return "Zero Rupees";

  const singleDigits = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertTwoDigits(n) {
    if (n < 10) return singleDigits[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + singleDigits[n % 10] : "");
  }

  function convertThreeDigits(n) {
    let str = "";
    if (Math.floor(n / 100) > 0) {
      str += singleDigits[Math.floor(n / 100)] + " Hundred";
      if (n % 100 !== 0) str += " ";
    }
    if (n % 100 !== 0) {
      str += convertTwoDigits(n % 100);
    }
    return str;
  }

  const [rupeePartStr, paisePartStr] = num.toFixed(2).split(".");
  let rupeePart = parseInt(rupeePartStr, 10);
  const paisePart = parseInt(paisePartStr, 10);

  let words = "";

  // Crores (>= 1,00,00,000)
  const crores = Math.floor(rupeePart / 10000000);
  rupeePart %= 10000000;
  if (crores > 0) {
    words += (words ? " " : "") + convertThreeDigits(crores) + " Crore";
  }

  // Lakhs (>= 1,00,000)
  const lakhs = Math.floor(rupeePart / 100000);
  rupeePart %= 100000;
  if (lakhs > 0) {
    words += (words ? " " : "") + convertTwoDigits(lakhs) + " Lakh";
  }

  // Thousands (>= 1,000)
  const thousands = Math.floor(rupeePart / 1000);
  rupeePart %= 1000;
  if (thousands > 0) {
    words += (words ? " " : "") + convertTwoDigits(thousands) + " Thousand";
  }

  // Hundreds & units (< 1,000)
  if (rupeePart > 0) {
    words += (words ? " " : "") + convertThreeDigits(rupeePart);
  }

  if (!words) {
    words = "Zero";
  }

  let finalWords = words + " Rupees";
  if (paisePart > 0) {
    finalWords += " and " + convertTwoDigits(paisePart) + " Paise";
  }
  return finalWords;
}

export default numberToWords;
