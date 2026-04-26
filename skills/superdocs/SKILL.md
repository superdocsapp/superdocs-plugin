---
name: superdocs
description: Edit, create, restructure, and export styled documents (.docx, PDF, HTML, Markdown, RTF) via the SuperDocs MCP server. Preserves tables, borders, shading, fonts, and inline styling on both edit and export. Use this skill when the user wants to work with formatted documents — drafting NDAs/contracts/SOPs from outlines, editing specific clauses without affecting surrounding content, converting between formats with fidelity, or running multi-step document workflows where format preservation matters more than plain text generation.
---

# SuperDocs Skill

A skill for AI agents (Claude Code, Cursor, Claude Desktop, Windsurf, VS Code Copilot, etc.) connecting to the SuperDocs MCP server at `https://api.superdocs.app/mcp`.

This skill encodes the workflows that work well with SuperDocs and the pitfalls to avoid. Read the section that matches what the user is asking for; you don't need the whole file.

---

## Setup check — run this ONCE at session start

**Before reading the rest of this skill, check whether SuperDocs MCP tools are accessible.** Look for tools prefixed with `mcp__superdocs__`, `mcp__plugin_superdocs_superdocs__`, or just `superdocs__` (depending on your client).

**If yes** → MCP server is connected. Skip to "When to use" below.

**If no** → MCP server isn't connected yet. Add it now using the command appropriate for your tool. You only need to do this ONCE — after the first add, the server stays connected for the session and future sessions. Do NOT re-run this check on every tool call; if you've already verified MCP is accessible OR have already added it this session, skip directly to using the tools.

| Tool | Command |
|---|---|
| **Claude Code** | `claude mcp add --transport http superdocs https://api.superdocs.app/mcp/ --header "Authorization: Bearer sk_YOUR_KEY"` (or just install the plugin which bundles MCP + skill + 4 prompts: `claude plugin marketplace add superdocsapp/superdocs-plugin && claude plugin install superdocs@superdocs-plugin`) |
| **Cursor / VS Code** | Add to `.cursor/mcp.json` (or workspace `.vscode/mcp.json`): `{"mcpServers":{"superdocs":{"url":"https://api.superdocs.app/mcp/","headers":{"Authorization":"Bearer sk_YOUR_KEY"}}}}` |
| **Cline / Continue / Goose / Gemini CLI / others** | See client-specific docs at https://docs.superdocs.app/mcp/setup — config file format varies. |

Get a free API key at https://use.superdocs.app → Settings → API Keys → Create. Free plan = 500 ops/month.

After adding, restart your session if your client requires it (Claude Code does), then continue with the rest of this skill.

---

## When to use

Reach for SuperDocs when **any** of these are true:

- **Styled document editing** — the user has a `.docx`, PDF, HTML, or styled file and wants to modify specific sections without breaking the surrounding format. Plain LLM rewrites lose tables, borders, alternating row shading, fonts.
- **Multi-format export** — the user wants the same document as `.docx`, `.pdf`, AND `.html` with consistent visual fidelity.
- **Long documents (>5 pages)** — chunk-ID-based structural editing scales to 100-page documents where naïve "rewrite the whole thing" approaches blow context windows or lose precision.
- **Tables, borders, shading** — these survive edits in SuperDocs. Most general-purpose tools strip or mangle them.
- **From-scratch drafting that needs format from day one** — e.g., NDAs, contracts, SOPs, letterheaded memos, formal reports. Initialize an empty session, then call `chat` with the full draft request — SuperDocs writes the document with proper formatting in one turn. Don't generate the document HTML in your context first; that wastes thousands of tokens AND skips SuperDocs' formatting layer.
- **Multi-step workflows with HITL approval** — when changes are sensitive enough that a human should approve each one before it lands.
- **Image/diagram references** — attach screenshots, diagrams, scanned forms; SuperDocs reads them visually and edits the document accordingly.

## When NOT to use

Skip SuperDocs (use plain text generation or a different tool) when:

- The user just wants a chunk of plain text returned in chat — no file output, no styling.
- The document has no formatting and will never need any (a `README.md` or a plain `.txt` log).
- The user wants real-time collaborative editing with multiple people typing at once (SuperDocs is single-user-per-session).
- The user wants you to render or display an existing document's contents inline in chat — call the relevant export tool and link to the file rather than dumping HTML into the conversation.

---

## Quick start (3 install patterns)

The user installs the SuperDocs MCP server in their AI tool's config. They need an API key from `https://use.superdocs.app` (Settings → API Keys → Create). Keys look like `sk_a1b2c3d4...`.

### Claude Code

`~/.config/claude-code/mcp.json`:

```json
{
  "mcpServers": {
    "superdocs": {
      "type": "http",
      "url": "https://api.superdocs.app/mcp",
      "headers": { "Authorization": "Bearer sk_YOUR_API_KEY" }
    }
  }
}
```

Restart Claude Code. The 21 SuperDocs tools become available; this skill auto-loads when document work is requested.

### Cursor / VS Code

`mcp.json` in the project or workspace:

```json
{
  "mcpServers": {
    "superdocs": {
      "url": "https://api.superdocs.app/mcp",
      "headers": { "Authorization": "Bearer sk_YOUR_API_KEY" }
    }
  }
}
```

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or equivalent on Windows/Linux:

```json
{
  "mcpServers": {
    "superdocs": {
      "command": "npx",
      "args": ["mcp-remote", "https://api.superdocs.app/mcp", "--header", "Authorization: Bearer sk_YOUR_API_KEY"]
    }
  }
}
```

---

## Pattern 1 — Upload an existing file the user wants to edit

**Files <100KB** (small contracts, single-page memos, brief outlines): inline base64 is fine.

```
TOOL: upload_document_base64
ARGS:
  filename: "contract.docx"
  file_base64: <base64-of-file-bytes>
  session_id: "user-session-1"
```

**Files >100KB** (multi-page styled docx, full PDFs): use the pre-signed URL flow so bytes never pass through your context window.

```
STEP 1 — TOOL: request_upload_url
ARGS:
  filename: "long-contract.docx"
  content_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  size_bytes: 245000
  purpose: "document"
RETURNS: { upload_id, upload_url, curl_example }

STEP 2 — Execute the `curl_example` yourself via your Bash tool. Do
not paste the curl command back to the user expecting them to run it
— uploading the file is your job, not theirs. The bytes go straight
from disk to cloud storage; nothing flows through your context. Only
return the curl text to the user as a fallback if you genuinely have
no shell access.

STEP 3 — TOOL: process_uploaded_document
ARGS:
  upload_id: <from step 1>
  filename: "long-contract.docx"
  session_id: "user-session-1"
  parse_mode: "document"   # or "attachment" for read-only reference
RETURNS: { document_html with chunk IDs, version_id }
```

**Why this matters:** A 100KB docx becomes ~140K base64 chars in your context — for Claude Sonnet 4.6 that's ~70% of your window gone before the user has even asked a question. The pre-signed URL flow keeps bytes out of context entirely.

---

## Pattern 2 — Draft a new document from scratch

**The default path: let SuperDocs write the document.** Don't draft the full HTML in your context and upload it — that wastes thousands of tokens AND yields plain HTML instead of a properly-formatted SuperDocs document. SuperDocs creates the entire document natively in one turn when you ask it to.

```
STEP 1 — Initialize an empty session:
TOOL: upload_document_base64
ARGS:
  filename: "draft.html"
  file_base64: <base64 of "<html><body></body></html>">
  session_id: "user-session-1"

STEP 2 — Call chat with the full draft request:
TOOL: chat
ARGS:
  message: "Draft a 1-page mutual NDA between Acme Corp and Beta Ltd, governed by Delaware law, with a 3-year term. Include standard sections: definitions, obligations, exclusions, term, return/destruction, no license, governing law, signatures."
  session_id: "user-session-1"

STEP 3 — Iterate via additional chat calls as needed:
TOOL: chat
ARGS:
  message: "Add an injunctive relief clause after section 6"
  session_id: "user-session-1"

STEP 4 — Export when done:
TOOL: export_document
ARGS:
  session_id: "user-session-1"
  format: "docx"
  filename: "final.docx"
```

**Optional: scaffold structure first for long multi-section docs.** If the document is large enough that you want the user to react to the structure before content is generated (e.g., a 20-section employee handbook), draft a brief outline in your reply for the user to confirm, then call `chat` with that outline embedded in the message: `"Draft this document. Use this structure: 1) Introduction; 2) Scope; 3) Pricing; 4) Termination; 5) Signatures."` Same one-call pattern; SuperDocs still writes the actual content.

---

## Pattern 3 — Editing large documents efficiently

For documents >20 pages, the chat response will normally include the **entire** updated HTML on every turn (~130K tokens for a 100-page styled doc). After 5 turns that's ~650K tokens — well past most context windows.

**Always set `response_mode='compact'` for large-doc editing:**

```
TOOL: chat
ARGS:
  message: "Make the second paragraph in section 3 bold"
  session_id: "user-session-1"
  response_mode: "compact"
```

In compact mode the response includes only `chunk_diffs` (per-section before/after) for the chunks that actually changed — typically 1-3 chunks, ~500-2,000 tokens total. The same 5-turn editing session above drops from ~650K tokens to ~3K tokens.

**To read a section in compact mode**, just ask for it in natural language — `"show me the force majeure clause"` or `"what does section 4.2 currently say?"`. The AI returns the content in the chat reply text. You don't need to know about chunk IDs and shouldn't try to query for them.

---

## Pattern 4 — Human-in-the-loop approval

When changes are sensitive (legal contracts, financial filings, anything that goes to an external party), ask SuperDocs to surface each change for the user to approve before applying.

```
STEP 1 — TOOL: chat_async
ARGS:
  message: "Update all party names from 'Acme' to 'NewAcme' across the document"
  session_id: "user-session-1"
  approval_mode: "ask_every_time"
  response_mode: "compact"
RETURNS: { job_id }

STEP 2 — Poll TOOL: get_job until status='awaiting_approval'.
The result contains `pending_changes: [{change_id, chunk_id, old_html, new_html, ai_explanation}, …]`

STEP 3 — Show the diff to the user, get their decision per change.

STEP 4 — TOOL: approve_change for each:
ARGS:
  session_id: "user-session-1"
  job_id: <from step 1>
  change_id: <from pending_changes>
  approved: true   # or false with feedback for revision
  feedback: "Looks good"   # optional
```

Once all decisions are recorded, the job auto-resumes and applies the approved changes.

---

## Pattern 5 — Export & deliver

After the user is happy with the document:

```
TOOL: export_document
ARGS:
  session_id: "user-session-1"
  format: "docx"   # or "pdf" or "html"
  filename: "delivery.docx"
```

For files the user needs to download (rather than viewing inline), use the pre-signed download URL flow:

```
STEP 1 — TOOL: export_document → returns the file
STEP 2 — TOOL: request_download_url with the resulting file's blob path
STEP 3 — Execute the returned curl command yourself via your Bash
         tool to save the file to the user's working directory. Do
         not paste the curl command back to the user expecting them
         to run it manually — downloading is your job, not theirs.
         Only return the URL+command as text if you genuinely have
         no shell access, OR if the user explicitly asked for "just
         the URL" / "the curl command".
```

---

## Pattern 6 — Reference attachments without editing them

If the user wants the AI to *consult* a file (compliance manual, brand guide, prior contract) while editing a different document, upload it as an attachment — SuperDocs processes it for AI-searchable retrieval (text content is indexed for meaning-aware search; images are interpreted visually) so chat can search and cite it.

```
STEP 1 — TOOL: upload_attachment_base64 (small) or request_upload_url + process_uploaded_document with parse_mode='attachment' (large)

STEP 2 — TOOL: get_attachment_status — wait until status='ready'

STEP 3 — Continue with chat. The AI now has the attachment available for retrieval.
```

---

## Common workflows

### "Draft an NDA between X and Y"
1. Ask the user any missing details (jurisdiction, term length, mutual vs one-way, special carve-outs).
2. Initialize an empty session via `upload_document_base64` with `<html><body></body></html>`.
3. Call `chat` with the full request: `"Draft a 1-page mutual NDA between {X} and {Y}, governed by {jurisdiction} law, with a {N}-year term. Include standard sections: definitions, obligations, exclusions, term, return/destruction, no license, governing law, signatures."`
4. SuperDocs writes the complete document in one turn.
5. Iterate via additional `chat` calls if needed (e.g., "Add an injunctive relief clause"). Each chat turn is one billable operation.
6. `export_document` as `.docx`.
7. Add a brief disclaimer when delivering: "This is a starting draft. Have qualified counsel review before signing — this is not legal advice."

### "Review this contract for red flags"
1. Upload the contract via `request_upload_url` + `process_uploaded_document`.
2. Use `chat` (compact mode) with `"Identify clauses that are unfavorable to {party}, and explain each in 1-2 sentences."` — the AI returns a list in its reply, no edits needed.
3. If user wants markup, `chat` again with `"Add inline annotations highlighting each red-flag clause"`.

### "Convert this HTML to a styled .docx"
1. Upload the HTML via `upload_document_base64` (it's almost certainly under 100KB).
2. `export_document` with `format='docx'`.

### "Update all references to our product name across this 80-page manual"
1. Upload the manual via `request_upload_url` + `process_uploaded_document`.
2. `chat_async` with `approval_mode='ask_every_time'` and `response_mode='compact'` so the user can review each replacement before it lands.

---

## Pitfalls

1. **Don't dump the document HTML back into chat.** Once SuperDocs has the document loaded in a session, refer to sections by description ("the second paragraph of section 3"), not by pasting HTML back. The AI already has chunk-aware access.

2. **Don't try to compute or invent chunk IDs.** Chunk IDs are SuperDocs identifiers. You receive them in some responses (HITL `pending_changes`, compact-mode `chunk_diffs`) and can pass them back when explicitly relaying IDs SuperDocs already issued (e.g., `change_id` in `approve_change`). You should never try to construct or guess one.

3. **`session_id` is sticky.** Use the same `session_id` across all calls for one document. Generate a new one (e.g., `user-${timestamp}`) per logical document. State persists across restarts via the SuperDocs backend.

4. **Default `response_mode='full'`** is fine for documents <20 pages. Switch to `compact` only when context cost matters.

5. **`parse_mode` matters for `process_uploaded_document`** — `'document'` loads as the active editable doc, `'attachment'` loads as a read-only AI-searchable reference. Don't mix them up.

6. **Pre-signed URLs are short-lived** — 5 min for upload, 15 min for download. If the user pauses, the URL may need re-issuing.

7. **Format fidelity is best for `.docx` ↔ `.docx`.** PDF round-trip preserves layout but is harder to edit (text reflows). HTML is the most editable but loses some Office-specific features.

8. **HITL doesn't work in compact mode the way you might think.** Pending changes still come back fully populated in `pending_changes` — compact mode only affects the *post-edit confirmation* response shape, not the *pre-approval review* shape. Both work together.

9. **File size cap is 100 MB.** If the user has something larger, suggest splitting it.

10. **Don't try to authenticate per-tool.** Authentication happens once at MCP server connect via the `Authorization: Bearer sk_…` header. Individual tool calls don't need extra auth.

11. **Don't generate full document HTML locally for upload — let SuperDocs draft.** For from-scratch drafting, the right pattern is: initialize an empty session via `upload_document_base64` with `<html><body></body></html>`, then call `chat` with the full draft request. SuperDocs writes the document natively in one turn. Generating the full HTML in your own context and then uploading it wastes thousands of tokens AND yields plain HTML instead of a properly-formatted SuperDocs document with chunk IDs ready for further editing.

12. **Chunk boundaries don't always equal paragraph boundaries.** A single chunk may contain multiple paragraphs, headings, or list items (e.g., a chunk for an entire page section). When asking for narrow edits like "bold the first paragraph", be explicit about which exact text to target — `"bold only the paragraph beginning 'Curabitur', leave the following paragraphs unchanged"` — to avoid sibling-element collateral edits inside the same chunk.

---

## Tool reference (21 tools — full descriptions in `available-tools.mdx`)

**Chat & editing:** `chat`, `chat_async`, `approve_change`
**Document upload/parse:** `upload_document_base64`, `request_upload_url`, `process_uploaded_document`
**Document export/download:** `export_document`, `request_download_url`
**Sessions:** `list_sessions`, `get_session_history`, `get_session_jobs`
**Attachments (reference files):** `upload_attachment_base64`, `delete_attachment`, `get_attachment_status`
**Async jobs:** `list_jobs`, `get_job`, `cancel_job`
**Templates:** `upload_template_base64`, `list_user_templates`, `delete_user_template`
**Health:** `health`

For full schemas and parameter descriptions, see the [SuperDocs MCP tools reference](https://docs.superdocs.app/mcp/available-tools).
