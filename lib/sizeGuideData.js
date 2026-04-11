// Size guide data with measurements for different age groups and categories
// Based on standard children's sizing chart

export const BABY_SIZES = {
  0: { label: "0-3M", ageRange: "0-3 Months", shoulder: "16cm", sleeves: "4cm", chest: "24cm", length: "38cm" },
  1: { label: "3-6M", ageRange: "3-6 Months", shoulder: "17cm", sleeves: "4.5cm", chest: "25cm", length: "41cm" },
  2: { label: "6-9M", ageRange: "6-9 Months", shoulder: "18cm", sleeves: "5cm", chest: "26cm", length: "44cm" },
  3: { label: "9-12M", ageRange: "9-12 Months", shoulder: "19cm", sleeves: "5.5cm", chest: "27cm", length: "47cm" },
  4: { label: "12-18M", ageRange: "12-18 Months", shoulder: "20cm", sleeves: "6cm", chest: "28cm", length: "50cm" },
  5: { label: "18-24M", ageRange: "18-24 Months", shoulder: "21cm", sleeves: "6.5cm", chest: "29cm", length: "53cm" },
};

export const KIDS_SIZES = {
  0: { label: "2-3Y", ageRange: "2-3 Years", shoulder: "22cm", sleeves: "7cm", chest: "30cm", length: "56cm" },
  1: { label: "3-4Y", ageRange: "3-4 Years", shoulder: "23cm", sleeves: "7.5cm", chest: "31cm", length: "59cm" },
  2: { label: "4-5Y", ageRange: "4-5 Years", shoulder: "24cm", sleeves: "8cm", chest: "32cm", length: "62cm" },
  3: { label: "5-6Y", ageRange: "5-6 Years", shoulder: "25cm", sleeves: "8.5cm", chest: "33cm", length: "65cm" },
  4: { label: "6-7Y", ageRange: "6-7 Years", shoulder: "26cm", sleeves: "9cm", chest: "34cm", length: "68cm" },
  5: { label: "7-8Y", ageRange: "7-8 Years", shoulder: "27cm", sleeves: "9.5cm", chest: "35cm", length: "71cm" },
  6: { label: "8-9Y", ageRange: "8-9 Years", shoulder: "28cm", sleeves: "10cm", chest: "36cm", length: "74cm" },
  7: { label: "9-10Y", ageRange: "9-10 Years", shoulder: "29cm", sleeves: "10.5cm", chest: "37cm", length: "77cm" },
  8: { label: "10-11Y", ageRange: "10-11 Years", shoulder: "30cm", sleeves: "11cm", chest: "38cm", length: "80cm" },
  9: { label: "11-12Y", ageRange: "11-12 Years", shoulder: "31cm", sleeves: "11.5cm", chest: "39cm", length: "83cm" },
  10: { label: "12-13Y", ageRange: "12-13 Years", shoulder: "32cm", sleeves: "12cm", chest: "40cm", length: "86cm" },
  11: { label: "13-14Y", ageRange: "13-14 Years", shoulder: "33cm", sleeves: "12.5cm", chest: "41cm", length: "89cm" },
  12: { label: "14-15Y", ageRange: "14-15 Years", shoulder: "34cm", sleeves: "13cm", chest: "42cm", length: "92cm" },
};

export const SIZE_RECOMMENDATIONS = {
  onesies: {
    title: "Onesies & Rompers Size Guide",
    description: "Perfect fit recommendations for onesies and rompers",
    sizes: BABY_SIZES,
    tips: [
      "Measure your baby's chest across the widest part",
      "Organic cotton may shrink 5-10% — size up if concerned",
      "Leave room for growth (1-2cm extra)",
      "Check the care label for shrinkage warnings"
    ]
  },
  dresses: {
    title: "Dresses Size Guide",
    description: "Find the perfect dress size for your little one",
    sizes: BABY_SIZES,
    tips: [
      "Dresses should reach just above the knee",
      "Leave 2-3cm for movement around the chest",
      "Consider layering with tights in cooler months",
      "Our dresses are designed to fit comfortably"
    ]
  },
  tops: {
    title: "Tops & Tees Size Guide",
    description: "Size recommendations for tops and t-shirts",
    sizes: BABY_SIZES,
    tips: [
      "Should fit comfortably around the chest without being tight",
      "Sleeves should reach the wrist when arms are down",
      "Leave 2-3cm of fabric for growth",
      "Check the length — should not be too short or too long"
    ]
  },
  bottoms: {
    title: "Bottoms Size Guide",
    description: "Jeans, shorts, and trousers sizing guide",
    sizes: BABY_SIZES,
    tips: [
      "Waist should sit comfortably without needing a belt",
      "Length should reach to mid-shoe heel",
      "Allow 1-2cm growth room at the waist",
      "Elastic waist provides more comfort for growing kids"
    ]
  },
  default: {
    title: "Size Guide",
    description: "Find your perfect size",
    sizes: BABY_SIZES,
    tips: [
      "Measure your child's chest, length, and waist",
      "Leave room for growth and movement",
      "Our fabrics are pre-shrunk but check labels",
      "If between sizes, consider sizing up"
    ]
  }
};

export const CARE_INSTRUCTIONS = {
  organic_cotton: {
    title: "Care: 100% Organic Cotton",
    instructions: [
      "Wash in cold water (30°C or below)",
      "Use mild detergent (avoid bleach)",
      "Tumble dry on low heat or air dry for best results",
      "May shrink 5-10% in first wash",
      "Do not iron if possible, air dry to maintain shape"
    ]
  },
  cotton_blend: {
    title: "Care: Cotton Blend",
    instructions: [
      "Wash in warm water (40°C)",
      "Use regular detergent",
      "Tumble dry on medium heat",
      "May shrink 3-5% in first wash",
      "Can be ironed on medium heat if needed"
    ]
  },
  polyester: {
    title: "Care: Polyester",
    instructions: [
      "Wash in warm water (40°C)",
      "Use regular detergent",
      "Tumble dry on low to medium heat",
      "Minimal shrinkage",
      "Low maintenance and quick-drying"
    ]
  },
  delicate: {
    title: "Care: Delicate Fabrics",
    instructions: [
      "Hand wash or gentle machine cycle",
      "Use cold water",
      "Air dry preferred",
      "Avoid wringing or twisting",
      "Do not bleach"
    ]
  },
  default: {
    title: "General Care Instructions",
    instructions: [
      "Check the care label for specific instructions",
      "Wash before first wear",
      "Wash with similar colors",
      "Avoid fabric softeners",
      "Turn inside out before washing to preserve color"
    ]
  }
};

export const GROWTH_MILESTONES = [
  { age: "Newborn to 3 months", size: "0", what: "5-7 onesies, 3-4 tops, 2-3 bottoms" },
  { age: "3 to 6 months", size: "1", what: "5-7 onesies, 4-5 tops, 2-3 bottoms" },
  { age: "6 to 12 months", size: "2-3", what: "Transition to regular clothing, 4-5 tops, 2-3 bottoms" },
  { age: "1 to 2 years", size: "4-5", what: "More variety, 5-7 tops, 3-4 bottoms, 1-2 dresses" },
  { age: "2 to 3 years", size: "6", what: "Mix of clothing types, 7-10 pieces, developing style preferences" },
  { age: "3 to 5 years", size: "7-8", what: "Full wardrobe variety, 10+ pieces, can choose favorites" },
  { age: "5+ years", size: "9+", what: "Fashion-conscious, seasonal pieces, evolving taste" },
];
