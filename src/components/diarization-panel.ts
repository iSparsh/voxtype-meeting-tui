import { Box, Text, t, fg } from "@opentui/core";
import type { CliRenderer } from "@opentui/core";
import type { AppState } from "../state";

export function DiarizationPanel(renderer: CliRenderer, state: AppState) {
  const panelWidth = Math.min(50, renderer.width - 10);
  const panelHeight = 12;
  const leftOffset = Math.floor((renderer.width - panelWidth) / 2);
  const topOffset = 4;

  return Box(
    {
      position: "absolute",
      left: leftOffset,
      top: topOffset,
      width: panelWidth,
      height: panelHeight,
      borderStyle: "double",
      borderColor: "#88BBFF",
      backgroundColor: "#0d0d1a",
      flexDirection: "column",
      title: " Diarization Settings ",
      titleColor: "#88BBFF",
    },
    Box(
      {
        width: "100%",
        height: 1,
        paddingLeft: 1,
        paddingRight: 1,
      },
      Text({
        content: t`${fg("#AAAAAA")("enabled".padEnd(24))}${fg(state.diarization.enabled ? "#22C55E" : "#EF4444")(String(state.diarization.enabled))}`,
      }),
    ),
    Box(
      {
        width: "100%",
        height: 1,
        paddingLeft: 1,
        paddingRight: 1,
      },
      Text({
        content: t`${fg("#AAAAAA")("backend".padEnd(24))}${fg("#88BBFF")(state.diarization.backend)}`,
      }),
    ),
    Box(
      {
        width: "100%",
        height: 1,
        paddingLeft: 1,
        paddingRight: 1,
      },
      Text({
        content: t`${fg("#AAAAAA")("max_speakers".padEnd(24))}${fg("#88BBFF")(String(state.diarization.maxSpeakers))}`,
      }),
    ),
    Box(
      {
        width: "100%",
        height: 1,
        paddingLeft: 1,
        paddingRight: 1,
        paddingTop: 1,
      },
      Text({ content: "Backends:", fg: "#888888" }),
    ),
    Box(
      {
        width: "100%",
        height: 1,
        paddingLeft: 1,
        paddingRight: 1,
      },
      Text({ content: "  simple   - mic/loopback source attribution", fg: "#666666" }),
    ),
    Box(
      {
        width: "100%",
        height: 1,
        paddingLeft: 1,
        paddingRight: 1,
      },
      Text({ content: "  ml       - ONNX speaker embeddings (ECAPA-TDNN)", fg: "#666666" }),
    ),
    Box(
      {
        width: "100%",
        height: 1,
        paddingLeft: 1,
        paddingRight: 1,
      },
      Text({ content: "  subprocess - ML in separate process", fg: "#666666" }),
    ),
    Box(
      {
        width: "100%",
        height: 1,
        paddingLeft: 1,
        paddingRight: 1,
      },
      Text({ content: "Tab: cycle backends · Space: toggle · Esc: back", fg: "#555555" }),
    ),
  );
}
