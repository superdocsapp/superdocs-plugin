# SuperDocs plugin for Claude Code

Edit, draft, search, summarize, and export styled documents (`.docx` / PDF / HTML / Markdown / RTF) directly from Claude Code via the SuperDocs MCP server.

A single `/plugin install` command bundles:
- **21 MCP tools** — chat, structural editing, attachments, sessions, jobs, templates, pre-signed upload/download
- **4 user-invocable workflow prompts** — `/superdocs:draft_from_outline`, `/superdocs:edit_styled_docx`, `/superdocs:convert_format`, `/superdocs:review_contract_for_redflags`
- **Auto-loading skill** — Claude reaches for SuperDocs proactively when you ask to edit, draft, or export documents

## Install

You'll need a free SuperDocs API key first — sign up at [use.superdocs.app](https://use.superdocs.app), then **Settings → API Keys → Create**. Free plan includes 500 AI operations per month.

In Claude Code, run:

```bash
claude plugin install superdocsapp/superdocs-plugin
```

You'll be prompted for your API key. It's stored securely in your OS keychain — never in plaintext config.

That's it. The MCP server is now live, the skill auto-loads when you ask document-editing questions, and the 4 workflow prompts appear in your `/` slash menu.

## Quick start

After install, try any of these:

```
Load /path/to/your.docx into SuperDocs as the active editable document.
```

```
/superdocs:draft_from_outline
```

```
Bold every heading in the document.
```

```
Export the current document as .docx and give me a pre-signed download URL.
```

For more, see the [SuperDocs documentation](https://docs.superdocs.app).

## What this plugin includes

| Component | What |
|---|---|
| MCP server | `https://api.superdocs.app/mcp/` (Streamable HTTP, sk_ Bearer auth) |
| Skill | `skills/superdocs/SKILL.md` — auto-loads when you ask document work |
| Tools (21) | `chat`, `chat_async`, `approve_change`, `upload_document_base64`, `request_upload_url`, `process_uploaded_document`, `request_download_url`, `export_document`, `list_sessions`, `get_session_history`, `get_session_jobs`, `upload_attachment_base64`, `delete_attachment`, `get_attachment_status`, `list_jobs`, `get_job`, `cancel_job`, `upload_template_base64`, `list_user_templates`, `delete_user_template`, `health` |
| Prompts (4) | `draft_from_outline`, `edit_styled_docx`, `convert_format`, `review_contract_for_redflags` |

## Manual install (no plugin)

If you'd rather configure the MCP server directly without the plugin (e.g., to share a config across projects via `.mcp.json`), see the [MCP setup docs](https://docs.superdocs.app/mcp/setup).

## Updates

Plugin auto-updates whenever a new version is published. Pin a specific version with `claude plugin install superdocsapp/superdocs-plugin@1.0.0` if you need stability.

## Compatibility

| Client | Tools | Prompts | Skill |
|---|---|---|---|
| Claude Code | ✅ | ✅ | ✅ |
| Claude Desktop | ✅ (via MCP) | ✅ | ⚠️ skill format support varies |
| Cursor | ✅ (via MCP, plugin-style install in roadmap) | ✅ | ⚠️ |
| Windsurf, Cline | ✅ (tools only) | ❌ (clients don't surface MCP prompts) | ❌ |

For non-Claude-Code clients, install the MCP server directly per the [SuperDocs MCP setup docs](https://docs.superdocs.app/mcp/setup).

## Issues / feedback

- Issues with this plugin: [github.com/superdocsapp/superdocs-plugin/issues](https://github.com/superdocsapp/superdocs-plugin/issues)
- Issues with SuperDocs itself: hello@superdocs.app

## License

MIT — see [LICENSE](./LICENSE).
