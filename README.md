# voxtype-meeting-tui

Terminal UI for [voxtype](https://github.com/peteonrails/voxtype)'s meeting mode. Browse, record, transcribe, and export meetings without leaving the terminal.

## Requirements

- [Bun](https://bun.sh) ≥ 1.0
- [voxtype](https://github.com/peteonrails/voxtype) CLI in `$PATH`

## Install

```sh
bun install -g voxtype-meeting-tui
```

Or download a pre-built binary from [Releases](https://github.com/iSparsh/voxtype-meeting-tui/releases) — no Bun required to run it.

## Run

```sh
vmt
```

## Keys

### Global

| Key | Action |
|-----|--------|
| `n` | New meeting (prompts for title) |
| `p` | Pause / resume active recording |
| `Esc` | Stop active recording |
| `s` | Settings |
| `Shift+T` | Toggle palette (hex dark/light ↔ terminal ANSI) |
| `q` | Quit |

### Sidebar

| Key | Action |
|-----|--------|
| `j` / `k` | Navigate |
| `Enter` / `l` | Open transcript |
| `dd` | Delete meeting (confirm with `y`) |
| `m` | AI summarize |
| `e` | Export (format picker) |
| `o` | Open transcript in `$EDITOR` |
| `y` | Yank transcript to clipboard |

### Transcript pane

| Key | Action |
|-----|--------|
| `j` / `k` | Scroll |
| `h` | Back to sidebar |
| `Tab` | Toggle sidebar / transcript focus |

## AI Summarization

Add to `~/.config/voxtype/config.toml`:

```toml
[meeting.summary]
backend = "local"
ollama_url = "http://localhost:11434"
ollama_model = "llama3.2"
```

Or use `backend = "remote"` with `remote_endpoint` and `remote_api_key` for a hosted API.

## Build from source

```sh
bun install
bun run build          # single binary for current platform
bun run release        # cross-compiled binaries → dist/
```

## License

MIT
