import { Box, Text, t, bold, fg, bg } from "@opentui/core";
import type { AppState } from "../state";
import { getTheme } from "../theme";

export function Sidebar(state: AppState) {
  const th = getTheme(state);
  const sidebarWidth = 30;
  const emptyLabel = state.isLoading ? "(loading…)" : "(no meetings)";
  const items = state.meetings.length === 0
    ? [{ name: emptyLabel, description: "" }]
    : state.meetings.map((m) => ({
        name: m.title,
        description: `${m.date} · ${m.duration}`,
      }));

  const listItems = items.map((item, i) => {
    const isSelected = i === state.selectedMeetingIndex && state.focusedPanel === "sidebar";
    const isActiveMeeting = state.meetings[i]?.status === "recording" || state.meetings[i]?.status === "paused";

    const indicator = isActiveMeeting ? "● " : "  ";
    const titleFg = isActiveMeeting ? th.brightGreen : th.textBody;

    const nameContent = isSelected
      ? t`${indicator}${bold(bg(th.bgSelected)(fg(th.text)(item.name)))}`
      : t`${indicator}${fg(titleFg)(item.name)}`;

    const descContent = isSelected
      ? t`${bg(th.bgSelected)(fg(th.textDim)(item.description))}`
      : t`${fg(th.textDimmer)(item.description)}`;

    return Box(
      {
        width: "100%",
        height: 2,
        backgroundColor: isSelected ? th.bgSelected : "transparent",
        paddingLeft: 1,
        paddingRight: 1,
        flexDirection: "column",
      },
      Text({ content: nameContent }),
      Text({ content: descContent }),
    );
  });

  return Box(
    {
      width: sidebarWidth,
      height: "100%",
      flexDirection: "column",
      borderStyle: "single",
      borderColor: state.focusedPanel === "sidebar" ? th.borderFocus : th.borderDim,
      backgroundColor: th.bgSidebar,
      title: " Meetings ",
      titleColor: state.focusedPanel === "sidebar" ? th.accent : th.textDimmer,
    },
    Box(
      {
        width: "100%",
        height: 1,
        backgroundColor: th.bgSubtle,
        paddingLeft: 1,
      },
      Text({ content: "j/k nav · Enter select", fg: th.textDimmer }),
    ),
    Box(
      {
        width: "100%",
        flexGrow: 1,
        flexDirection: "column",
      },
      ...listItems,
    ),
    Box(
      {
        width: "100%",
        height: 1,
        backgroundColor: th.bgSubtle,
        paddingLeft: 1,
        paddingRight: 1,
      },
      Text({ content: `${state.meetings.length} meeting${state.meetings.length !== 1 ? "s" : ""}`, fg: th.textFaint }),
    ),
  );
}

export function sidebarNavigate(state: AppState, direction: "up" | "down") {
  if (state.meetings.length === 0) return;
  if (direction === "up") {
    state.selectedMeetingIndex = Math.max(0, state.selectedMeetingIndex - 1);
  } else {
    state.selectedMeetingIndex = Math.min(state.meetings.length - 1, state.selectedMeetingIndex + 1);
  }
}
