# Contributing

Thanks for helping improve the SuperDocs plugin.

## Validate before you open a PR

```bash
node scripts/validate-plugin.mjs
```

It needs Node 18+ and nothing else — there is no `package.json`, no lockfile, and nothing to install. The same command runs in CI on every pull request (`.github/workflows/validate-plugin.yml`), so a green local run means a green CI run.

Every failure names the file, the line, what is wrong, and what to do about it:

```
  README.md:10
    says "39 MCP tools" but the registry declares 38 tools
    fix: change 39 to 38
```

## What gets checked

| Check | What it catches |
|---|---|
| JSON files parse | A syntax error in any manifest or `server.json` |
| Registry is well-formed | `toolCount` disagreeing with `tools[]`, duplicate tool names |
| Required metadata fields | A manifest missing `version`, `mcpServers`, `userConfig.api_key`, … |
| Versions agree | `.claude-plugin`, `.cursor-plugin`, `server.json`, and the newest CHANGELOG entry drifting apart |
| Claude/Cursor consistency | Mismatched plugin names or descriptions, a `skills` path that does not exist |
| Commands exist | A command listed in Cursor's `commands[]` with no file, or a command file nobody registered |
| Command frontmatter | Missing `name`/`description`, or a `name` that does not match the filename |
| Workflow references | A `/superdocs:*` mention in the docs that resolves to nothing |
| Tool rosters | A tool missing from the README table or the SKILL.md tool reference |
| Documented counts | "38 MCP tools" going stale in any of the nine places it appears |
| Relative links | A markdown link to a file that is not there |

## Sources of truth

The validator deliberately does not treat one file as canonical for everything:

- **Local commands — the filesystem.** `commands/*.md` is authoritative. Add a file and the validator will tell you to register it in `.cursor-plugin/plugin.json`; there is no third list to keep in sync.
- **MCP tools and workflow prompts — `scripts/known-tools.json`.** These are served by `https://api.superdocs.app/mcp/` and cannot be discovered from this repository, so they are declared.

Note that the four `/superdocs:*` workflows (`draft_from_outline`, `edit_styled_docx`, `convert_format`, `review_contract_for_redflags`) are **remote MCP prompts, not files in `commands/`**. That is why they live in `known-tools.json` under `mcpPrompts`.

## Adding an MCP tool

1. Add the tool name to `tools` in `scripts/known-tools.json` and bump `toolCount`.
2. Run `node scripts/validate-plugin.mjs`. It will enumerate every roster and every prose count that still needs updating.
3. Fix what it lists, re-run until green, and add a CHANGELOG entry.

CHANGELOG.md is exempt from the count checks — historical entries correctly cite the counts of the day (22, 35, 37).

## Adding a command

1. Create `commands/<name>.md` with `name` and `description` frontmatter, where `name` matches the filename.
2. Add `"commands/<name>.md"` to `commands` in `.cursor-plugin/plugin.json` (Claude Code discovers `commands/` automatically; Cursor does not).
3. Run the validator.
