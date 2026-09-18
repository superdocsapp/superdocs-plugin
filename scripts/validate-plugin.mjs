#!/usr/bin/env node
// Repository-level validation for the SuperDocs plugin. No dependencies:
// run with `node scripts/validate-plugin.mjs`.
//
// What is authoritative for what:
//   commands/*.md             -> the filesystem, for local commands
//   .cursor-plugin commands[] -> validated against the filesystem
//   MCP tools and prompts     -> scripts/known-tools.json (not discoverable locally)
//   prose counts and rosters  -> validated against the above

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const failures = [];
let currentCheck = null;

function check(name, fn) {
  currentCheck = { name, failed: false };
  try {
    fn();
  } catch (err) {
    fail(null, null, `check threw: ${err.message}`, 'this is a bug in the validator');
  }
  console.log(`${currentCheck.failed ? '✗' : '✓'} ${name}`);
  currentCheck = null;
}

function fail(file, line, problem, fix) {
  currentCheck.failed = true;
  failures.push({ check: currentCheck.name, file, line, problem, fix });
}

const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

function readJson(rel) {
  const text = read(rel);
  try {
    return { text, data: JSON.parse(text) };
  } catch (err) {
    fail(rel, null, `invalid JSON — ${err.message}`, 'fix the syntax error');
    return { text, data: null };
  }
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

function lineContaining(text, needle) {
  const i = needle == null ? -1 : text.indexOf(needle);
  return i === -1 ? null : lineOf(text, i);
}

// Frontmatter: only `name` and `description` matter, so a full YAML parser
// would be a dependency bought for two scalar keys.
function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return null;
  const fields = {};
  for (const raw of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(raw);
    if (kv) fields[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return fields;
}

const uniqueTokens = (text) =>
  [...new Set(text.match(/`[a-z0-9_]+`/g) || [])].map((t) => t.slice(1, -1));

// ---------------------------------------------------------------------------

let registry, claude, marketplace, cursor, server;

check('JSON files parse', () => {
  claude = readJson('.claude-plugin/plugin.json');
  marketplace = readJson('.claude-plugin/marketplace.json');
  cursor = readJson('.cursor-plugin/plugin.json');
  server = readJson('server.json');
  registry = readJson('scripts/known-tools.json').data ?? { tools: [], mcpPrompts: [], toolCount: 0 };
});

const commandFiles = existsSync(join(ROOT, 'commands'))
  ? readdirSync(join(ROOT, 'commands')).filter((f) => f.endsWith('.md')).sort()
  : [];
const commandNames = commandFiles.map((f) => basename(f, '.md'));

const docFiles = ['README.md', 'skills/superdocs/SKILL.md', ...commandFiles.map((f) => `commands/${f}`)];

// ---------------------------------------------------------------------------

check('registry is well-formed', () => {
  if (!Array.isArray(registry.tools) || registry.tools.length === 0) {
    fail('scripts/known-tools.json', null, '`tools` must be a non-empty array', 'list every MCP tool name');
    return;
  }
  if (registry.tools.length !== registry.toolCount) {
    fail('scripts/known-tools.json', null,
      `toolCount is ${registry.toolCount} but tools[] has ${registry.tools.length} entries`,
      `set "toolCount": ${registry.tools.length}`);
  }
  const dupes = [...new Set(registry.tools.filter((t, i) => registry.tools.indexOf(t) !== i))];
  if (dupes.length) {
    fail('scripts/known-tools.json', null, `duplicate tool names: ${dupes.join(', ')}`, 'remove the duplicates');
  }
  if (!Array.isArray(registry.mcpPrompts) || registry.mcpPrompts.length === 0) {
    fail('scripts/known-tools.json', null, '`mcpPrompts` must be a non-empty array',
      'list the workflow prompts served by the MCP server');
  }
});

check('plugin metadata has required fields', () => {
  const required = {
    '.claude-plugin/plugin.json': [['name'], ['version'], ['description'], ['author'], ['mcpServers'],
      ['userConfig', 'api_key'], ['mcpServers', 'superdocs', 'url']],
    '.cursor-plugin/plugin.json': [['name'], ['version'], ['description'], ['mcpServers'], ['skills'], ['commands']],
    'server.json': [['name'], ['version'], ['description'], ['remotes']],
    '.claude-plugin/marketplace.json': [['name'], ['owner'], ['plugins']],
  };
  const sources = {
    '.claude-plugin/plugin.json': claude,
    '.cursor-plugin/plugin.json': cursor,
    'server.json': server,
    '.claude-plugin/marketplace.json': marketplace,
  };
  for (const [file, paths] of Object.entries(required)) {
    const { data } = sources[file];
    if (!data) continue;
    for (const path of paths) {
      let node = data;
      for (const key of path) node = node?.[key];
      if (node === undefined || node === null || node === '') {
        fail(file, null, `missing required field \`${path.join('.')}\``, 'add it');
      }
    }
  }
  const plugins = marketplace.data?.plugins;
  if (Array.isArray(plugins) && claude.data && !plugins.some((p) => p.name === claude.data.name)) {
    fail('.claude-plugin/marketplace.json', null,
      `no plugin entry named "${claude.data.name}"`,
      'the marketplace must list the plugin declared in .claude-plugin/plugin.json');
  }
});

check('versions agree across manifests and changelog', () => {
  const version = claude.data?.version;
  if (!version) return;
  for (const [file, v] of [['.cursor-plugin/plugin.json', cursor.data?.version], ['server.json', server.data?.version]]) {
    if (v !== version) {
      fail(file, null, `version is ${v}, but .claude-plugin/plugin.json says ${version}`, `set it to ${version}`);
    }
  }
  const changelog = read('CHANGELOG.md');
  const heading = /^##\s+\[?v?([0-9]+\.[0-9]+\.[0-9]+)\]?/m.exec(changelog);
  if (!heading) {
    fail('CHANGELOG.md', null, 'no versioned `## ...` heading found', 'add a release heading');
  } else if (heading[1] !== version) {
    fail('CHANGELOG.md', lineOf(changelog, heading.index),
      `newest entry is ${heading[1]}, but the manifests say ${version}`,
      `add a ${version} entry, or correct the manifest version`);
  }
});

check('Claude and Cursor metadata are consistent', () => {
  if (claude.data && cursor.data && claude.data.name !== cursor.data.name) {
    fail('.cursor-plugin/plugin.json', null,
      `name "${cursor.data.name}" does not match .claude-plugin/plugin.json "${claude.data.name}"`,
      'use the same plugin name in both');
  }
  const entry = marketplace.data?.plugins?.find((p) => p.name === claude.data?.name);
  if (entry && claude.data && entry.description !== claude.data.description) {
    fail('.claude-plugin/marketplace.json', lineContaining(marketplace.text, '"description"'),
      'marketplace description differs from .claude-plugin/plugin.json',
      'keep the two descriptions identical');
  }
  for (const [file, data] of [['.claude-plugin/plugin.json', claude.data], ['.cursor-plugin/plugin.json', cursor.data]]) {
    if (data?.mcpServers && !data.mcpServers.superdocs) {
      fail(file, null, 'mcpServers has no `superdocs` entry', 'the MCP server must be keyed `superdocs`');
    }
  }
  if (cursor.data?.skills && !existsSync(join(ROOT, cursor.data.skills))) {
    fail('.cursor-plugin/plugin.json', lineContaining(cursor.text, '"skills"'),
      `skills path "${cursor.data.skills}" does not exist`, 'point it at the skills directory');
  }
});

check('commands referenced by metadata exist', () => {
  const declared = cursor.data?.commands;
  if (!Array.isArray(declared)) return;
  for (const rel of declared) {
    if (!existsSync(join(ROOT, rel))) {
      fail('.cursor-plugin/plugin.json', lineContaining(cursor.text, rel),
        `declares "${rel}", which does not exist`, 'create the file or remove the entry');
    }
  }
  // The filesystem is authoritative: a new command file that nobody registered
  // silently never reaches Cursor users.
  for (const file of commandFiles) {
    const rel = `commands/${file}`;
    if (!declared.includes(rel)) {
      fail('.cursor-plugin/plugin.json', lineContaining(cursor.text, '"commands"'),
        `${rel} exists but is not listed in commands[]`, `add "${rel}" to the commands array`);
    }
  }
});

check('command frontmatter is valid', () => {
  for (const file of commandFiles) {
    const rel = `commands/${file}`;
    const text = read(rel);
    const fm = frontmatter(text);
    if (!fm) {
      fail(rel, 1, 'no `---` frontmatter block', 'add frontmatter with `name` and `description`');
      continue;
    }
    for (const key of ['name', 'description']) {
      if (!fm[key]) fail(rel, 1, `frontmatter is missing \`${key}\``, `add a non-empty ${key}`);
    }
    const expected = basename(file, '.md');
    if (fm.name && fm.name !== expected) {
      fail(rel, lineContaining(text, fm.name),
        `frontmatter name "${fm.name}" does not match the filename`,
        `rename the file to ${fm.name}.md, or set name: ${expected}`);
    }
  }
});

check('documented workflows resolve to a command or MCP prompt', () => {
  const known = new Set([...commandNames, ...(registry.mcpPrompts ?? [])]);
  for (const rel of docFiles) {
    const text = read(rel);
    for (const m of text.matchAll(/\/superdocs:([a-z0-9_]+)/g)) {
      if (!known.has(m[1])) {
        fail(rel, lineOf(text, m.index),
          `references /superdocs:${m[1]}, which is neither a file in commands/ nor a registered MCP prompt`,
          `create commands/${m[1]}.md, add it to mcpPrompts in scripts/known-tools.json, or fix the name`);
      }
    }
  }
});

check('tool rosters list every known tool', () => {
  const rosters = [];

  const readme = read('README.md');
  const row = readme.split('\n').find((l) => /^\|\s*Tools \(/.test(l));
  if (!row) {
    fail('README.md', null, 'no `| Tools (N) |` table row found',
      'the validator locates the tool roster by that row');
  } else {
    rosters.push(['README.md', readme, row]);
  }

  const skill = read('skills/superdocs/SKILL.md');
  const idx = skill.indexOf('## Tool reference');
  if (idx === -1) {
    fail('skills/superdocs/SKILL.md', null, 'no `## Tool reference` section found',
      'the validator locates the tool roster by that heading');
  } else {
    rosters.push(['skills/superdocs/SKILL.md', skill, skill.slice(idx)]);
  }

  // Required-presence only. These sections also mention parameters and event
  // names in backticks, so "every backticked token must be a tool" would be wrong.
  for (const [file, full, section] of rosters) {
    const present = new Set(uniqueTokens(section));
    const missing = (registry.tools ?? []).filter((t) => !present.has(t));
    if (missing.length) {
      fail(file, lineOf(full, full.indexOf(section)),
        `tool roster is missing ${missing.length} tool(s): ${missing.join(', ')}`,
        'add them to the roster, or remove them from scripts/known-tools.json');
    }
  }
});

check('documented counts match the registry', () => {
  // CHANGELOG.md is excluded on purpose: historical entries correctly cite
  // older counts (22, 35, 37).
  const toolPatterns = [/(\d+)\s+(?:SuperDocs\s+|MCP\s+)?tools\b/g, /\bTools\s*\((\d+)\)/g];
  const promptPatterns = [/(\d+)\s+(?:user-invocable\s+)?(?:workflow\s+)?prompts\b/g, /\bPrompts\s*\((\d+)\)/g];
  const expectedTools = registry.toolCount;
  const expectedPrompts = (registry.mcpPrompts ?? []).length;

  const targets = docFiles.map((rel) => [rel, read(rel)]);
  for (const [file, src] of [['.claude-plugin/plugin.json', claude], ['.claude-plugin/marketplace.json', marketplace],
    ['.cursor-plugin/plugin.json', cursor], ['server.json', server]]) {
    targets.push([file, src.text]);
  }

  for (const [file, text] of targets) {
    for (const [patterns, expected, label] of [[toolPatterns, expectedTools, 'tool'], [promptPatterns, expectedPrompts, 'prompt']]) {
      for (const pattern of patterns) {
        for (const m of text.matchAll(pattern)) {
          if (Number(m[1]) !== expected) {
            fail(file, lineOf(text, m.index),
              `says "${m[0].trim()}" but the registry declares ${expected} ${label}s`,
              `change ${m[1]} to ${expected}`);
          }
        }
      }
    }
  }
});

check('relative links resolve', () => {
  for (const rel of [...docFiles, 'CHANGELOG.md']) {
    const text = read(rel);
    for (const m of text.matchAll(/\]\((\.{1,2}\/[^)\s#]+)/g)) {
      const target = resolve(ROOT, dirname(rel), m[1]);
      if (!existsSync(target)) {
        fail(rel, lineOf(text, m.index),
          `link to ${m[1]} does not resolve (${relative(ROOT, target)} is missing)`,
          'fix the path or create the file');
      }
    }
  }
});

// ---------------------------------------------------------------------------

if (failures.length === 0) {
  console.log('\nAll checks passed.');
  process.exit(0);
}

console.log(`\n${failures.length} problem(s) found:\n`);
for (const f of failures) {
  const where = f.file ? `${f.file}${f.line ? `:${f.line}` : ''}` : '(repository)';
  console.log(`  ${where}`);
  console.log(`    ${f.problem}`);
  console.log(`    fix: ${f.fix}\n`);
}
process.exit(1);
