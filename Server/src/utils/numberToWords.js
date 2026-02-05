
const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const convertExcludingUnits = (num) => {
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    const digit = num % 10;
    return tens[Math.floor(num / 10)] + (digit ? " " + units[digit] : "");
};

const convertNumberToWords = (num) => {
    if (num === 0) return "Zero";

    let words = "";

    const crore = Math.floor(num / 10000000);
    num %= 10000000;

    const lakh = Math.floor(num / 100000);
    num %= 100000;

    const thousand = Math.floor(num / 1000);
    num %= 1000;

    const hundred = Math.floor(num / 100);
    num %= 100;

    if (crore > 0) {
        words += convertExcludingUnits(crore) + " Crore ";
    }

    if (lakh > 0) {
        words += convertExcludingUnits(lakh) + " Lakh ";
    }

    if (thousand > 0) {
        words += convertExcludingUnits(thousand) + " Thousand ";
    }

    if (hundred > 0) {
        words += convertExcludingUnits(hundred) + " Hundred ";
    }

    if (num > 0) {
        if (words !== "") words += "and ";
        words += convertExcludingUnits(num);
    }

    return words.trim();
};

export { convertNumberToWords };
