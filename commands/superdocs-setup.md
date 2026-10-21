---
name: superdocs-setup
description: One-time Typebar (formerly SuperDocs) setup for Cursor: get a free API key and configure the SUPERDOCS_API_KEY environment variable so Cursor can connect to the MCP server.
---

# Typebar setup (Cursor)

> **This walkthrough is for Cursor.** It configures the MCP server via a `SUPERDOCS_API_KEY` shell environment variable and the `npx mcp-remote` stdio bridge, the flow Cursor uses.
>
> **On Claude Code, do NOT follow these steps.** The Claude Code plugin authenticates differently: install with `claude plugin marketplace add superdocsapp/superdocs-plugin` then `claude plugin install superdocs@superdocs-plugin`, and you'll be prompted for your `sk_` API key once at install time. It's stored securely in your OS keychain, so there's no `SUPERDOCS_API_KEY` env var to set and nothing to restart. See the [README](../README.md) or [docs](https://docs.typebar.ai/mcp/setup).

You are helping the user set up Typebar (formerly SuperDocs) in Cursor for the first time. Typebar is a structured-document editor: it gives the user 38 MCP tools and 4 workflow prompts for editing, drafting, summarizing, and exporting documents. It exports to `.docx`, PDF, HTML, Markdown, and plain text, and ingests `.pdf`, `.docx`, `.txt`, `.rtf`, `.md`, `.html`, and `.htm`. The MCP server connects via a stdio bridge (`npx mcp-remote`) using an `sk_` API key the user holds in the `SUPERDOCS_API_KEY` environment variable.

Walk the user through this setup interactively. Be helpful, concise, and verify each step before moving on.

## Step 1: Get a free Typebar API key

Tell the user:

1. Open `https://use.typebar.ai`
2. Sign in (free, no credit card required: Google Sign-In or email/password)
3. Click the gear icon → **Settings** → **API Keys** tab → **Create**
4. Copy the full `sk_...` key (it's shown once; if they lose it they can regenerate)

Free plan includes 500 AI operations per month.

Wait for them to confirm they have the key copied.

## Step 2: Detect the user's shell + set the env var

Detect the shell with: `echo $SHELL`

Based on the result, append the export line to the right config file:

| Shell | Config file | Command |
|---|---|---|
| zsh (default on macOS) | `~/.zshrc` | `echo 'export SUPERDOCS_API_KEY=sk_THEIR_KEY' >> ~/.zshrc && source ~/.zshrc` |
| bash | `~/.bashrc` (Linux) or `~/.bash_profile` (macOS) | same pattern |
| fish | `~/.config/fish/config.fish` | `set -Ux SUPERDOCS_API_KEY sk_THEIR_KEY` |
| Windows PowerShell | `$PROFILE` | `[System.Environment]::SetEnvironmentVariable('SUPERDOCS_API_KEY', 'sk_THEIR_KEY', 'User')` |

Run the appropriate command. **Replace `sk_THEIR_KEY` with the actual key from Step 1.**

After the command runs, verify with `echo $SUPERDOCS_API_KEY` (or `$env:SUPERDOCS_API_KEY` on Windows). It should print the key value.

## Step 3: Restart Cursor (full quit, not just reload)

Tell the user:

> Cursor reads MCP environment variables at app launch. Reload-window won't pick up the new env var. Quit Cursor completely (`Cmd+Q` on macOS, `Alt+F4` on Linux/Windows or `File → Exit`) and relaunch.

If the user launched Cursor from Spotlight / Finder / Start Menu (not from a terminal), macOS may not propagate `~/.zshrc` env vars to GUI apps. In that case suggest:

```bash
launchctl setenv SUPERDOCS_API_KEY sk_THEIR_KEY
```

(macOS only: sets the env var for all GUI apps for the current login session.)

Then quit + relaunch Cursor.

## Step 4: Verify the connection

After Cursor restarts and the user opens a chat, ask the AI:

> "Use the Typebar health tool (server `superdocs`) to check the API"

Expected response: `{"status":"healthy"}`.

If that works, Typebar is connected and the user can now edit documents via natural language. The auto-loading Typebar skill (in `skills/superdocs/SKILL.md`) will tell the AI when and how to use Typebar.

If the health tool isn't visible:
- Confirm the env var is set in the shell Cursor was launched from
- Check Cursor's **Settings → MCP Servers** panel for the `superdocs` entry and any error messages
- The plugin's SKILL.md includes a "Setup check" section the AI can use to add the MCP server manually as a fallback: ask the AI to "set up Typebar MCP" and let it run `npx mcp-remote ...` directly via the Bash tool.

## Done

Once verified, the user is fully set up. Next steps they can try:

- "Edit `~/Downloads/contract.docx`: bold all monetary amounts, then export as .docx"
- "Draft a 1-page mutual NDA between Acme Corp and Beta Ltd, governed by Delaware law"
- `/superdocs:edit_styled_docx` slash command for a guided workflow

For docs: `https://docs.typebar.ai/mcp/setup`
For support: `hello@superdocs.app`
