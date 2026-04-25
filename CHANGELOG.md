# Changelog

All notable changes to the SuperDocs Claude Code plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-26

### Added
- First release.
- Bundles SuperDocs MCP server (`https://api.superdocs.app/mcp/`) with 21 tools and 5 user-invocable workflow prompts.
- Auto-loading skill (`skills/superdocs/SKILL.md`) — Claude reaches for SuperDocs proactively on document work.
- `userConfig` prompts for `api_key` at install time; stored securely in OS keychain.
- 5 prompts surfaced as slash commands: `/superdocs:draft_from_outline`, `/superdocs:edit_styled_docx`, `/superdocs:convert_format`, `/superdocs:draft_nda`, `/superdocs:review_contract_for_redflags`.
- Compatible with Claude Code 2.1.x and the unified SuperDocs MCP server.
