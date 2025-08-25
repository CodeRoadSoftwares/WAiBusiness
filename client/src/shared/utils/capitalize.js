/**
 * Capitalizes the first letter of each word in a string.
 * Underscores and dashes are replaced with spaces.
 * @param {string} str - The input string to capitalize.
 * @returns {string} - The capitalized string.
 */
function capitalize(str) {
  if (typeof str !== "string") return "";
  // Replace underscores and dashes with spaces
  str = str.replace(/[_-]+/g, " ");
  // Trim and collapse multiple spaces
  str = str.trim().replace(/\s+/g, " ");
  // Capitalize first letter of each word
  return str
    .split(" ")
    .map(word =>
      word.length > 0
        ? word[0].toUpperCase() + word.slice(1).toLowerCase()
        : ""
    )
    .join(" ");
}

export default capitalize;
