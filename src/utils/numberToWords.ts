/**
 * Converts a numeric amount to English words formatted for INR (Rupees).
 */
export function numberToWords(num: number): string {
  if (num === 0) return "Zero Only";

  // Round to 2 decimal places
  const roundedNum = Math.round(num * 100) / 100;
  const rupeePart = Math.floor(roundedNum);
  const paisePart = Math.round((roundedNum - rupeePart) * 100);

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertLessThanOneThousand(n: number): string {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + " ";
    }
    return str.trim();
  }

  function convertRupees(n: number): string {
    if (n === 0) return "";
    
    let str = "";
    
    // Crores (1,00,00,000)
    if (n >= 10000000) {
      str += convertRupees(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    
    // Lakhs (1,00,000)
    if (n >= 100000) {
      str += convertLessThanOneThousand(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    
    // Thousands (1,000)
    if (n >= 1000) {
      str += convertLessThanOneThousand(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    
    // Hundreds & Tens
    if (n > 0) {
      str += convertLessThanOneThousand(n);
    }
    
    return str.trim();
  }

  let result = "INR " + convertRupees(rupeePart);

  if (paisePart > 0) {
    result += " and " + convertLessThanOneThousand(paisePart) + " Paise";
  }

  return result.trim() + " Only";
}
