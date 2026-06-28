import { Box, Text, t, fg, bg } from "@opentui/core";
import type { CliRenderer } from "@opentui/core";
import type { AppState } from "../state";
import { getTheme } from "../theme";

export const EXPORT_FORMATS = [
  { label: "Markdown",   ext: "md",   flag: "markdown" },
  { label: "Plain text", ext: "txt",  flag: "text" },
  { label: "JSON",       ext: "json", flag: "json" },
  { label: "SRT",        ext: "srt",  flag: "srt" },
  { label: "WebVTT",     ext: "vtt",  flag: "vtt" },
] as const;

export function ExportPicker(renderer: CliRenderer, state: AppState) {
  const th = getTheme(state);
  const dialogWidth = 36;
  const dialogLeft = Math.floor((renderer.width - dialogWidth) / 2);
  const dialogTop = Math.floor((renderer.height - EXPORT_FORMATS.length - 4) / 2);

  const rows = EXPORT_FORMATS.map((fmt, i) => {
    const selected = i === state.exportPickerCursor;
    return Box(
      {
        width: "100%",
        height: 1,
        paddingLeft: 2,
        backgroundColor: selected ? th.bgHighlight : "transparent",
      },
      Text({
        content: selected
          ? t`${bg(th.bgHighlight)(fg(th.text)(` ▸ ${fmt.label.padEnd(12)} .${fmt.ext}`))}`
          : t`${fg(th.textDimmer)(`   ${fmt.label.padEnd(12)} .${fmt.ext}`)}`,
      }),
    );
  });

  return Box(
    {
      position: "absolute",
      left: dialogLeft,
      top: dialogTop,
      width: dialogWidth,
      height: EXPORT_FORMATS.length + 4,
      borderStyle: "double",
      borderColor: th.borderFocus,
      backgroundColor: th.bgOverlay,
      flexDirection: "column",
      title: " Export Format ",
      titleColor: th.accent,
    },
    Box({ width: "100%", height: 1 }),
    ...rows,
    Box(
      { width: "100%", height: 1, paddingLeft: 2, backgroundColor: th.bgDeep },
      Text({ content: "j/k select  Enter export  Esc cancel", fg: th.textMuted }),
    ),
  );
}
