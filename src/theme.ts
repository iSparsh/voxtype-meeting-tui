import { RGBA } from "@opentui/core";
import type { AppState } from "./state";

// Theme color slots accept either a hex string or an RGBA (for terminal-native indexed colors)
export type ThemeColor = string | RGBA;

export interface Theme {
  bg: ThemeColor;
  bgDeep: ThemeColor;
  bgOverlay: ThemeColor;
  bgSidebar: ThemeColor;
  bgHeader: ThemeColor;
  bgSubtle: ThemeColor;
  bgSection: ThemeColor;
  bgHighlight: ThemeColor;
  bgSelected: ThemeColor;
  bgDanger: ThemeColor;
  borderFocus: ThemeColor;
  borderDim: ThemeColor;
  text: ThemeColor;
  textBody: ThemeColor;
  textSecondary: ThemeColor;
  textDim: ThemeColor;
  textDimmer: ThemeColor;
  textFaint: ThemeColor;
  textMuted: ThemeColor;
  textVeryFaint: ThemeColor;
  accent: ThemeColor;
  accentSoft: ThemeColor;
  green: ThemeColor;
  yellow: ThemeColor;
  red: ThemeColor;
  brightGreen: ThemeColor;
}

// ── Hex palettes ────────────────────────────────────────────────────────────

const dark: Theme = {
  bg:            "#0f0f1a",
  bgDeep:        "#0a0a14",
  bgOverlay:     "#0d0d1a",
  bgSidebar:     "#1a1a2e",
  bgHeader:      "#151528",
  bgSubtle:      "#111122",
  bgSection:     "#1a1a3e",
  bgHighlight:   "#1e2a3e",
  bgSelected:    "#334466",
  bgDanger:      "#140808",
  borderFocus:   "#5588CC",
  borderDim:     "#333333",
  text:          "#FFFFFF",
  textBody:      "#CCCCCC",
  textSecondary: "#AAAAAA",
  textDim:       "#888888",
  textDimmer:    "#666666",
  textFaint:     "#555555",
  textMuted:     "#444466",
  textVeryFaint: "#333355",
  accent:        "#88BBFF",
  accentSoft:    "#AACCFF",
  green:         "#22C55E",
  yellow:        "#EAB308",
  red:           "#EF4444",
  brightGreen:   "#00FF88",
};

const light: Theme = {
  bg:            "#F4F4F8",
  bgDeep:        "#E8E8EF",
  bgOverlay:     "#FFFFFF",
  bgSidebar:     "#EEEEEF",
  bgHeader:      "#E0E0EA",
  bgSubtle:      "#E5E5F0",
  bgSection:     "#DDDDEF",
  bgHighlight:   "#D0DCEF",
  bgSelected:    "#B0C4E0",
  bgDanger:      "#FFF0F0",
  borderFocus:   "#3B6FA8",
  borderDim:     "#AAAAAA",
  text:          "#111111",
  textBody:      "#2A2A2A",
  textSecondary: "#555555",
  textDim:       "#666666",
  textDimmer:    "#7A7A7A",
  textFaint:     "#909090",
  textMuted:     "#7777AA",
  textVeryFaint: "#AAAACC",
  accent:        "#1E40AF",
  accentSoft:    "#2563EB",
  green:         "#16A34A",
  yellow:        "#A16207",
  red:           "#B91C1C",
  brightGreen:   "#15803D",
};

// ── Terminal-native palette ─────────────────────────────────────────────────
// Uses ANSI color slots 0–15 so the app respects whatever color scheme is
// configured in the terminal (catppuccin, gruvbox, nord, solarized, etc.).
// RGBA.fromIndex(N) emits ESC[38;5;Nm and the renderer resolves it through
// the detected palette rather than hardcoding an RGB value.

const a = RGBA.fromIndex.bind(RGBA); // shorthand: a(4) = ANSI color 4

const terminal: Theme = {
  // Backgrounds — default terminal bg for most panels, ANSI 0 for dark strips
  bg:            RGBA.defaultBackground(),
  bgDeep:        a(0),                     // ANSI black — darker strips (footer/header bars)
  bgOverlay:     RGBA.defaultBackground(),
  bgSidebar:     RGBA.defaultBackground(),
  bgHeader:      a(0),                     // ANSI black — slightly distinct header
  bgSubtle:      a(0),
  bgSection:     a(8),                     // bright-black/gray — section separators
  bgHighlight:   a(4),                     // blue — cursor row highlight
  bgSelected:    a(4),                     // blue — selected item in sidebar
  bgDanger:      a(1),                     // red — delete dialog background

  // Borders
  borderFocus:   a(12),                    // bright blue
  borderDim:     a(8),                     // bright-black / dark gray

  // Text — default fg for primary, indexed grays for dimmer levels
  text:          RGBA.defaultForeground(),
  textBody:      a(7),                     // ANSI white
  textSecondary: a(15),                    // bright white
  textDim:       a(8),                     // bright-black / gray
  textDimmer:    a(8),
  textFaint:     a(8),
  textMuted:     a(6),                     // cyan — subtle muted accent
  textVeryFaint: a(8),

  // Semantic / accent
  accent:        a(12),                    // bright blue
  accentSoft:    a(14),                    // bright cyan
  green:         a(10),                    // bright green
  yellow:        a(11),                    // bright yellow
  red:           a(9),                     // bright red
  brightGreen:   a(10),
};

// ── Selector ────────────────────────────────────────────────────────────────

export function getTheme(state: AppState): Theme {
  if (state.palette === "terminal") return terminal;
  return state.themeMode === "light" ? light : dark;
}
