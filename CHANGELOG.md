# Changelog

All notable changes to the SuperDocs Claude Code plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-07-16

### Added
- **Tool count is now 37** (up from 35) — the bundled MCP server gained two tools:
  - **`get_account_status`** — check your tier, operations used and remaining this month, and the reset date (non-billable). Lets an agent watch its own quota before it hits the cap.
  - **`upload_image_base64`** — upload an image as base64 and get back a hosted URL to reference in chat (e.g. "insert my logo at the top").

### Fixed
- **Install is now a two-step marketplace flow.** Register the marketplace with `claude plugin marketplace add superdocsapp/superdocs-plugin`, then install with `claude plugin install superdocs@superdocs-plugin`. The old one-step `claude plugin install superdocsapp/superdocs-plugin` fails with "doesn't exist in marketplace", because that GitHub repo path is only valid for `marketplace add`, not for `install`. The README and the `superdocs-setup` command are corrected to match.

## [1.1.0] - 2026-06-23

### Added
- **Tool count is now 35** (up from 22) — the bundled MCP server gained:
  - **Multi-document sessions (tabs):** `init_session`, `open_documents`, `list_session_documents`, `focus_session_document`, `close_session_document` — open several documents in one session and target edits at a specific tab.
  - **Files (durable, reusable documents):** `list_documents`, `get_document_detail`, `rename_document`, `archive_document`, `unarchive_document` — documents persist across sessions and can be reopened, renamed, and archived. `unarchive_document` restores a previously-archived document by its id (the mirror of `archive_document`).
  - **Cross-session memory & search** — `chat` / `chat_async` accept `cross_session_memory`, `cross_session_search`, `cross_session_scope`, and `cross_session_memory_key`; `clear_cross_session_memory` resets it.
  - **`continue_chat`** — resume a large edit that paused mid-run (job sitting at `awaiting_approval` with `awaiting_kind='continue_prompt'`). Use this, NOT `approve_change`, to continue a paused large edit.
  - **`redo_revert`** — undo a revert: restore the session forward to its pre-revert state. The mirror of `revert_session_to_message`.
- Token-light reads: the session-roster + Files reads (including the `get_document_detail` lookup) return metadata only by default — ids, title, section counts, focused flag, page setup; pass `include_html=true` only when you need a document's body. On `chat` / `chat_async`, `response_mode='compact'` returns just the per-section diffs that changed instead of the full document.
- Loading a document is not itself a billable operation — `upload_document_base64` (and uploading a reference file as an attachment) does not consume an operation; you're charged for the AI edits/drafts you run, not for parsing a file into the editor.
- **Concurrent-edit conflict resolution (REST, not an MCP tool):** `POST /v1/sessions/{session_id}/chunks/{chunk_id}/re-edit` re-applies the AI's change over a user's current text, or blends the two, for one section. It runs one billable AI edit — for integrators running their own editor.

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
