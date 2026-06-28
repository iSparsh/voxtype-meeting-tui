#!/usr/bin/env bun
import { createCliRenderer, type ThemeMode } from "@opentui/core";
import { createInitialState, type AppState, type Meeting, type TranscriptChunk } from "./state";
import { App } from "./components/app";
import { sidebarNavigate } from "./components/sidebar";
import { SETTINGS_COUNT, applySettingsAction } from "./components/settings-panel";
import { EXPORT_FORMATS } from "./components/export-picker";

const DB_PATH = `${process.env.HOME}/.local/share/voxtype/meetings/index.db`;
const CONFIG_PATH = `${process.env.HOME}/.config/voxtype/config.toml`;

function formatDuration(secs: number | null): string {
  if (!secs) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function checkSummaryConfig(): Promise<boolean> {
  try {
    const text = await Bun.file(CONFIG_PATH).text();
    const sectionStart = text.indexOf("[meeting.summary]");
    if (sectionStart === -1) return false;
    const afterHeader = text.slice(sectionStart + "[meeting.summary]".length);
    // Section ends at the next [header] or end of file
    const nextSection = afterHeader.search(/\n\[/);
    const section = nextSection === -1 ? afterHeader : afterHeader.slice(0, nextSection);
    return /^\s*backend\s*=\s*"(local|remote)"/m.test(section);
  } catch {
    return false;
  }
}

async function loadMeetingsFromDb(): Promise<Meeting[]> {
  try {
    const result = await Bun.$`sqlite3 -json ${DB_PATH} "SELECT id, title, started_at, ended_at, duration_secs, status, chunk_count, storage_path FROM meetings ORDER BY started_at DESC LIMIT 50"`.quiet().text();
    if (!result.trim()) return [];
    const rows = JSON.parse(result) as Array<{
      id: string;
      title: string | null;
      started_at: number;
      ended_at: number | null;
      duration_secs: number | null;
      status: string;
      chunk_count: number;
      storage_path: string | null;
    }>;

    return rows.map((row) => {
      const startDate = new Date(row.started_at * 1000);
      const pad = (n: number) => String(n).padStart(2, "0");
      const autoTitle = `Meeting ${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())} ${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;
      return {
        id: row.id,
        title: row.title ?? autoTitle,
        date: startDate.toLocaleDateString(),
        duration: formatDuration(row.duration_secs),
        status: row.status,
        chunkCount: row.chunk_count,
        wordCount: 0,
        speakers: [],
        transcriptChunks: [],
        transcriptLoaded: false,
      };
    });
  } catch {
    return [];
  }
}

async function loadSpeakersForMeeting(meetingId: string): Promise<Array<{ id: string; label: string }>> {
  try {
    const result = await Bun.$`sqlite3 -json ${DB_PATH} ${"SELECT speaker_num, label FROM speaker_labels WHERE meeting_id = '" + meetingId + "' ORDER BY speaker_num"}`.quiet().text();
    if (!result.trim()) return [];
    const rows = JSON.parse(result) as Array<{ speaker_num: number; label: string }>;
    return rows.map((r) => ({ id: `SPEAKER_${String(r.speaker_num).padStart(2, "0")}`, label: r.label }));
  } catch {
    return [];
  }
}

async function loadTranscript(meetingId: string): Promise<{ chunks: TranscriptChunk[]; wordCount: number }> {
  try {
    const raw = await Bun.$`voxtype meeting export ${meetingId}`.quiet().text();
    const lines = raw.split("\n");
    const chunks: TranscriptChunk[] = lines.map((line) => ({ text: line, timestamp: "", speaker: "" }));
    const wordCount = raw.split(/\s+/).filter(Boolean).length;
    return { chunks, wordCount };
  } catch {
    return { chunks: [], wordCount: 0 };
  }
}

async function pollVoxtypeStatus(): Promise<{ status: "idle" | "recording" | "paused"; meetingId: string | null }> {
  try {
    const out = await Bun.$`voxtype meeting status`.quiet().text();
    if (/no meeting currently/i.test(out)) return { status: "idle", meetingId: null };
    const idMatch = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|mtg[-_]\w+)/i.exec(out);
    const meetingId = idMatch ? idMatch[1]! : null;
    if (/paused/i.test(out)) return { status: "paused", meetingId };
    return { status: "recording", meetingId };
  } catch {
    return { status: "idle", meetingId: null };
  }
}

async function main() {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 10,
  });

  const state = createInitialState();
  state.themeMode = renderer.themeMode;
  renderer.on("theme_mode", (nextMode: ThemeMode) => {
    state.themeMode = nextMode;
    redraw();
  });

  let pendingRedraw = false;
  function redraw() {
    if (pendingRedraw) return;
    pendingRedraw = true;
    queueMicrotask(() => {
      pendingRedraw = false;
      const children = renderer.root.getChildren();
      for (const child of children) {
        renderer.root.remove(child.id);
      }
      renderer.root.add(App(renderer, state));
    });
  }

  // --- Initial data load ---
  const [summaryOk, meetings] = await Promise.all([
    checkSummaryConfig(),
    loadMeetingsFromDb(),
  ]);

  state.summaryNotConfigured = !summaryOk;
  state.meetings = meetings;
  state.isLoading = false;

  if (state.summaryNotConfigured) {
    state.view = "setup";
  }

  // Check if voxtype is already recording
  const liveStatus = await pollVoxtypeStatus();
  if (liveStatus.status !== "idle") {
    state.status = liveStatus.status;
    state.activeMeetingId = liveStatus.meetingId;
    if (liveStatus.meetingId) {
      const idx = state.meetings.findIndex((m) => m.id === liveStatus.meetingId);
      if (idx !== -1) state.selectedMeetingIndex = idx;
    }
  }

  redraw();

  // --- Timers ---
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    state.meetingStartTime = Date.now();
    timerInterval = setInterval(() => {
      if (state.meetingStartTime && state.status !== "idle") {
        state.meetingTimer = Math.floor((Date.now() - state.meetingStartTime) / 1000);
        redraw();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // --- Poll for live transcript updates ---
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(async () => {
      if (state.status === "idle") return;
      const { status, meetingId } = await pollVoxtypeStatus();

      if (status === "idle" && (state.status === "recording" || state.status === "paused")) {
        // Meeting ended externally
        state.status = "idle";
        stopTimer();
        state.meetingTimer = 0;
        state.activeMeetingId = null;
        state.meetings = await loadMeetingsFromDb();
        redraw();
        return;
      }

      state.status = status;

      // Reload transcript if chunk count changed
      if (meetingId) {
        const idx = state.meetings.findIndex((m) => m.id === meetingId);
        if (idx !== -1) {
          const prevCount = state.meetings[idx]!.chunkCount;
          const rows = await Bun.$`sqlite3 -json ${DB_PATH} ${"SELECT chunk_count FROM meetings WHERE id = '" + meetingId + "'"}`.quiet().text().catch(() => "");
          if (rows.trim()) {
            const parsed = JSON.parse(rows) as Array<{ chunk_count: number }>;
            const newCount = parsed[0]?.chunk_count ?? prevCount;
            if (newCount !== prevCount) {
              state.meetings[idx]!.chunkCount = newCount;
              const { chunks, wordCount } = await loadTranscript(meetingId);
              state.meetings[idx]!.transcriptChunks = chunks;
              state.meetings[idx]!.wordCount = wordCount;
              state.meetings[idx]!.transcriptLoaded = true;
            }
          }
        }
      }
      redraw();
    }, 5000);
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  // --- Meeting control via CLI ---
  async function startMeeting() {
    if (state.status !== "idle") return;
    state.isLoading = true;
    state.statusMessage = "Starting meeting…";
    redraw();

    try {
      const title = state.meetingTitle.trim() || undefined;
      const cmd = title
        ? Bun.$`voxtype meeting start --title ${title}`.quiet()
        : Bun.$`voxtype meeting start`.quiet();
      await cmd;

      state.meetingTitle = "";
      state.status = "recording";
      state.meetingTimer = 0;
      startTimer();
      startPolling();

      // Refresh meetings list to pick up the new one
      await new Promise((r) => setTimeout(r, 500));
      state.meetings = await loadMeetingsFromDb();
      const liveStatus = await pollVoxtypeStatus();
      state.activeMeetingId = liveStatus.meetingId;
      if (liveStatus.meetingId) {
        const idx = state.meetings.findIndex((m) => m.id === liveStatus.meetingId);
        if (idx !== -1) state.selectedMeetingIndex = idx;
      }
      state.statusMessage = null;
    } catch (e) {
      state.status = "idle";
      state.statusMessage = `Failed to start: ${e instanceof Error ? e.message : String(e)}`;
      stopTimer();
    }

    state.isLoading = false;
    redraw();
  }

  async function stopMeeting() {
    if (state.status === "idle") return;
    state.statusMessage = "Stopping meeting…";
    redraw();

    try {
      await Bun.$`voxtype meeting stop`.quiet();
      state.status = "idle";
      state.activeMeetingId = null;
      stopTimer();
      stopPolling();
      state.meetingTimer = 0;
      state.meetingStartTime = null;

      await new Promise((r) => setTimeout(r, 500));
      state.meetings = await loadMeetingsFromDb();
      state.statusMessage = null;
    } catch (e) {
      state.statusMessage = `Failed to stop: ${e instanceof Error ? e.message : String(e)}`;
    }
    redraw();
  }

  async function pauseMeeting() {
    if (state.status !== "recording") return;
    try {
      await Bun.$`voxtype meeting pause`.quiet();
      state.status = "paused";
    } catch (e) {
      state.statusMessage = `Failed to pause: ${e instanceof Error ? e.message : String(e)}`;
    }
    redraw();
  }

  async function resumeMeeting() {
    if (state.status !== "paused") return;
    try {
      await Bun.$`voxtype meeting resume`.quiet();
      state.status = "recording";
    } catch (e) {
      state.statusMessage = `Failed to resume: ${e instanceof Error ? e.message : String(e)}`;
    }
    redraw();
  }

  async function deleteMeeting(meetingId: string) {
    try {
      await Bun.$`voxtype meeting delete ${meetingId} --force`.quiet();
      state.meetings = await loadMeetingsFromDb();
      if (state.selectedMeetingIndex >= state.meetings.length && state.meetings.length > 0) {
        state.selectedMeetingIndex = state.meetings.length - 1;
      }
      state.statusMessage = "Meeting deleted.";
    } catch (e) {
      state.statusMessage = `Failed to delete: ${e instanceof Error ? e.message : String(e)}`;
    }
    state.showConfirmDelete = false;
    state.confirmDeleteMeetingId = null;
    redraw();
  }

  async function summarizeMeeting(meetingId: string) {
    if (state.summaryNotConfigured) {
      state.view = "setup";
      redraw();
      return;
    }
    state.statusMessage = "Generating summary…";
    redraw();
    try {
      const summary = await Bun.$`voxtype meeting summarize ${meetingId}`.quiet().text();
      const meeting = state.meetings.find((m) => m.id === meetingId);
      if (meeting) {
        meeting.transcriptChunks.push({
          timestamp: "AI",
          speaker: "SUMMARY",
          text: summary.trim(),
        });
      }
      state.statusMessage = "Summary added.";
    } catch (e) {
      state.statusMessage = `Summary failed: ${e instanceof Error ? e.message : String(e)}`;
    }
    redraw();
  }

  async function exportMeeting(meetingId: string) {
    const meeting = state.meetings.find((m) => m.id === meetingId);
    if (!meeting) return;
    const fmt = EXPORT_FORMATS[state.exportPickerCursor];
    if (!fmt) return;

    const home = process.env.HOME ?? ".";
    const slug = meeting.title.replace(/[/\\:*?"<>|]/g, "-").replace(/\s+/g, "-").slice(0, 50);
    const savePath = `${home}/${slug}.${fmt.ext}`;

    state.showExportPicker = false;
    state.statusMessage = `Exporting…`;
    redraw();

    try {
      await Bun.$`voxtype meeting export ${meetingId} --format ${fmt.flag} --output ${savePath} --timestamps --speakers --metadata`.quiet();
      state.statusMessage = `Saved: ${savePath}`;
    } catch (e) {
      state.statusMessage = `Export failed: ${e instanceof Error ? e.message : String(e)}`;
    }
    redraw();
  }

  async function openInEditor(meetingId: string) {
    const editor = process.env.EDITOR ?? process.env.VISUAL ?? "nano";
    const tmpFile = `/tmp/voxtype-${meetingId.slice(0, 8)}.md`;

    state.statusMessage = "Opening in editor…";
    redraw();

    try {
      await Bun.$`voxtype meeting export ${meetingId} --output ${tmpFile}`.quiet();
      renderer.suspend();
      Bun.spawnSync([editor, tmpFile], { stdio: ["inherit", "inherit", "inherit"] });
      renderer.resume();
      state.statusMessage = null;
    } catch (e) {
      try { renderer.resume(); } catch {}
      state.statusMessage = `Editor failed: ${e instanceof Error ? e.message : String(e)}`;
    }
    redraw();
  }

  async function yankToClipboard(meetingId: string) {
    state.statusMessage = "Copying…";
    redraw();
    try {
      const text = await Bun.$`voxtype meeting export ${meetingId}`.quiet().text();

      const tryClip = (cmd: string[]) => {
        const proc = Bun.spawn(cmd, { stdin: "pipe", stdout: "ignore", stderr: "ignore" });
        proc.stdin.write(text);
        proc.stdin.end();
        return proc.exited;
      };

      const isWayland = !!process.env.WAYLAND_DISPLAY;
      try {
        if (isWayland) {
          await tryClip(["wl-copy"]);
        } else {
          await tryClip(["xclip", "-selection", "clipboard"]);
        }
      } catch {
        await tryClip(isWayland ? ["xclip", "-selection", "clipboard"] : ["wl-copy"]);
      }

      state.statusMessage = "Transcript yanked to clipboard";
    } catch {
      state.statusMessage = "Clipboard failed (need wl-copy or xclip)";
    }
    redraw();
  }

  async function openMeetingDetail() {
    const meeting = state.meetings[state.selectedMeetingIndex];
    if (!meeting) return;
    if (!meeting.transcriptLoaded) {
      state.statusMessage = "Loading transcript…";
      redraw();
      const [{ chunks, wordCount }, speakers] = await Promise.all([
        loadTranscript(meeting.id),
        loadSpeakersForMeeting(meeting.id),
      ]);
      meeting.transcriptChunks = chunks;
      meeting.wordCount = wordCount;
      meeting.speakers = speakers;
      meeting.transcriptLoaded = true;
      state.statusMessage = null;
    }
    state.focusedPanel = "main";
    state.transcriptScrollOffset = 0;
    redraw();
  }

  function setView(view: import("./state").View) {
    state.view = view;
    if (view === "settings" || view === "diarization") {
      state.focusedPanel = "settings";
    } else if (view === "meetings") {
      // preserve existing panel focus
    }
  }

  // --- Keyboard input ---
  const input = renderer.keyInput;
  let lastDPressTime = 0;

  input.on("keypress", (key) => {
    const { name, ctrl } = key;

    // Always allow quit
    if (name === "q" && !ctrl) {
      stopTimer();
      stopPolling();
      renderer.destroy();
      return;
    }

    // --- Start dialog (title input) ---
    if (state.view === "start-dialog") {
      if (name === "escape") {
        state.view = "meetings";
        state.meetingTitleInput = "";
        redraw();
        return;
      }
      if (name === "return") {
        state.meetingTitle = state.meetingTitleInput.trim();
        state.meetingTitleInput = "";
        state.view = "meetings";
        if (state.status === "idle") startMeeting();
        return;
      }
      if (name === "backspace" || name === "delete") {
        state.meetingTitleInput = state.meetingTitleInput.slice(0, -1);
        redraw();
        return;
      }
      // Accept printable characters
      if (key.sequence && key.sequence.length === 1 && !ctrl && !key.meta) {
        const ch = key.sequence;
        if (ch >= " " && ch <= "~") {
          state.meetingTitleInput += ch;
          redraw();
        }
      }
      return;
    }

    // --- Setup screen ---
    if (state.view === "setup") {
      if (name === "escape" || name === "return") {
        state.view = "meetings";
        redraw();
      }
      return;
    }

    // --- Settings screen ---
    if (state.view === "settings") {
      if (name === "escape") {
        setView("meetings");
        redraw();
        return;
      }
      if (name === "j" || name === "down") {
        state.settingsCursor = Math.min(SETTINGS_COUNT - 1, state.settingsCursor + 1);
        redraw();
        return;
      }
      if (name === "k" || name === "up") {
        state.settingsCursor = Math.max(0, state.settingsCursor - 1);
        redraw();
        return;
      }
      if (name === "space" || name === "return" || name === "right") {
        applySettingsAction(state, "next");
        redraw();
        return;
      }
      if (name === "left") {
        applySettingsAction(state, "prev");
        redraw();
        return;
      }
      return;
    }

    // --- Export picker ---
    if (state.showExportPicker) {
      if (name === "escape" || name === "n") {
        state.showExportPicker = false;
        redraw();
        return;
      }
      if (name === "j" || name === "down") {
        state.exportPickerCursor = Math.min(EXPORT_FORMATS.length - 1, state.exportPickerCursor + 1);
        redraw();
        return;
      }
      if (name === "k" || name === "up") {
        state.exportPickerCursor = Math.max(0, state.exportPickerCursor - 1);
        redraw();
        return;
      }
      if (name === "return") {
        const meeting = state.meetings[state.selectedMeetingIndex];
        if (meeting) exportMeeting(meeting.id);
        return;
      }
      return;
    }

    // --- Confirm delete dialog ---
    if (state.showConfirmDelete) {
      if (name === "y") {
        const meetingId = state.confirmDeleteMeetingId;
        if (meetingId) deleteMeeting(meetingId);
        return;
      }
      if (name === "n" || name === "escape") {
        state.showConfirmDelete = false;
        state.confirmDeleteMeetingId = null;
        redraw();
        return;
      }
      return;
    }

    // --- Global recording controls (any view except overlays) ---
    if (name === "p" && !ctrl) {
      if (state.status === "recording") { pauseMeeting(); return; }
      if (state.status === "paused") { resumeMeeting(); return; }
    }
    if (name === "escape" && state.status !== "idle") {
      stopMeeting();
      return;
    }

    // --- Settings shortcut ---
    if (name === "s" && !ctrl) {
      setView("settings");
      redraw();
      return;
    }

    if (name === "T" && !ctrl) {
      state.palette = state.palette === "terminal" ? "auto" : "terminal";
      state.statusMessage = state.palette === "terminal"
        ? "Palette: terminal ANSI colors"
        : `Palette: ${state.themeMode ?? "dark"} hex`;
      redraw();
      return;
    }

    // --- Panel focus: Tab toggle, h = sidebar, l = main ---
    if (name === "tab") {
      state.focusedPanel = state.focusedPanel === "sidebar" ? "main" : "sidebar";
      redraw();
      return;
    }
    if (name === "h" && !ctrl) {
      state.focusedPanel = "sidebar";
      redraw();
      return;
    }
    if (name === "l" && !ctrl && state.meetings.length > 0) {
      if (!state.meetings[state.selectedMeetingIndex]?.transcriptLoaded) {
        openMeetingDetail();
      } else {
        state.focusedPanel = "main";
        redraw();
      }
      return;
    }

    // --- New meeting ---
    if (name === "n" && !ctrl && state.status === "idle") {
      state.view = "start-dialog";
      state.meetingTitleInput = "";
      redraw();
      return;
    }

    // --- Double-D delete (works from either pane) ---
    if (name === "d" && !ctrl && state.meetings.length > 0) {
      const now = Date.now();
      if (now - lastDPressTime < 500) {
        const meeting = state.meetings[state.selectedMeetingIndex];
        if (meeting) {
          state.showConfirmDelete = true;
          state.confirmDeleteMeetingId = meeting.id;
          lastDPressTime = 0;
          redraw();
        }
      } else {
        lastDPressTime = now;
      }
      return;
    }

    // --- Sidebar pane ---
    if (state.focusedPanel === "sidebar") {
      if (name === "j" || name === "down") {
        sidebarNavigate(state, "down");
        state.transcriptScrollOffset = 0;
        redraw();
        return;
      }
      if (name === "k" || name === "up") {
        sidebarNavigate(state, "up");
        state.transcriptScrollOffset = 0;
        redraw();
        return;
      }
      if (name === "return" && state.meetings.length > 0) {
        openMeetingDetail();
        return;
      }
      if (name === "m" && !ctrl && state.meetings.length > 0) {
        const meeting = state.meetings[state.selectedMeetingIndex];
        if (meeting) summarizeMeeting(meeting.id);
        return;
      }
      if (name === "e" && !ctrl && state.meetings.length > 0) {
        state.showExportPicker = true;
        state.exportPickerCursor = 0;
        redraw();
        return;
      }
      if (name === "o" && !ctrl && state.meetings.length > 0) {
        const meeting = state.meetings[state.selectedMeetingIndex];
        if (meeting) openInEditor(meeting.id);
        return;
      }
      if (name === "y" && !ctrl && state.meetings.length > 0) {
        const meeting = state.meetings[state.selectedMeetingIndex];
        if (meeting) yankToClipboard(meeting.id);
        return;
      }
      return;
    }

    // --- Main (transcript) pane ---
    if (state.focusedPanel === "main") {
      if (name === "j" || name === "down") {
        state.transcriptScrollOffset++;
        redraw();
        return;
      }
      if (name === "k" || name === "up") {
        state.transcriptScrollOffset = Math.max(0, state.transcriptScrollOffset - 1);
        redraw();
        return;
      }
      if (name === "m" && !ctrl && state.meetings.length > 0) {
        const meeting = state.meetings[state.selectedMeetingIndex];
        if (meeting) summarizeMeeting(meeting.id);
        return;
      }
      if (name === "e" && !ctrl && state.meetings.length > 0) {
        state.showExportPicker = true;
        state.exportPickerCursor = 0;
        redraw();
        return;
      }
      if (name === "o" && !ctrl && state.meetings.length > 0) {
        const meeting = state.meetings[state.selectedMeetingIndex];
        if (meeting) openInEditor(meeting.id);
        return;
      }
      if (name === "y" && !ctrl && state.meetings.length > 0) {
        const meeting = state.meetings[state.selectedMeetingIndex];
        if (meeting) yankToClipboard(meeting.id);
        return;
      }
    }
  });

  renderer.on("resize", () => {
    redraw();
  });

  // Clear status messages after a few seconds
  setInterval(() => {
    if (state.statusMessage) {
      state.statusMessage = null;
      redraw();
    }
  }, 4000);
}

main().catch(console.error);
