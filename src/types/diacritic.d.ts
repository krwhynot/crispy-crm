/**
 * Type declarations for the 'diacritic' library.
 * This library removes accents/diacritics from strings.
 * @see https://www.npmjs.com/package/diacritic
 */
declare module "diacritic" {
  /**
   * Removes diacritics (accents) from a string.
   * @param text - The input string containing diacritics
   * @returns The string with diacritics removed
   * @example
   * clean("àéïõü") // returns "aeiou"
   */
  export function clean(text: string): string;
}
