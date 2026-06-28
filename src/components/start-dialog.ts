import { Box, Text, t, fg, bg } from "@opentui/core";
import type { CliRenderer } from "@opentui/core";
import type { AppState } from "../state";
import { getTheme } from "../theme";

export function StartDialog(renderer: CliRenderer, state: AppState) {
  const th = getTheme(state);
  const dialogWidth = Math.min(56, renderer.width - 6);
  const dialogLeft = Math.floor((renderer.width - dialogWidth) / 2);
  const dialogTop = Math.floor((renderer.height - 8) / 2);

  const inputText = state.meetingTitleInput;
  const cursor = "█";
  const inputDisplay = inputText + cursor;
  const maxInputWidth = dialogWidth - 6;

  const visible =
    inputDisplay.length > maxInputWidth
      ? inputDisplay.slice(inputDisplay.length - maxInputWidth)
      : inputDisplay;

  return Box(
    {
      position: "absolute",
      left: dialogLeft,
      top: dialogTop,
      width: dialogWidth,
      height: 8,
      borderStyle: "double",
      borderColor: th.borderFocus,
      backgroundColor: th.bgOverlay,
      flexDirection: "column",
      title: " New Meeting ",
      titleColor: th.accent,
    },
    Box({ width: "100%", height: 1 }),
    Box(
      { width: "100%", height: 1, paddingLeft: 2 },
      Text({ content: t`${fg(th.textDim)("Meeting title:")}` }),
    ),
    Box(
      {
        width: "100%",
        height: 1,
        paddingLeft: 2,
        paddingRight: 2,
        backgroundColor: th.bgHighlight,
        marginTop: 1,
      },
      Text({ content: t`${bg(th.bgHighlight)(fg(th.text)(visible))}` }),
    ),
    Box({ width: "100%", height: 1 }),
    Box(
      { width: "100%", height: 1, paddingLeft: 2 },
      Text({ content: "Enter  start    Esc  cancel    (blank = auto title)", fg: th.textMuted }),
    ),
  );
}
