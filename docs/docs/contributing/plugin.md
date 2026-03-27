---
sidebar_position: 4
sidebar_label: "Claude Plugin"
---

# Contributing to the Claude Plugin

NS Tools ships a Claude Code plugin that gives Claude contextual knowledge about the codebase and Network School APIs. Improving this plugin directly improves the developer experience for everyone contributing to the Atlas and tools in the NS ecosystem.

## Adding a new skill

1. Create a new directory under `skills/`:

   ```
   skills/my-skill/
     SKILL.md
   ```

2. Add frontmatter with `name` and `description`:

   ```markdown
   ---
   name: my-skill
   description: "When to trigger this skill..."
   ---

   # Skill content here
   ```

   The `description` controls when Claude auto-invokes the skill — write it as a condition ("When the user asks about X" or "When working with Y").

3. The skill is automatically picked up. No changes needed to `plugin.json`.

## Improving existing skills

The most impactful contribution is making existing skills more accurate and complete. Read through the current skills and check:

- Are the code examples still correct?
- Are all the API endpoints documented?
- Are there patterns or conventions that a contributor would need to know?

## Installing the plugin locally

If you've cloned the repo, load the plugin directly:

```bash
claude --plugin-dir /path/to/ns-tools-atlas
```

Changes to skill files are picked up automatically — no restart needed.

## Installing from the marketplace

```bash
/plugin marketplace add 0xvitae/ns-tools-atlas
/plugin install ns-tools
```
