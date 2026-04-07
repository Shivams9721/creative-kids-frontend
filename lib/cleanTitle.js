/**
 * Strips trailing repeated color / variant suffixes from product titles.
 *
 * Example:
 *   "Kids Girl Dress - Red - Red"  →  "Kids Girl Dress"
 *   "Boys Shirt - Blue"            →  "Boys Shirt"
 *   "Girls Top - Pink - Pink"      →  "Girls Top"
 */
export function cleanTitle(title) {
  if (!title) return '';

  // Common colour tokens that EasyEcom appends as " - Color"
  const colors = [
    'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Black', 'White', 'Orange',
    'Purple', 'Brown', 'Grey', 'Gray', 'Navy', 'Beige', 'Maroon', 'Cream',
    'Peach', 'Coral', 'Teal', 'Olive', 'Rust', 'Lavender', 'Magenta',
    'Turquoise', 'Sky Blue', 'Navy Blue', 'Wine', 'Mustard', 'Mint',
    'Burgundy', 'Charcoal', 'Off White', 'Multi', 'Multicolor',
  ];

  let cleaned = title.trim();

  // Strip up to 3 trailing " - <color>" segments (handles " - Red - Red")
  for (let i = 0; i < 3; i++) {
    const match = cleaned.match(/^(.+?)\s*-\s*([^-]+)$/);
    if (!match) break;
    const suffix = match[2].trim();
    if (colors.some(c => c.toLowerCase() === suffix.toLowerCase())) {
      cleaned = match[1].trim();
    } else {
      break;
    }
  }

  return cleaned;
}
