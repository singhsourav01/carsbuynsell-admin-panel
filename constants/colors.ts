const ORANGE = "#FF6B2C";
const DARK_BG = "#0D0D18";
const CARD_BG = "#16162A";
const CARD_BORDER = "#252540";

export const Colors = {
  primary: ORANGE,
  background: DARK_BG,
  card: CARD_BG,
  cardBorder: CARD_BORDER,
  surface: "#1E1E38",
  text: "#FFFFFF",
  textSecondary: "#9999BB",
  textMuted: "#555577",
  success: "#22C55E",
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  tint: ORANGE,
  tabIconDefault: "#555577",
  tabIconSelected: ORANGE,
  inputBg: "#1E1E38",
  inputBorder: "#303055",
  overlay: "rgba(13,13,24,0.92)",
};

export default {
  light: {
    text: Colors.text,
    background: Colors.background,
    tint: Colors.primary,
    tabIconDefault: Colors.tabIconDefault,
    tabIconSelected: Colors.primary,
  },
};
