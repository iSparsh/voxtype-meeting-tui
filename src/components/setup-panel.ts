import { Box, Text, t, bold, fg } from "@opentui/core";
import type { CliRenderer } from "@opentui/core";
import type { AppState } from "../state";
import { getTheme, type ThemeColor } from "../theme";

export function SetupPanel(renderer: CliRenderer, state: AppState) {
  const th = getTheme(state);
  const panelWidth = Math.min(70, renderer.width - 4);
  const leftOffset = Math.floor((renderer.width - panelWidth) / 2);
  const topOffset = 2;

  function row(content: string, color: ThemeColor = th.textBody) {
    return Box(
      { width: "100%", paddingLeft: 2, paddingRight: 2, height: 1 },
      Text({ content: t`${fg(color)(content)}` }),
    );
  }

  function gap() {
    return Box({ width: "100%", height: 1 });
  }

  return Box(
    {
      position: "absolute",
      left: leftOffset,
      top: topOffset,
      width: panelWidth,
      height: renderer.height - topOffset - 2,
      borderStyle: "double",
      borderColor: th.yellow,
      backgroundColor: th.bgOverlay,
      flexDirection: "column",
      title: " AI Summarization Required ",
      titleColor: th.yellow,
    },
    gap(),
    Box(
      { width: "100%", paddingLeft: 2, height: 1 },
      Text({ content: t`${bold(fg(th.yellow)("AI summarization must be configured before use."))}` }),
    ),
    gap(),
    row("Voxtype Meeting TUI uses AI summarization to generate meeting notes,", th.textDim),
    row("action items, and key decisions from your transcripts.", th.textDim),
    gap(),
    Box(
      { width: "100%", paddingLeft: 2, height: 1 },
      Text({ content: t`${bold(fg(th.accent)("Option 1 — Local (Ollama, recommended)"))}` }),
    ),
    row("1. Install Ollama from https://ollama.ai"),
    row("2. Pull a model:  ollama pull llama3.2"),
    row("3. Add to ~/.config/voxtype/config.toml:"),
    gap(),
    Box(
      { width: "100%", paddingLeft: 4, height: 1 },
      Text({ content: "[meeting.summary]", fg: th.green }),
    ),
    Box(
      { width: "100%", paddingLeft: 4, height: 1 },
      Text({ content: 'backend = "local"', fg: th.green }),
    ),
    Box(
      { width: "100%", paddingLeft: 4, height: 1 },
      Text({ content: 'ollama_url = "http://localhost:11434"', fg: th.green }),
    ),
    Box(
      { width: "100%", paddingLeft: 4, height: 1 },
      Text({ content: 'ollama_model = "llama3.2"', fg: th.green }),
    ),
    gap(),
    Box(
      { width: "100%", paddingLeft: 2, height: 1 },
      Text({ content: t`${bold(fg(th.accent)("Option 2 — Remote API"))}` }),
    ),
    Box(
      { width: "100%", paddingLeft: 4, height: 1 },
      Text({ content: 'backend = "remote"', fg: th.green }),
    ),
    Box(
      { width: "100%", paddingLeft: 4, height: 1 },
      Text({ content: 'remote_endpoint = "https://your-api.example.com/summarize"', fg: th.green }),
    ),
    Box(
      { width: "100%", paddingLeft: 4, height: 1 },
      Text({ content: 'remote_api_key = "your-api-key"', fg: th.green }),
    ),
    gap(),
    row("After editing the config, restart voxtype-meeting-tui.", th.textDim),
    gap(),
    Box(
      { width: "100%", paddingLeft: 2, height: 1 },
      Text({ content: "Press Enter or Esc to dismiss and continue anyway", fg: th.textFaint }),
    ),
  );
}
