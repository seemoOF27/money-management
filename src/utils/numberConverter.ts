// Map of Arabic to English numerals (Eastern Arabic numerals)
const arabicToEnglishMap: { [key: string]: string } = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  // Also handle Arabic-Indic numerals (used in some regions)
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

// Convert Arabic numerals (٠-٩ and ۰-۹) to English numerals (0-9) and remove non-numeric characters
export function convertArabicToEnglish(input: string): string {
  if (!input) return input;
  // Replace all Arabic numerals (both Eastern Arabic and Arabic-Indic)
  let result = input.replace(/[٠-٩۰-۹]/g, (match) => arabicToEnglishMap[match] || match);
  // Remove any non-digit characters (except decimal point and minus sign for negative numbers)
  result = result.replace(/[^\d.-]/g, '');
  return result;
}

// Handle input change for number fields - converts Arabic to English automatically
export function handleNumberInput(e: React.ChangeEvent<HTMLInputElement>): string {
  const converted = convertArabicToEnglish(e.target.value);
  return converted;
}

// Real-time conversion for keyboard input
// Note: setSelectionRange doesn't work with input type="number"
// so we simply convert and update without cursor position handling
export function createNumberInputHandler(
  setValue: (value: string) => void
) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const oldValue = e.target.value;
    
    // Convert Arabic numerals to English
    const newValue = convertArabicToEnglish(oldValue);
    
    // Update the value
    setValue(newValue);
  };
}
