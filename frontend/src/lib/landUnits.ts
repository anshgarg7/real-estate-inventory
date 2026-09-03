export const LAND_UNITS = [
  "Sq. Yard (Gaj)",
  "Sq. Feet",
  "Sq. Meter",
  "Marla",
  "Kanal",
  "Bigha",
  "Guntha",
  "Cent",
  "Ground",
  "Katha",
  "Acre",
  "Hectare",
] as const;

export const DEFAULT_LAND_UNIT: (typeof LAND_UNITS)[number] = "Sq. Yard (Gaj)";
