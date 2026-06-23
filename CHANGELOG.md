# Changelog

All notable changes to the SuperDocs Claude Code plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-23

### Added
- **Tool count is now 33** (up from 22) — the bundled MCP server gained:
  - **Multi-document sessions (tabs):** `init_session`, `open_documents`, `list_session_documents`, `focus_session_document`, `close_session_document` — open several documents in one session and target edits at a specific tab.
  - **Files (durable, reusable documents):** `list_documents`, `get_document_detail`, `rename_document`, `archive_document` — documents persist across sessions and can be reopened, renamed, and archived.
  - **Cross-session memory & search** — `chat` / `chat_async` accept `cross_session_memory`, `cross_session_search`, `cross_session_scope`, and `cross_session_memory_key`; `clear_cross_session_memory` resets it.
  - **`continue_chat`** — resume a large edit that paused mid-run (job sitting at `awaiting_approval` with `awaiting_kind='continue_prompt'`). Use this, NOT `approve_change`, to continue a paused large edit.
- Token-light reads: the session-roster + Files tools return metadata only by default; pass `include_html=true` only when you need a document's body.

### Changed
- **Export-format correction:** exports are `.docx`, PDF, HTML, Markdown, and plain text. RTF is an **input/upload** format only — it is no longer listed as an export format anywhere.

## [1.0.0] - 2026-04-26

### Added
- First release.
- Bundles SuperDocs MCP server (`https://api.superdocs.app/mcp/`) with 22 tools and 4 user-invocable workflow prompts.
- Auto-loading skill (`skills/superdocs/SKILL.md`) — Claude reaches for SuperDocs proactively on document work.
- `userConfig` prompts for `api_key` at install time; stored securely in OS keychain.
- 4 prompts surfaced as slash commands: `/superdocs:draft_from_outline`, `/superdocs:edit_styled_docx`, `/superdocs:convert_format`, `/superdocs:review_contract_for_redflags`.
- Compatible with Claude Code 2.1.x and the unified SuperDocs MCP server.
