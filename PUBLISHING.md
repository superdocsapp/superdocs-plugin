# Publishing this plugin + listing the MCP server in registries

This doc covers the one-time publication steps for distributing SuperDocs across the major channels in 2026. **All steps are user actions** — they require either GitHub repo creation, DNS access, or telemetry seeding via local install. Run in any order.

## 1. Push the plugin to GitHub (Claude Code marketplace auto-discovery)

The Claude Code plugin marketplace at [plugins.claude.ai](https://plugins.claude.ai) auto-discovers public GitHub repos with a valid `.claude-plugin/plugin.json`.

```bash
# One-time: create the repo at https://github.com/new
#   Owner: superdocsapp
#   Name: superdocs-plugin
#   Public: yes
#   Don't add README/license (we already have them)

cd ~/Documents/superdocs-plugin
git remote add origin git@github.com:superdocsapp/superdocs-plugin.git
git push -u origin main
```

Within hours, the plugin is discoverable. Anyone can install with:

```bash
claude plugin install superdocsapp/superdocs-plugin
```

**Validate post-push**: visit `https://plugins.claude.ai/superdocs` (or search the in-app marketplace). You should see the plugin card with the description from `plugin.json`.

## 2. Register the MCP server in the Anthropic MCP Registry

The [official MCP Registry](https://registry.modelcontextprotocol.io/) is fed by the `mcp-publisher` CLI. Downstream aggregators (PulseMCP, GitHub MCP Registry) pull from it hourly.

Submission requires **DNS ownership proof** for `superdocs.app` via an Ed25519 keypair + TXT record. One-time setup:

```bash
# 1. Install the publisher CLI
brew install mcp-publisher

# 2. Generate a keypair (keep key.pem secure — never commit it)
openssl genpkey -algorithm Ed25519 -out ~/.mcp-publisher-key.pem
PUBKEY=$(openssl pkey -in ~/.mcp-publisher-key.pem -pubout -outform DER 2>/dev/null | tail -c 32 | base64)

# 3. Add a TXT record to superdocs.app DNS (Google Cloud DNS console or via gcloud)
#    Name:    superdocs.app
#    Type:    TXT
#    Value:   v=MCPv1; k=ed25519; p=$PUBKEY
#
# Wait ~5 min for propagation; verify with:
dig TXT superdocs.app | grep MCPv1

# 4. Login to the registry
PRIVKEY=$(openssl pkey -in ~/.mcp-publisher-key.pem -noout -text | grep -A3 "priv:" | tail -n +2 | tr -d ' :\n')
mcp-publisher login dns --domain superdocs.app --private-key $PRIVKEY

# 5. Publish from the plugin repo (server.json lives at the root)
cd ~/Documents/superdocs-plugin
mcp-publisher publish
```

Expected output: `✓ Successfully published`.

**Validate post-publish** (within minutes):
```bash
curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=superdocs" | jq .
```

Within ~1 hour, you'll see SuperDocs listed in [PulseMCP](https://www.pulsemcp.com/) and the [GitHub MCP Registry](https://github.com/copilot/mcp).

To update the listing later, bump `version` in `server.json` and re-run `mcp-publisher publish`.

## 3. Seed the skills.sh listing (Vercel Labs Agent Skills Directory)

[skills.sh](https://skills.sh) doesn't accept submissions in the traditional sense — it's a leaderboard ranked by install telemetry from the `npx skills` CLI.

The "submission" is just installing it ourselves once + linking from launch material so others install it too:

```bash
# Install our own skill via the npx skills CLI — this seeds telemetry
npx skills add superdocsapp/superdocs-plugin
```

The CLI looks for `skills/<name>/SKILL.md` in the repo it's pointed at — our plugin's `skills/superdocs/SKILL.md` matches the layout, so this should pick up our skill directly without needing a separate repo.

If `npx skills` doesn't auto-discover the skill from the plugin repo (because the repo is primarily a Claude Code plugin, not a pure skills repo), create a thin `superdocsapp/superdocs-skill` mirror:

```bash
# Optional fallback if the plugin repo doesn't auto-list on skills.sh
mkdir -p ~/Documents/superdocs-skill/skills/superdocs
cp ~/Documents/SuperDocs/mcp/SKILL.md ~/Documents/superdocs-skill/skills/superdocs/SKILL.md
# Push to github.com/superdocsapp/superdocs-skill
# Then: npx skills add superdocsapp/superdocs-skill
```

To drive ranking, link `npx skills add superdocsapp/superdocs-plugin` from:
- Plugin README (already done)
- docs.superdocs.app/mcp/setup
- Any launch announcements (Naveen WhatsApp, Twitter, LinkedIn)

## 4. (Skipping for now) Cursor / Windsurf marketplaces

- Cursor: no first-class plugin marketplace for MCP servers as of April 2026. Manual config via `.cursor/mcp.json` is the install path. Documented at [docs.superdocs.app/mcp/cursor-vscode](https://docs.superdocs.app/mcp/cursor-vscode).
- Windsurf: same — `.windsurfrules` + manual MCP config. Low ROI to package.
- Cline: MCP-only, no skill/plugin format. Documented manually.

These tools are reachable but distribution is per-user manual config. Revisit if/when the tools ship native plugin systems.

## Summary of channels live after these steps

| Channel | Action | Outcome |
|---|---|---|
| Claude Code plugin marketplace | Push repo | `claude plugin install superdocsapp/superdocs-plugin` works for any user |
| Anthropic MCP Registry | DNS verify + `mcp-publisher publish` | SuperDocs listed; PulseMCP + GitHub MCP Registry pick up automatically |
| skills.sh | `npx skills add superdocsapp/superdocs-plugin` | Skill telemetry-listed; ranking by usage |
| Marketing site | Already deployed (`/features` mentions "single MCP server") | Linkable from anywhere |
