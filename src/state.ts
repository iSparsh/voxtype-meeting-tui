import type { ThemeMode } from "@opentui/core";

export type MeetingStatus = "idle" | "recording" | "paused";
export type View = "meetings" | "start-dialog" | "settings" | "diarization" | "setup";
export type Panel = "sidebar" | "main" | "settings";

export interface SpeakerLabel {
  id: string;
  label: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: string;
  status: string;
  chunkCount: number;
  wordCount: number;
  speakers: SpeakerLabel[];
  transcriptChunks: TranscriptChunk[];
  transcriptLoaded: boolean;
}

export interface TranscriptChunk {
  timestamp: string;
  speaker: string;
  text: string;
}

export interface AppState {
  status: MeetingStatus;
  activeMeetingId: string | null;
  view: View;
  focusedPanel: Panel;
  selectedMeetingIndex: number;
  meetings: Meeting[];
  meetingTitle: string;
  meetingTitleInput: string;
  sidebarScrollOffset: number;
  transcriptScrollOffset: number;
  showConfirmDelete: boolean;
  confirmDeleteMeetingId: string | null;
  showExportPicker: boolean;
  exportPickerCursor: number;
  statusMessage: string | null;
  themeMode: ThemeMode | null;
  palette: "auto" | "terminal";
  isLoading: boolean;
  summaryNotConfigured: boolean;
  settingsCursor: number;

  meeting: {
    enabled: boolean;
    chunkDurationSecs: number;
    storagePath: string;
    retainAudio: boolean;
    maxDurationMins: number;
  };
  audio: {
    micDevice: string;
    loopbackDevice: string;
    vadThreshold: number;
  };
  diarization: {
    enabled: boolean;
    backend: "simple" | "ml" | "subprocess";
    maxSpeakers: number;
  };
  summary: {
    backend: "local" | "remote" | "disabled";
    ollamaUrl: string;
    ollamaModel: string;
    timeoutSecs: number;
  };
  meetingTimer: number;
  meetingStartTime: number | null;
}

export function createInitialState(): AppState {
  return {
    status: "idle",
    activeMeetingId: null,
    view: "meetings",
    focusedPanel: "sidebar",
    selectedMeetingIndex: 0,
    meetings: [],
    meetingTitle: "",
    meetingTitleInput: "",
    sidebarScrollOffset: 0,
    transcriptScrollOffset: 0,
    showConfirmDelete: false,
    confirmDeleteMeetingId: null,
    showExportPicker: false,
    exportPickerCursor: 0,
    statusMessage: null,
    themeMode: null,
    palette: "auto",
    isLoading: true,
    summaryNotConfigured: false,
    settingsCursor: 0,

    meeting: {
      enabled: true,
      chunkDurationSecs: 30,
      storagePath: "auto",
      retainAudio: false,
      maxDurationMins: 180,
    },
    audio: {
      micDevice: "default",
      loopbackDevice: "auto",
      vadThreshold: 0.01,
    },
    diarization: {
      enabled: true,
      backend: "simple",
      maxSpeakers: 10,
    },
    summary: {
      backend: "disabled",
      ollamaUrl: "http://localhost:11434",
      ollamaModel: "llama3.2",
      timeoutSecs: 120,
    },
    meetingTimer: 0,
    meetingStartTime: null,
  };
}
