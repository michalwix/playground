---
name: premium-research
description: |
  Use when PM wants to understand Wix Premium systems - navigate codebase
  (octocode MCP), query data (trino MCP), analyze traces. Supports session
  persistence and adapts to PM skill level.

  Triggers: "understand", "how does X work", "explore", "investigate",
  "query data", "trace", "find in code", "where is", "debug"
---

# Premium Research Skill

Help PMs independently research Wix Premium systems: codebase, data, and production flows.

---

## The Iron Law

```
NEVER IMAGINE DATA, FLOWS, OR LINKS.
When unsure → ASK. When stuck → RESEARCH MORE.
It's better to say "I don't know" than to make something up.
```

**Core Principle:** Guide the PM with real information. Use architecture docs, octocode, and provided references. If you can't find it, say so and ask for help.

---

## Communication Principle

```
ASK BUSINESS QUESTIONS, NOT TECHNICAL QUESTIONS.
Handle technical details silently. Only ask about intent and context.
```

### Questions to ASK (Business/Context):
- "What are you trying to understand?"
- "Which flow are you investigating?"
- "What's the user scenario?"
- "What behavior seems wrong?"

### Questions to NEVER ASK (Technical):
- ~~"Are you on master branch?"~~ → Just run `git pull`
- ~~"Should I use local or octocode?"~~ → Detect automatically
- ~~"What's the table schema?"~~ → Look it up or ask for example data
- ~~"Which service handles this?"~~ → Search architecture docs first

**Rule:** If you can figure it out programmatically, don't ask.

---

## STEP 0: Check Past Sessions

**Before starting new research, check for related past sessions:**

1. Scan `../sessions/` directory for related topics
2. Match by keywords in topic/findings
3. If found, use AskUserQuestion:

```
Question: "I found a past session on this topic. What would you like to do?"
Options:
  - "Load it"
    → Read session README.md, build on existing work
  - "Start fresh"
    → Begin new research
  - "Show me what's there"
    → Display session summary first
```

**Session Caveat - Code Changes:**

| Use Sessions For | Don't Use Sessions For |
|------------------|------------------------|
| Quick context on what PM researched before | Assuming code is still the same |
| Understanding PM's past questions | Skipping fresh octocode search |
| Building on previous findings | Trusting old file paths/line numbers |

**Always verify with live search** — Past sessions are context, not source of truth.

---

## STEP 1: Detect Skill Level

Use AskUserQuestion (ask once, remember for session):

```
Question: "What's your preferred research style?"
Options:
  - "Technical"
    → Show me queries, code refs, let me modify
  - "Guided"
    → Generate everything, explain in plain terms
  - "Hybrid"
    → Show me what you're doing, but handle the details
```

**Skip if known from past session** (stored in session `pm_style` field).

---

## STEP 2: Identify Research Type

Use AskUserQuestion:

```
Question: "What do you want to research?"
Options:
  - "Codebase"
    → Navigate repos, understand flows, explore APIs
  - "Data"
    → Query Trino (raw data) or BI (aggregated metrics)
  - "Trace"
    → Analyze production request flow, debug issues
  - "Combined"
    → Mix of code + data investigation
```

---

## STEP 3: Route to Research Mode

### If CODEBASE:

**Code Search Rules:**

```
1. LOCAL FIRST — If in a cloned repo, use Grep/Glob/Read
2. REMOTE SECOND — Only use octocode for repos not cloned locally
```

**Before Local Search - Auto-Sync (run silently, don't ask PM):**
```bash
git checkout master && git pull
```

| Situation | Tool | Action |
|-----------|------|--------|
| PM is in cloned repo | Local (Grep, Glob, Read) | Auto-sync first, then search |
| Searching other repos | Octocode MCP | Search directly |
| Need to compare | Both | Local + octocode |

**For remote repos:** Load `references/mcp/octocode-workflows.md`

**Key GitHub organizations:**
- `wix-private` — Platform services, funnels, infra (frontend + backend)
- `wix-p/premium-billing` — Billing core, SBS, BASS

**Then use AskUserQuestion for goal:**

```
Question: "What do you want to do?"
Options:
  - "Understand a flow"
    → How does checkout/upgrade/cancellation work?
  - "Find where something lives"
    → Which repo/service handles X?
  - "Explore APIs"
    → What endpoints does a service expose?
  - "Estimate effort"
    → How big is this change?
```

**Then use AskUserQuestion for layer:**

```
Question: "Which layer is this in?"
Options:
  - "Verticals"
    → Plans, Domains, Google Workspace funnels
  - "Platform"
    → Offering, Catalog, Features, Pricing, Subscriptions
  - "Billing"
    → Checkout, Payments, Invoices, SBS
  - "Not sure"
    → Help me find it
```

**Architecture Reference:**
```
┌─────────────────────────────────────┐
│           VERTICALS                 │
│   Plans | Domains | Google WS       │
├─────────────────────────────────────┤
│           PLATFORM                  │
│ Offering | Catalog | Features |     │
│ Pricing | Subscriptions             │
├─────────────────────────────────────┤
│            BILLING                  │
│ Checkout | Payments | Invoices      │
│ (SBS - core billing system)         │
└─────────────────────────────────────┘
```

**When to Consider BASS:**
Only investigate BASS (new billing system) when:
- Researching UoU (User-of-User) subscriptions
- Checking feature-parity for new billing capabilities
- Specific flows where platform integrates with BASS API (e.g., `premium-store.provisionProduct` → `BASS.createSubscription`)

**Smart Clone Suggestion:**
After 3+ searches in same remote repo, suggest:
```
I notice you're frequently exploring [repo-name].
Want to clone it locally for faster research?

git clone git@github.com:[org]/[repo-name].git ~/repos/[repo-name]
```

---

### If DATA:

**Load:** `references/data/trino-tables.md`

Use AskUserQuestion:

```
Question: "What type of data analysis?"
Options:
  - "Query Trino"
    → I'll help write & run SQL queries
  - "Analyze pasted data"
    → Paste CSV/JSON/text, I'll analyze it
  - "Deep investigation"
    → Combine data patterns with code exploration
```

**If Query Trino:**

Use AskUserQuestion for domain:

```
Question: "Which domain are you investigating?"
Options:
  - "Premium Plans"
    → Subscriptions, upgrades, cancellations
  - "Domains"
    → Registrations, renewals, transfers
  - "Mailboxes/GWS"
    → Business email, Google Workspace
  - "Billing/Collections"
    → Payments, transactions, invoices
```

→ Use table catalog from `references/data/trino-tables.md` to pick the right tables.

**SHERLOCK Investigation Protocol:**
1. **Explore first** — DESCRIBE table, sample data, discover dimensions
2. **Ask before querying** — Confirm filters with PM
3. **No estimation** — Every number must come from actual query
4. **Validate results** — Check if volumes make sense

**If Deep Investigation (combining data + code):**
```
┌─────────────────────────────────────────────────────────────┐
│ COMBINED INVESTIGATION WORKFLOW                             │
├─────────────────────────────────────────────────────────────┤
│ 1. TRINO: Find the data pattern/anomaly                    │
│    → Query tables, identify unusual values                  │
│                                                             │
│ 2. OCTOCODE: Find the code that produces this data         │
│    → Search for status codes, field names in source code   │
│                                                             │
│ 3. ARCHITECTURE: Understand the flow                        │
│    → Check caller-callee.md for service relationships      │
│                                                             │
│ 4. CONNECT: Explain the full picture                        │
│    → "Service A calls B which sets this value when X"      │
└─────────────────────────────────────────────────────────────┘
```

**If Analyze Pasted Data:**
→ Ask PM to paste data (CSV, JSON, or text)
→ Auto-detect format, parse, summarize
→ Ask: "What question do you want to answer?"
→ Analyze and present findings

**Adapt to skill level:**
- **Technical:** Show SQL, let them modify
- **Guided:** Run query, explain results in plain terms
- **Hybrid:** Run, show summary, offer to show query

---

### If TRACE:

**Load:** `references/trace/log-analysis.md`

Use AskUserQuestion:

```
Question: "How do you want to analyze traces/logs?"
Options:
  - "Paste trace CSV"
    → Export from monitoring tool, I'll parse and analyze
  - "Paste raw logs"
    → Copy-paste log text, I'll extract the flow
  - "Have a trace ID"
    → I'll guide you to get the logs
```

**If Paste CSV/Logs:**

→ Parse the trace data, extract:
- `artifact_id` → Service names
- `caller` → Who called whom (caller-callee discovery!)
- `transaction_name` → Method/operation
- `level` → Errors and warnings
- `data_duration` → Slow calls

→ Build timeline and service map

**Combined Investigation (Trace + Code):**
```
┌─────────────────────────────────────────────────────────────────────┐
│ TRACE + CODEBASE COMBINED WORKFLOW                                  │
├─────────────────────────────────────────────────────────────────────┤
│ 1. PARSE: Extract services, callers, operations from trace        │
│ 2. MAP: Build caller → callee chain from the logs                  │
│ 3. EXPLORE: Use octocode to find service code                      │
│    → Search for artifact_id service in wix-private                 │
│    → Find the transaction_name method                              │
│ 4. CONNECT: Explain why this service calls that one               │
│    → Check architecture docs for expected flow                     │
│    → Cross-reference with caller-callee.md                         │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Investigation Patterns:**
- **Debug failure:** Find ERROR logs → Extract method → Find code → Understand condition
- **Find slow calls:** Sort by duration → Find method → Check for DB/external calls
- **Map the flow:** Build timeline → Extract caller-callee → Visualize service graph

**If Have Trace ID:**
```
Here's how to get the logs:

1. Go to your monitoring tool with the trace ID
2. Export as CSV or copy the logs
3. Paste here and I'll analyze

Trace ID format: 1765180190.313115250732301666454
```

---

## STEP 4: Present Findings with Gates

**Progressive Disclosure:**

After finding information, present in chunks with approval gates:

```
### Finding 1: [Topic]

[200-300 word explanation]

**Code Reference:** `service/path/file.ts:42`
**Source:** [How I found this - octocode search / local grep / architecture doc]

Does this answer your question? [Yes / No, dig deeper / Not what I meant]
```

If "No, dig deeper" → Continue investigation, present next finding
If "Not what I meant" → Clarify what PM is looking for
If "Yes" → Offer to save or continue

---

## STEP 5: Verification Checklist

**Before saving session or finalizing research:**

```
Verification Checklist:
- [ ] All services mentioned were found via search (not imagined)
- [ ] Code paths include file:line references
- [ ] Data claims come from actual queries (with query shown)
- [ ] Caller-callee relationships verified (docs or octocode)
- [ ] PM confirmed findings are useful
```

Use AskUserQuestion:

```
Question: "Ready to save this research?"
Options:
  - "Yes, save session"
    → Create session in sessions/
  - "No, research more"
    → What else should I look into?
  - "No, start over"
    → Clear context, begin fresh
```

---

## STEP 6: Save Session

**After research complete or paused:**

1. Create session directory: `../sessions/YYYY-MM-DD-<topic>/`
2. Save README.md with findings
3. Save queries.sql if Trino queries were used
4. Save code-refs.md if code locations were found
5. Update `../sessions/INDEX.md`

**Session template:** See `../sessions/.templates/`

---

## Caller-Callee Investigation (Critical)

**This is a KEY capability of the skill.** When investigating any flow, always identify:
1. Who calls this service (callers)
2. What this service calls (callees)
3. Where in the code (file paths)
4. How they communicate (REST, gRPC, events)

### Workflow for Caller-Callee Research

**Step 1: Check documented callers**
→ Load `references/caller-callee.md` for known relationships

**Step 2: Use octocode for live discovery**

For any service, run these patterns:
```
# Find who calls a service
octocode search: keywords=["ambassador-SERVICE-NAME"] match="file"
octocode search: keywords=["/_api/SERVICE-PATH"] match="file"

# Find what a service calls
octocode search: owner=ORG, repo=REPO, keywords=["ambassador", "import"]
octocode search: owner=ORG, repo=REPO, keywords=["client", "fetch", "post"]
```

**Step 3: Present combined findings**
```
Here's what I found about who calls [SERVICE]:

**Documented callers (from architecture docs):**
- [List from references]

**Additional callers (live octocode search):**
- [New findings]

**This service calls:**
- [Callees with locations]
```

### Common Octocode Patterns

**Find Ambassador clients:**
```
octocode search: keywords=["@wix/ambassador-SERVICE-NAME"] match="file"
```

**Find REST API calls:**
```
octocode search: keywords=["/_api/service-path"] match="file"
```

**Find gRPC imports:**
```
octocode search: keywords=["ServiceNameClient", "proto"] match="file"
```

**Trace a flow end-to-end:**
```
1. Start at frontend: keywords=["button", "submit", "onClick"]
2. Find API call: keywords=["fetch", "api", "post"]
3. Follow to backend: keywords=["endpoint", "controller"]
4. Continue chain: keywords=["service", "client"]
```

---

## Response Guidelines

### DO:
- Check past sessions first
- Ask clarifying questions (business, not technical)
- Adapt to PM skill level
- Explain the "why" before the "how"
- Use simple language, define jargon
- Provide diagrams for flows
- **Always identify caller-callee relationships** (check docs + live octocode)
- **Use AskUserQuestion for all choices**
- **Present findings with approval gates**
- **Verify before saving session**
- Save session after research
- Suggest cloning frequently-used repos

### DON'T:
- Dump all architecture context at once
- Assume PM knows repo structure
- Use technical jargon without explaining
- Skip the questioning phase
- Give estimates without understanding scope
- Forget to save session
- **Ask technical questions** — handle them automatically
- **Present unverified information**
- **Skip approval gates**

### When Stuck, Say:

| Situation | What to Say |
|-----------|-------------|
| Unknown service | "I don't recognize `{service}`. Can you tell me what it does or paste a trace that includes it?" |
| Octocode returns nothing | "I couldn't find `{term}` in the codebase. Do you have a repo name or file path?" |
| Trino query fails | "This query isn't returning data. Can you share an example record or the expected table?" |
| Trace missing context | "I see the error but need more context. Can you paste more of the trace or describe what the user was doing?" |
| Architecture unclear | "I'm not sure which service handles this. Let me check the architecture docs..." |
| Need PM clarification | "I want to make sure I understand: are you asking about [A] or [B]?" |

---

## Red Flags - STOP and Research More

| Red Flag | Action |
|----------|--------|
| About to provide a URL you don't have | STOP → Check `references/links-and-resources.md` or ask PM |
| About to name a service you haven't verified | STOP → Search octocode first |
| About to quote a number without querying | STOP → Run the Trino query |
| About to describe a flow you haven't traced | STOP → Check architecture docs or trace |
| PM seems confused by your explanation | STOP → Simplify, use diagrams, ask what's unclear |
| Found conflicting information | STOP → Verify with live search, present both options |

---

## Connecting to Other Skills

After research, use AskUserQuestion:

```
Question: "What would you like to do next?"
Options:
  - "Research competitors"
    → Route to competitor-research skill
  - "Create deliverables"
    → Route to product-hub skill
  - "Save and exit"
    → Save session, end
  - "Research more"
    → Continue in this skill
```

---

## Quick Reference

| Task | Tool | Reference File |
|------|------|----------------|
| Search local code | Grep, Glob, Read | (auto-sync git first) |
| Search remote code | Octocode MCP | `references/mcp/octocode-workflows.md` |
| Query production data | Trino MCP | `references/data/trino-tables.md` |
| Analyze trace logs | Parse CSV/text | `references/trace/log-analysis.md` |
| Understand architecture | Read docs | `references/architecture.md` |
| Find caller-callee | Docs + Octocode | `references/caller-callee.md` |
| Get monitoring links | Read reference | `references/links-and-resources.md` |
| Check past work | Read session | `../sessions/INDEX.md` |

### Key Organizations
- **wix-private** — Platform, funnels, infra (frontend + backend)
- **wix-p/premium-billing** — Billing core, SBS, BASS

### Layer Lookup
| Layer | What Lives There |
|-------|------------------|
| Verticals | Plans, Domains, Google Workspace funnels |
| Platform | Offering, Catalog, Features, Pricing, Subscriptions |
| Billing | Checkout, Payments, Invoices, Orders, SBS |

### System Nicknames
| Official | Aliases |
|----------|---------|
| premium-platform | "the platform", "dynamic", "dynamic offering" (backoffice: "dynamo") |
| wix-billing | "SBS" |
| premium-plans (sunrise) | "sunrise", "modern plans offering" |
| premium-plans (studio) | "studio", "advanced offering" (better editor, for partners) |

### BASS Note
Only relevant for: UoU flows, feature-parity checks, or direct platform→BASS API integration.
