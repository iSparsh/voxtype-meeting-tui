import { Box, Text, t, bold, fg, bg } from "@opentui/core";
import type { CliRenderer } from "@opentui/core";
import type { AppState } from "../state";
import { getTheme } from "../theme";

export type SettingItem =
  | { type: "bool"; label: string; get: (s: AppState) => boolean; set: (s: AppState, v: boolean) => void }
  | { type: "cycle"; label: string; choices: readonly string[]; get: (s: AppState) => string; set: (s: AppState, v: string) => void }
  | { type: "display"; label: string; get: (s: AppState) => string };

export const SETTINGS_ITEMS: SettingItem[] = [
  // Meeting
  { type: "bool", label: "meeting.enabled", get: (s) => s.meeting.enabled, set: (s, v) => { s.meeting.enabled = v; } },
  { type: "display", label: "chunk_duration_secs", get: (s) => String(s.meeting.chunkDurationSecs) },
  { type: "display", label: "storage_path", get: (s) => s.meeting.storagePath },
  { type: "bool", label: "retain_audio", get: (s) => s.meeting.retainAudio, set: (s, v) => { s.meeting.retainAudio = v; } },
  { type: "display", label: "max_duration_mins", get: (s) => String(s.meeting.maxDurationMins) },
  // Audio
  { type: "display", label: "mic_device", get: (s) => s.audio.micDevice },
  { type: "display", label: "loopback_device", get: (s) => s.audio.loopbackDevice },
  { type: "display", label: "vad_threshold", get: (s) => String(s.audio.vadThreshold) },
  // Diarization
  { type: "bool", label: "diarization.enabled", get: (s) => s.diarization.enabled, set: (s, v) => { s.diarization.enabled = v; } },
  { type: "cycle", label: "diarization.backend", choices: ["simple", "ml", "subprocess"] as const, get: (s) => s.diarization.backend, set: (s, v) => { s.diarization.backend = v as "simple" | "ml" | "subprocess"; } },
  { type: "display", label: "max_speakers", get: (s) => String(s.diarization.maxSpeakers) },
  // Summarization
  { type: "cycle", label: "summary.backend", choices: ["disabled", "local", "remote"] as const, get: (s) => s.summary.backend, set: (s, v) => { s.summary.backend = v as "local" | "remote" | "disabled"; } },
  { type: "display", label: "ollama_url", get: (s) => s.summary.ollamaUrl },
  { type: "display", label: "ollama_model", get: (s) => s.summary.ollamaModel },
  { type: "display", label: "timeout_secs", get: (s) => String(s.summary.timeoutSecs) },
];

const SECTION_BREAKS: Record<number, string> = {
  0: "Meeting",
  5: "Audio",
  8: "Diarization",
  11: "Summarization",
};

export const SETTINGS_COUNT = SETTINGS_ITEMS.length;

export function applySettingsAction(state: AppState, direction: "toggle" | "next" | "prev") {
  const item = SETTINGS_ITEMS[state.settingsCursor];
  if (!item) return;

  if (item.type === "bool") {
    item.set(state, !item.get(state));
  } else if (item.type === "cycle") {
    const choices = item.choices;
    const cur = choices.indexOf(item.get(state));
    const delta = direction === "prev" ? -1 : 1;
    const next = choices[(cur + delta + choices.length) % choices.length]!;
    item.set(state, next);
  }
}

export function SettingsPanel(renderer: CliRenderer, state: AppState) {
  const th = getTheme(state);
  const panelWidth = Math.min(62, renderer.width - 6);
  const panelHeight = Math.min(SETTINGS_ITEMS.length + Object.keys(SECTION_BREAKS).length + 4, renderer.height - 4);
  const leftOffset = Math.floor((renderer.width - panelWidth) / 2);
  const topOffset = 2;

  const rows: ReturnType<typeof Box>[] = [];

  SETTINGS_ITEMS.forEach((item, i) => {
    const sectionLabel = SECTION_BREAKS[i];
    if (sectionLabel) {
      rows.push(
        Box(
          { width: "100%", height: 1, paddingLeft: 1, backgroundColor: th.bgSection },
          Text({ content: t`${bold(fg(th.accent)(sectionLabel))}` }),
        ),
      );
    }

    const isCursor = i === state.settingsCursor;
    const value = item.get(state);
    const isEditable = item.type !== "display";

    let valueColor = th.accent;
    if (item.type === "bool") {
      valueColor = (value as unknown as boolean) ? th.green : th.red;
    } else if (item.type === "cycle" && item.label === "summary.backend") {
      valueColor = value !== "disabled" ? th.green : th.red;
    }

    const labelText = item.label.padEnd(26);
    const valueText = String(value);
    const hint = isCursor && isEditable ? " ← →" : "";

    const rowContent = isCursor
      ? t`${bg(th.bgHighlight)(fg(th.text)(` ▸ ${labelText}`))}${bg(th.bgHighlight)(fg(valueColor)(valueText))}${bg(th.bgHighlight)(fg(th.textMuted)(hint))}`
      : t`${fg(th.textDimmer)("   ")}${fg(th.textSecondary)(labelText)}${fg(valueColor)(valueText)}`;

    rows.push(
      Box(
        {
          width: "100%",
          height: 1,
          flexDirection: "row",
          paddingLeft: 1,
          paddingRight: 1,
          backgroundColor: isCursor ? th.bgHighlight : "transparent",
        },
        Text({ content: rowContent }),
      ),
    );
  });

  return Box(
    {
      position: "absolute",
      left: leftOffset,
      top: topOffset,
      width: panelWidth,
      height: panelHeight,
      borderStyle: "double",
      borderColor: th.borderFocus,
      backgroundColor: th.bgOverlay,
      flexDirection: "column",
      title: " Settings ",
      titleColor: th.accent,
    },
    ...rows,
    Box(
      { width: "100%", height: 1, paddingLeft: 1, paddingRight: 1, backgroundColor: th.bgDeep, marginTop: 1 },
      Text({ content: "j/k navigate  ← → / Space toggle/cycle  Esc close", fg: th.textMuted }),
    ),
  );
}
