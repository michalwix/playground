# PM Skills for Cursor - Quick Install

## What You Get

| Skill | What It Does | Say This |
|-------|--------------|----------|
| **Premium Research** | Explore codebase, query data, read traces | "How does checkout work?" |
| **Competitor Research** | Live online competitor analysis | "What does Stripe charge?" |
| **Product Hub** | User stories, estimates, flow verification | "Write stories for X" |

---

## Installation (2 Steps)

### Step 1: Copy the Skills Folder

```bash
# Navigate to your project
cd /path/to/your-project

# Create .cursor folder if needed
mkdir -p .cursor

# Copy the entire pm-skill-cursor folder
cp -r /path/to/pm-skill-cursor .cursor/
```

Your structure should look like:
```
your-project/
├── .cursor/
│   └── pm-skill-cursor/
│       ├── SKILL.md
│       ├── premium-research/
│       ├── competitor-research/
│       ├── product-hub/
│       └── sessions/
└── ... your files
```

### Step 2: Create .cursorrules

Copy the `cursorrules-template` file to your project root and rename it:

```bash
cp .cursor/pm-skill-cursor/cursorrules-template .cursorrules
```

Or create `.cursorrules` manually in your project root with this content:

```
# PM Skills for Cursor

## Skill Loading Rules

When I ask about understanding flows, codebase, data, or traces:
→ Read and follow .cursor/pm-skill-cursor/premium-research/SKILL.md

When I ask about competitors, pricing, or competitive analysis:
→ Read and follow .cursor/pm-skill-cursor/competitor-research/SKILL.md

When I ask about creating user stories, estimates, or verifying flows:
→ Read and follow .cursor/pm-skill-cursor/product-hub/SKILL.md

For help choosing which skill to use:
→ Read .cursor/pm-skill-cursor/SKILL.md

## Required Behaviors

1. ALWAYS use the skill file - don't work from memory
2. Ask clarifying questions before generating anything
3. Use interactive options when asking questions
4. Verify outputs before finalizing - every claim needs a source
5. Never make up data, URLs, or code paths
```

---

## Verify It Works

After installing, restart Cursor and test:

| Test | What Should Happen |
|------|-------------------|
| "How does checkout work?" | Asks skill level, research type, then explores code |
| "What does Stripe charge?" | Fetches live pricing from Stripe's website |
| "Write user stories for X" | Asks user type, goal, then generates with verification |

---

## Quick Reference

| I want to... | Say... |
|--------------|--------|
| Understand a flow | "How does [X] work?" |
| Find code | "Where is [X] implemented?" |
| Query data | "Get data on [X]" |
| Compare competitors | "Compare us to [X]" |
| Check pricing | "What does [X] charge?" |
| Write stories | "Write user stories for [X]" |
| Estimate | "Estimate [X]" |
| Verify flows | "What flows do we need for [X]?" |

---

## Optional: MCP Servers

For enhanced GitHub search capabilities:

1. Get GitHub token: GitHub → Settings → Developer settings → Personal access tokens
2. Configure in Cursor settings (check Cursor docs for MCP config location)

---

## Troubleshooting

**Skill not working?**
- Check `.cursorrules` is in project root (not in .cursor folder)
- Restart Cursor after adding .cursorrules
- Be explicit: "Using premium-research skill, help me..."

**Need to update architecture docs?**
- Edit files in `.cursor/pm-skill-cursor/premium-research/references/`

---

That's it! Start asking questions.
