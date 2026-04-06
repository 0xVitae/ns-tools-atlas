---
sidebar_position: 4
sidebar_label: "Claude Code Plugin"
---

# Claude Code Plugin

NS Tools Atlas ships a **Claude Code plugin** that gives Claude contextual knowledge about Network School APIs and this codebase. Install it to get AI-assisted help when building with NS tools or contributing to the project.

## What's included

The plugin provides two skills:

| Skill | Slash command | Description |
|---|---|---|
| [**NS Auth**](https://github.com/0xVitae/ns-tools-atlas/blob/main/skills/ns-auth/SKILL.md) | `/ns-tools:ns-auth` | Full API reference and integration guide for NS Auth — the Discord membership verification API. Claude will walk you through setting up Discord OAuth, calling the verify endpoint, and handling responses in your framework of choice. |
| [**Contributing**](https://github.com/0xVitae/ns-tools-atlas/blob/main/skills/contributing/SKILL.md) | `/ns-tools:contributing` | Codebase guide for ns-tools-atlas. Covers project structure, data flow patterns, database schema, conventions, and how to add features, pages, and endpoints. |

## Installation

### From the marketplace

```bash
# Add the marketplace
/plugin marketplace add 0xvitae/ns-tools-atlas

# Install the plugin
/plugin install ns-tools
```

### Local development

If you've already cloned the repo, you can load the plugin directly:

```bash
claude --plugin-dir /path/to/ns-tools-atlas
```

:::tip Hot reload
When running locally with `--plugin-dir`, changes to skill files are picked up automatically — no restart needed.
:::

## Usage

### NS Auth integration

Ask Claude to help you integrate NS Auth, or invoke the skill directly:

```
/ns-tools:ns-auth add NS Auth login to my Next.js app
```

Claude will:
1. Guide you through Discord OAuth setup
2. Generate the verify endpoint call for your stack
3. Ensure the API key stays server-side
4. Handle error responses and rate limiting

### Contributing to the Atlas

Ask Claude about the codebase, or invoke directly:

```
/ns-tools:contributing how do I add a new API endpoint?
```

Claude will:
1. Explain the data flow pipeline (schema -> endpoint -> API client -> hook -> component)
2. Show the relevant files and conventions
3. Generate code that matches existing patterns

## Contributing to the plugin

Want to add new skills or improve existing ones? See the [Plugin contributing guide](./contributing/plugin.md).
