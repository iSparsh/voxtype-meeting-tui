import { Box, Text, t, bold, fg } from "@opentui/core";
import type { CliRenderer } from "@opentui/core";
import type { AppState } from "../state";
import { getTheme } from "../theme";

function TranscriptView(renderer: CliRenderer, state: AppState) {
  const th = getTheme(state);
  const meeting = state.meetings[state.selectedMeetingIndex];

  if (!meeting) {
    return Box(
      {
        flexGrow: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: th.bg,
      },
      Text({ content: "Select a meeting in the sidebar", fg: th.textFaint }),
      Text({ content: "Enter  load transcript", fg: th.textMuted }),
    );
  }

  if (!meeting.transcriptLoaded) {
    if (state.focusedPanel === "main") {
      return Box(
        {
          flexGrow: 1,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: th.bg,
        },
        Text({ content: "Loading transcript…", fg: th.textFaint }),
      );
    }
    return Box(
      {
        flexGrow: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: th.bg,
      },
      Text({ content: t`${bold(fg(th.textBody)(meeting.title))}` }),
      Text({ content: `${meeting.date}  ·  ${meeting.duration}`, fg: th.textDimmer }),
      Text({ content: "", height: 1 }),
      Text({ content: "Enter  open transcript  ·  Tab  switch panes", fg: th.textMuted }),
    );
  }

  // Header 4 rows + border 2 + status bar 1 = 7
  const availableRows = renderer.height - 7;
  const chunks = meeting.transcriptChunks;
  const scrollOffset = Math.min(
    state.transcriptScrollOffset,
    Math.max(0, chunks.length - availableRows),
  );
  const visibleChunks = chunks.slice(scrollOffset, scrollOffset + availableRows);
  const hasMore = chunks.length > scrollOffset + availableRows;

  const chunkRows = visibleChunks.map((chunk) => {
    const line = chunk.text;
    let textNode: ReturnType<typeof Text>;
    if (line.startsWith("# ")) {
      textNode = Text({ content: t`${bold(fg(th.text)(line.slice(2)))}` });
    } else if (line.startsWith("## ")) {
      textNode = Text({ content: t`${bold(fg(th.accent)(line.slice(3)))}` });
    } else if (line.startsWith("### ")) {
      textNode = Text({ content: t`${fg(th.accentSoft)(line.slice(4))}` });
    } else if (line.startsWith("**") && line.endsWith("**")) {
      textNode = Text({ content: t`${bold(fg(th.textBody)(line.slice(2, -2)))}` });
    } else {
      textNode = Text({ content: line, fg: th.textBody });
    }
    return Box({ width: "100%", paddingLeft: 2, paddingRight: 1 }, textNode);
  });

  const scrollInfo =
    chunks.length > 0
      ? `  ${scrollOffset + 1}–${Math.min(scrollOffset + availableRows, chunks.length)}/${chunks.length}`
      : "";

  return Box(
    { flexGrow: 1, flexDirection: "column", backgroundColor: th.bg },
    Box(
      {
        width: "100%",
        height: 4,
        flexDirection: "column",
        paddingLeft: 1,
        paddingRight: 1,
        backgroundColor: th.bgHeader,
      },
      Text({ content: t`${bold(fg(th.text)(meeting.title))}` }),
      Box(
        { width: "100%", flexDirection: "row" },
        Text({
          content: `${meeting.date}  ·  ${meeting.duration}  ·  ${meeting.wordCount} words  ·  ${meeting.chunkCount} chunks`,
          fg: th.textDim,
        }),
        Text({ content: scrollInfo, fg: th.textFaint }),
      ),
      Text({ content: meeting.id, fg: th.textMuted }),
    ),
    Box(
      { width: "100%", flexGrow: 1, flexDirection: "column", paddingTop: 1 },
      ...(chunkRows.length > 0
        ? chunkRows
        : [Text({ content: "No transcript available", fg: th.textFaint, paddingLeft: 1 })]),
      ...(hasMore ? [Text({ content: "  ↓ more", fg: th.textVeryFaint })] : []),
    ),
  );
}

function WelcomeView(state: AppState) {
  const th = getTheme(state);

  if (state.isLoading) {
    return Box(
      {
        flexGrow: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: th.bg,
      },
      Text({ content: t`${bold(fg(th.accentSoft)("Voxtype Meeting TUI"))}` }),
      Text({ content: "", height: 1 }),
      Text({ content: "Loading…", fg: th.textFaint }),
    );
  }

  const K = 10; // key column width
  const row = (key: string, desc: string) =>
    Text({ content: t`${fg(th.textBody)(key.padEnd(K))}${fg(th.textDimmer)(desc)}` });

  return Box(
    {
      flexGrow: 1,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: th.bg,
    },
    Text({ content: t`${bold(fg(th.accentSoft)("Voxtype Meeting TUI"))}` }),
    Text({ content: "", height: 1 }),
    Box(
      { flexDirection: "column" },
      row("n",       "start new meeting"),
      row("j / k",   "navigate sidebar"),
      row("Enter",   "open transcript"),
      row("Tab",     "switch panes"),
      row("dd",      "delete meeting"),
      row("e",       "export"),
      row("o",       "open in editor"),
      row("y",       "yank to clipboard"),
      row("m",       "ai summary"),
      row("s",       "settings"),
      row("q",       "quit"),
    ),
    Text({ content: "", height: 1 }),
    Text({ content: "v0.1.0  ·  backed by voxtype CLI", fg: th.textVeryFaint }),
  );
}

export function MainPanel(renderer: CliRenderer, state: AppState) {
  const th = getTheme(state);
  const innerWidth = renderer.width - 31;
  const mainFocused = state.focusedPanel === "main";
  const hasMeetings = state.meetings.length > 0;

  let title = "";
  let titleColor = th.textDimmer;
  if (state.status === "recording") {
    title = " ● RECORDING";
    titleColor = th.green;
  } else if (state.status === "paused") {
    title = " ⏸ PAUSED";
    titleColor = th.yellow;
  }

  const body = mainFocused && hasMeetings
    ? TranscriptView(renderer, state)
    : WelcomeView(state);

  return Box(
    {
      width: innerWidth,
      height: "100%",
      flexDirection: "column",
      borderStyle: "single",
      borderColor: mainFocused ? th.borderFocus : th.borderDim,
      backgroundColor: th.bg,
      title,
      titleColor,
    },
    body,
  );
}
