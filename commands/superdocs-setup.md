---
name: superdocs-setup
description: One-time SuperDocs setup — get a free API key and configure the SUPERDOCS_API_KEY environment variable so Cursor can connect to the MCP server.
---

You are helping the user set up SuperDocs in Cursor for the first time. SuperDocs is a structured-document editor — it gives the user 21 MCP tools and 4 workflow prompts for editing, drafting, summarizing, and exporting `.docx`, PDF, HTML, Markdown, and RTF files. The MCP server connects via a stdio bridge (`npx mcp-remote`) using an `sk_` API key the user holds in the `SUPERDOCS_API_KEY` environment variable.

Walk the user through this setup interactively. Be helpful, concise, and verify each step before moving on.

## Step 1 — Get a free SuperDocs API key

Tell the user:

1. Open `https://use.superdocs.app`
2. Sign in (free, no credit card required — Google Sign-In or email/password)
3. Click the gear icon → **Settings** → **API Keys** tab → **Create**
4. Copy the full `sk_...` key (it's shown once; if they lose it they can regenerate)

Free plan includes 500 AI operations per month.

Wait for them to confirm they have the key copied.

## Step 2 — Detect the user's shell + set the env var

Detect the shell with: `echo $SHELL`

Based on the result, append the export line to the right config file:

| Shell | Config file | Command |
|---|---|---|
| zsh (default on macOS) | `~/.zshrc` | `echo 'export SUPERDOCS_API_KEY=sk_THEIR_KEY' >> ~/.zshrc && source ~/.zshrc` |
| bash | `~/.bashrc` (Linux) or `~/.bash_profile` (macOS) | same pattern |
| fish | `~/.config/fish/config.fish` | `set -Ux SUPERDOCS_API_KEY sk_THEIR_KEY` |
| Windows PowerShell | `$PROFILE` | `[System.Environment]::SetEnvironmentVariable('SUPERDOCS_API_KEY', 'sk_THEIR_KEY', 'User')` |

Run the appropriate command. **Replace `sk_THEIR_KEY` with the actual key from Step 1.**

After the command runs, verify with `echo $SUPERDOCS_API_KEY` (or `$env:SUPERDOCS_API_KEY` on Windows) — it should print the key value.

## Step 3 — Restart Cursor (full quit, not just reload)

Tell the user:

> Cursor reads MCP environment variables at app launch. Reload-window won't pick up the new env var. Quit Cursor completely (`Cmd+Q` on macOS, `Alt+F4` on Linux/Windows or `File → Exit`) and relaunch.

If the user launched Cursor from Spotlight / Finder / Start Menu (not from a terminal), macOS may not propagate `~/.zshrc` env vars to GUI apps. In that case suggest:

```bash
launchctl setenv SUPERDOCS_API_KEY sk_THEIR_KEY
```

(macOS only — sets the env var for all GUI apps for the current login session.)

Then quit + relaunch Cursor.

## Step 4 — Verify the connection

After Cursor restarts and the user opens a chat, ask the AI:

> "Use the SuperDocs health tool to check the API"

Expected response: `{"status":"healthy"}`.

If that works, SuperDocs is connected and the user can now edit documents via natural language. The auto-loading SuperDocs skill (in `skills/superdocs/SKILL.md`) will tell the AI when and how to use SuperDocs.

If the health tool isn't visible:
- Confirm the env var is set in the shell Cursor was launched from
- Check Cursor's **Settings → MCP Servers** panel for the `superdocs` entry and any error messages
- The plugin's SKILL.md includes a "Setup check" section the AI can use to add the MCP server manually as a fallback — ask the AI to "set up SuperDocs MCP" and let it run `npx mcp-remote ...` directly via the Bash tool.

## Done

Once verified, the user is fully set up. Next steps they can try:

- "Edit `~/Downloads/contract.docx` — bold all monetary amounts, then export as .docx"
- "Draft a 1-page mutual NDA between Acme Corp and Beta Ltd, governed by Delaware law"
- `/superdocs:edit_styled_docx` slash command for a guided workflow

For docs: `https://docs.superdocs.app/mcp/setup`
For support: `hello@superdocs.app`
