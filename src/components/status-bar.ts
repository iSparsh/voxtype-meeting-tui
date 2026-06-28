import { Box, Text, t, fg, bg } from "@opentui/core";
import type { AppState } from "../state";
import { getTheme, type ThemeColor } from "../theme";

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function StatusBar(state: AppState) {
  const th = getTheme(state);

  const statusColors: Record<string, ThemeColor> = {
    idle:      th.textFaint,
    recording: th.green,
    paused:    th.yellow,
  };
  const statusLabels: Record<string, string> = {
    idle:      " IDLE ",
    recording: " ● REC ",
    paused:    " ⏸ PAUSE ",
  };

  const color = statusColors[state.status] ?? th.textFaint;
  const label = statusLabels[state.status] ?? " IDLE ";
  const indicator = bg(color)(fg("#000000")(label));
  const timerStr = state.status !== "idle" ? ` ${formatTimer(state.meetingTimer)}` : "";

  let hint: string;
  let hintColor = th.textFaint;

  if (state.statusMessage) {
    hint = `  ${state.statusMessage}`;
    hintColor = th.yellow;
  } else if (state.view === "start-dialog") {
    hint = "  type title  Enter start  Esc cancel";
  } else if (state.view === "setup") {
    hint = "  Enter or Esc to dismiss";
  } else if (state.view === "settings") {
    hint = "  j/k navigate  ← → / Space toggle/cycle  Esc close";
  } else if (state.showExportPicker) {
    hint = "  j/k select  Enter export  Esc cancel";
  } else if (state.focusedPanel === "main") {
    const recHint = state.status !== "idle" ? "  p pause/resume  Esc stop  ·" : "";
    hint = `${recHint}  j/k scroll  e export  o editor  y yank  h sidebar  dd delete  m summary  q quit`;
  } else if (state.status !== "idle") {
    hint = "  p pause/resume  Esc stop  j/k nav  l transcript  q quit";
    hintColor = th.yellow;
  } else {
    hint = "  n new  j/k nav  Enter/l open  e export  o editor  y yank  dd delete  m summary  s settings  q quit";
  }

  return Box(
    {
      width: "100%",
      height: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: th.bgDeep,
    },
    Text({ content: t`${indicator}` }),
    Text({ content: timerStr, fg: th.textDim }),
    Text({ content: hint, fg: hintColor }),
  );
}
