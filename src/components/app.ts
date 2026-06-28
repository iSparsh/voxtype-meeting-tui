import { Box, Text, t, bold, fg } from "@opentui/core";
import type { CliRenderer } from "@opentui/core";
import { Sidebar } from "./sidebar";
import { MainPanel } from "./main-panel";
import { StatusBar } from "./status-bar";
import { SettingsPanel } from "./settings-panel";
import { SetupPanel } from "./setup-panel";
import { StartDialog } from "./start-dialog";
import { ExportPicker } from "./export-picker";
import type { AppState } from "../state";
import { getTheme } from "../theme";

export function App(renderer: CliRenderer, state: AppState) {
  const th = getTheme(state);

  const content = Box(
    {
      flexDirection: "row",
      width: "100%",
      height: renderer.height - 1,
    },
    Sidebar(state),
    MainPanel(renderer, state),
  );

  const statusBar = StatusBar(state);

  const base = Box(
    { flexDirection: "column", width: "100%", height: "100%" },
    content,
    statusBar,
  );

  if (state.view === "start-dialog") {
    return Box(
      { flexDirection: "column", width: "100%", height: "100%" },
      content,
      statusBar,
      StartDialog(renderer, state),
    );
  }

  if (state.view === "setup") {
    return Box(
      { flexDirection: "column", width: "100%", height: "100%" },
      content,
      statusBar,
      SetupPanel(renderer, state),
    );
  }

  if (state.view === "settings") {
    return Box(
      { flexDirection: "column", width: "100%", height: "100%" },
      content,
      statusBar,
      SettingsPanel(renderer, state),
    );
  }

  if (state.showExportPicker) {
    return Box(
      { flexDirection: "column", width: "100%", height: "100%" },
      content,
      statusBar,
      ExportPicker(renderer, state),
    );
  }

  if (state.showConfirmDelete) {
    const meeting = state.meetings.find((m) => m.id === state.confirmDeleteMeetingId);
    const dialogWidth = 44;
    const dialogLeft = Math.floor((renderer.width - dialogWidth) / 2);
    const dialogTop = Math.floor((renderer.height - 6) / 2);

    return Box(
      { flexDirection: "column", width: "100%", height: "100%" },
      content,
      statusBar,
      Box(
        {
          position: "absolute",
          left: dialogLeft,
          top: dialogTop,
          width: dialogWidth,
          height: 6,
          borderStyle: "double",
          borderColor: th.red,
          backgroundColor: th.bgDanger,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        },
        Text({ content: t`${bold(fg(th.red)("Delete this meeting?"))}` }),
        Text({ content: meeting?.title ?? "", fg: th.textDim }),
        Text({ content: "y  confirm    n / Esc  cancel", fg: th.textFaint }),
      ),
    );
  }

  return base;
}
