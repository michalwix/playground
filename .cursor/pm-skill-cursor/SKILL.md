---
name: pm-skill
description: |
  Entry point for PM workflows. Routes to specialized skills based on need.
  Use when PM wants help with: research, competitor analysis, or product deliverables.

  Triggers: any PM request, "help me", "I need to", "research", "competitor",
  "user story", "estimate", "flows", "understand", "compare"
---

# PM Skill - Router

Your command center for PM work. This skill routes you to the right tool.

---

## Step 0: Check for Existing Sessions

Before starting, check `sessions/INDEX.md` for related past work:

```
I found related past sessions:
- [date]: [topic] (status)

Would you like to:
1. Continue that session
2. Start fresh
```

If no relevant sessions, proceed to Step 1.

---

## Step 1: What Do You Need?

Use AskUserQuestion to route:

```
Question: "What do you need help with?"
Options:
  - "Research our systems"
    → Understand codebase, query data, analyze traces
  - "Research competitors"
    → Live online research on competitor pricing, features, flows
  - "Create deliverables"
    → User stories, estimations, flow verification
  - "Continue previous work"
    → Load and continue a saved session
```

---

## Step 2: Route to Sub-skill

Based on selection, announce and load:

| Selection | Action |
|-----------|--------|
| Research our systems | "I'm using **premium-research** to help you understand our systems." → Load `premium-research/SKILL.md` |
| Research competitors | "I'm using **competitor-research** to gather live data." → Load `competitor-research/SKILL.md` |
| Create deliverables | "I'm using **product-hub** to create your deliverable." → Load `product-hub/SKILL.md` |
| Continue previous | Show sessions list → Load selected session context → Route to appropriate skill |

---

## Step 3: Cross-Skill Navigation

After completing work in any sub-skill, offer next steps:

```
Question: "What would you like to do next?"
Options:
  - "Save and exit" → Save session, end
  - "Research more" → Route to premium-research
  - "Check competitors" → Route to competitor-research
  - "Create deliverables" → Route to product-hub
```

---

## Session Management

All sub-skills share the same session system:

**Save Session:**
- Location: `sessions/YYYY-MM-DD-<topic>/`
- Contents: README.md, queries.sql (if data), code-refs.md (if code)
- Update: `sessions/INDEX.md`

**Load Session:**
- Read session README.md
- Restore context
- Note: Code references may be stale - always re-verify with live search

---

## Skill Map

```
pm-skill (you are here)
    │
    ├── premium-research/
    │   └── Codebase navigation, data queries, trace analysis
    │   └── References: architecture, caller-callee, trino tables
    │
    ├── competitor-research/
    │   └── Live online research, pricing, features, SWOT
    │   └── ALWAYS fetches current data (no cache)
    │
    └── product-hub/
        └── User stories, estimations, flow verification
        └── References: flow guidelines, templates
```

---

## Quick Commands

For experienced PMs, skip routing:

| Say | Goes to |
|-----|---------|
| "How does X work?" | premium-research |
| "Query data for X" | premium-research → data |
| "What does [competitor] charge?" | competitor-research |
| "Compare us to X" | competitor-research |
| "Write stories for X" | product-hub → stories |
| "Estimate X" | product-hub → estimation |
| "New product X" | product-hub → flow verification |
