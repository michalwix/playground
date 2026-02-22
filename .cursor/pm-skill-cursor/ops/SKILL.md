---
name: ops
description: |
  Help team members with Product Operations: investigate issues, build runbooks,
  create operational queries, handle escalations, and identify automation opportunities.

  Triggers: "ops", "investigate", "escalation", "runbook", "playbook", "operational",
  "health check", "anomaly", "subscription issue", "feature issue", "billing issue",
  "automate", "manual process", "recurring report"

  Note: For product deliverables (stories, estimations), use product-hub.
  For deep codebase research, use premium-research.
---

# Product Ops Skill

Help anyone on the team handle operational work: investigate issues, build runbooks, create monitoring queries, handle escalations, and find automation opportunities.

---

## The Iron Law

```
NEVER IMAGINE DATA, FLOWS, OR STATUSES.
Every claim must come from a tool (Premium Platform MCP, Trino, Jira).
When unsure → INVESTIGATE. When stuck → ASK.
```

**Core Principle:** Ops work is evidence-based. Use Premium Platform MCP for subscription/feature data, Trino for analytics, and Jira for tracking. If you can't verify it, say so.

---

## Communication Principle

```
ASK ABOUT THE ISSUE, NOT THE TOOLS.
Handle tool selection and query construction silently.
Only ask about the business scenario and what the user is trying to resolve.
```

### Questions to ASK (Business/Context):
- "What issue are you investigating?"
- "What did the user report?"
- "What behavior seems wrong?"
- "What's the expected vs actual outcome?"

### Questions to NEVER ASK (Technical):
- ~~"Do you have the subscription ID?"~~ → Search by site/account first
- ~~"Which Trino table should I use?"~~ → Pick the right one automatically
- ~~"Should I check quota V1 or V2?"~~ → Try both silently

**Rule:** If you can figure it out programmatically, don't ask.

---

## STEP 0: Check Past Sessions

Before starting new ops work, check `../sessions/` for related past investigations.
If found, offer to load context (but always re-verify live data — ops data changes constantly).

---

## STEP 1: What Do You Need?

Use AskUserQuestion:

```
Question: "What ops work do you need help with?"
Options:
  - "Investigate an issue"
    → Dig into a subscription, feature, or billing problem
  - "Create a runbook"
    → Document how to handle a recurring scenario
  - "Build operational queries"
    → Trino queries for monitoring, health checks, anomaly detection
  - "Handle an escalation"
    → A user/team reported an issue — investigate and resolve
  - "Find automation opportunities"
    → Identify manual processes that could be automated
  - "Generate an ops report"
    → Create a recurring metrics or health report
```

---

## Sub-skill: Investigate an Issue

Use this when something seems wrong and you need to figure out what happened.

### Step 1: Understand the Issue

Ask open-ended: "Describe the issue in one sentence. Include any IDs you have (subscription ID, site ID, account ID, feature name)."

### Step 2: Identify Investigation Type

Use AskUserQuestion:

```
Question: "What type of issue is this?"
Options:
  - "Subscription problem"
    → Wrong status, missing subscription, unexpected cancellation
  - "Feature/quota issue"
    → Feature not working, wrong limits, quota mismatch
  - "Billing discrepancy"
    → Wrong charges, double billing, transfer issues
  - "Data anomaly"
    → Unexpected patterns in metrics or reports
  - "Not sure"
    → Help me figure out where to look
```

### Step 3: Run Investigation

**For Subscription Problems:**
1. Use `investigate-subscription-features` with the subscription ID or site ID
2. Check subscription status, billing reference, product mapping
3. If transfer-related, use `investigate-transfer-billing`
4. Check audit events for status change history

**For Feature/Quota Issues:**
1. Use `investigate-feature-quota` with feature name + site/account ID
2. Compare expected quota (from product) vs actual (from feature manager)
3. Check quota counters (V1 and V2) for usage accuracy
4. Look for discrepancies between subscription entitlements and live instances

**For Billing Discrepancies:**
1. Use `get-subscription` to find billing reference
2. Use `get-billing-service` to check billing service status
3. Cross-reference with `get-subscription-audit-events`
4. For transfers: use `investigate-transfer-billing` with old/new account IDs

**For Data Anomalies:**
1. Start with Trino queries to isolate the pattern
2. Cross-reference with Premium Platform data
3. Check if recent product/feature changes explain the anomaly

### Step 4: Present Findings

```markdown
## Investigation: [Issue Title]

**Date:** [date]
**Reported by:** [who]
**IDs:** subscription: [id], site: [id], account: [id]

---

### What Was Reported
[1-2 sentence description of the symptom]

### What I Found
[Evidence-based findings with tool references]

**Subscription Status:** [status from tool]
**Feature State:** [state from tool]
**Billing State:** [state from tool]

### Root Cause
[What actually happened, with evidence]

### Resolution
- [ ] [Action item 1]
- [ ] [Action item 2]

### Prevention
[How to prevent this from recurring]
```

### Step 5: Approval Gate

Use AskUserQuestion:

```
Question: "How do these findings look?"
Options:
  - "Makes sense, let's resolve"
    → Proceed to resolution steps
  - "Dig deeper"
    → What else should I check?
  - "Create a Jira ticket"
    → Document this for tracking
  - "Turn this into a runbook"
    → Route to runbook sub-skill
```

---

## Sub-skill: Create a Runbook

Runbooks are step-by-step guides for handling recurring operational scenarios.

### Step 1: Identify the Scenario

Use AskUserQuestion:

```
Question: "What scenario does this runbook cover?"
Options:
  - "User-reported issue"
    → Standard investigation flow for a type of user complaint
  - "Recurring process"
    → Something the team does regularly (weekly, monthly)
  - "Incident response"
    → How to handle a specific type of system issue
  - "Onboarding procedure"
    → Steps for a new team member or new process
  - "Other"
    → I'll describe it
```

### Step 2: Gather Context

Ask open-ended: "Describe the scenario this runbook should cover. What triggers it? Who handles it? What's the typical resolution?"

### Step 3: Generate Runbook

```markdown
## Runbook: [Scenario Title]

**Owner:** [team/person]
**Last updated:** [date]
**Frequency:** [how often this happens]

---

### When to Use This Runbook
[1-2 sentences describing the trigger]

### Prerequisites
- [ ] Access to [tool/system]
- [ ] Permissions for [action]

---

### Steps

#### Step 1: [Action]
**What:** [description]
**How:**
1. [specific instruction]
2. [specific instruction]
**Tool:** [which MCP tool or system]
**Expected result:** [what you should see]

#### Step 2: [Action]
...

---

### Decision Points

| Condition | Action |
|-----------|--------|
| If [condition A] | Do [action A] |
| If [condition B] | Do [action B] |
| If neither | Escalate to [person/team] |

---

### Common Pitfalls
- [Pitfall 1 and how to avoid]
- [Pitfall 2 and how to avoid]

### Escalation Path
1. First: [person/team]
2. Then: [person/team]
3. Critical: [person/team]

---

### Related Runbooks
- [Link to related runbook]
```

### Step 4: Approval Gate

Use AskUserQuestion:

```
Question: "How does this runbook look?"
Options:
  - "Good, save it"
    → Save to session or project folder
  - "Add more detail"
    → Which step needs more detail?
  - "Test it"
    → Walk through with a real scenario
  - "Adjust scope"
    → What should change?
```

---

## Sub-skill: Build Operational Queries

Create Trino queries for monitoring, health checks, and anomaly detection.

### Step 1: Query Purpose

Use AskUserQuestion:

```
Question: "What type of operational query do you need?"
Options:
  - "Health check"
    → Verify system/data is in expected state
  - "Anomaly detection"
    → Find unexpected patterns or outliers
  - "Volume monitoring"
    → Track counts, trends, growth rates
  - "SLA tracking"
    → Measure operational performance
  - "Ad-hoc investigation"
    → One-time query for a specific question
```

### Step 2: Define Parameters

Use AskUserQuestion:

```
Question: "Which domain?"
Options:
  - "Subscriptions"
    → Plans, upgrades, cancellations, renewals
  - "Features/Quotas"
    → Feature entitlements, quota usage
  - "Billing/Payments"
    → Charges, refunds, payment failures
  - "Cross-domain"
    → Spans multiple areas
```

### Step 3: Build and Validate

1. Write the query using Trino MCP
2. Run with a small sample first (`LIMIT 10`)
3. Validate results make sense
4. Add operational context (thresholds, expected ranges)

### Step 4: Document the Query

```markdown
## Ops Query: [Name]

**Purpose:** [what this monitors]
**Frequency:** [how often to run — daily, weekly, on-demand]
**Owner:** [who owns this]
**Alert threshold:** [when to act]

### Query
```sql
-- [Name]: [Purpose]
-- Run frequency: [frequency]
-- Expected range: [what normal looks like]

[SQL query here]
```

### How to Read Results
- **Normal:** [what good looks like]
- **Warning:** [what triggers attention]
- **Critical:** [what requires immediate action]

### Next Steps When Anomaly Found
1. [Action 1]
2. [Action 2]
```

---

## Sub-skill: Handle an Escalation

For user-reported or team-reported issues that need investigation and resolution.

### Step 1: Gather Escalation Info

Ask: "Paste the escalation details — Jira ticket, Slack message, or describe the issue. Include any IDs (subscription, site, account, user)."

### Step 2: Triage

Use AskUserQuestion:

```
Question: "What's the severity?"
Options:
  - "Critical"
    → User impacted NOW, revenue/billing affected
  - "High"
    → User impacted, workaround possible
  - "Medium"
    → Inconvenience, not blocking
  - "Low"
    → Question or minor discrepancy
```

### Step 3: Investigate

Follow the "Investigate an Issue" sub-skill, then add escalation-specific outputs:

```markdown
## Escalation Response: [Title]

**Escalation source:** [Jira/Slack/email]
**Severity:** [Critical/High/Medium/Low]
**Reported:** [date]
**Resolved:** [date or "Open"]

### Issue Summary
[What was reported]

### Investigation
[What we found — with evidence from tools]

### Resolution
[What was done to fix it]

### Root Cause
[Why this happened]

### Follow-up
- [ ] [Preventive action]
- [ ] [Monitoring to add]
- [ ] [Runbook to create]
```

### Step 4: Close Loop

Use AskUserQuestion:

```
Question: "What should we do with this escalation?"
Options:
  - "Respond to reporter"
    → Draft a response for the escalation source
  - "Create Jira ticket"
    → Track follow-up actions
  - "Create runbook"
    → Document for next time → route to runbook sub-skill
  - "Add monitoring"
    → Create a query to detect this → route to queries sub-skill
  - "Done"
    → Close this investigation
```

---

## Sub-skill: Find Automation Opportunities

Identify manual processes that could be automated.

### Step 1: Identify the Process

Ask open-ended: "Describe the manual process. How often does it happen? How long does it take? Who does it?"

### Step 2: Assess Automation Value

```markdown
## Automation Opportunity: [Process Name]

**Current state:** Manual
**Frequency:** [how often]
**Time per occurrence:** [estimate]
**Monthly time cost:** [frequency × time]
**Who does it:** [role/person]

---

### Current Manual Steps
1. [Step 1]
2. [Step 2]
3. ...

### Automation Assessment

| Factor | Score (1-5) | Notes |
|--------|-------------|-------|
| **Frequency** | [score] | [how often] |
| **Time saved** | [score] | [per occurrence] |
| **Error prone** | [score] | [how often mistakes happen] |
| **Complexity to automate** | [score] | [how hard to build] |
| **Data availability** | [score] | [can tools access needed data?] |

**Automation score:** [sum] / 25

### Recommendation

| Score | Recommendation |
|-------|---------------|
| 20-25 | Automate immediately |
| 15-19 | Strong candidate, plan it |
| 10-14 | Consider if resources allow |
| 5-9 | Keep manual for now |

### Proposed Automation
[How it could be automated — tools, scripts, workflows]

### Prerequisites
- [What needs to exist first]
```

---

## Sub-skill: Generate an Ops Report

Create recurring operational metrics and reports.

### Step 1: Report Scope

Use AskUserQuestion:

```
Question: "What type of report?"
Options:
  - "Weekly ops summary"
    → Key metrics, issues, trends from the past week
  - "Monthly health report"
    → Comprehensive operational health assessment
  - "Incident report"
    → Post-mortem for a specific incident
  - "Custom report"
    → I'll describe what I need
```

### Step 2: Define Metrics

Use AskUserQuestion:

```
Question: "Which areas should the report cover?"
Options (multiSelect: true):
  - "Subscription health"
    → Active, cancelled, churn, renewals
  - "Feature/quota usage"
    → Adoption, depletion, limits hit
  - "Billing metrics"
    → Revenue, failures, refunds
  - "Escalation volume"
    → Issues reported, resolution time
  - "System health"
    → Errors, latency, availability
```

### Step 3: Build Report

1. Write Trino queries for each metric
2. Run queries and collect data
3. Add context and trends
4. Highlight anomalies and action items

### Step 4: Report Template

```markdown
## Ops Report: [Period]

**Generated:** [date]
**Period:** [start] to [end]
**Author:** [name] + AI assist

---

### Executive Summary
[3-5 bullet key takeaways]

---

### Metrics Dashboard

#### Subscriptions
| Metric | This Period | Previous | Change |
|--------|------------|----------|--------|
| Active subscriptions | [n] | [n] | [+/-] |
| New subscriptions | [n] | [n] | [+/-] |
| Cancellations | [n] | [n] | [+/-] |
| Churn rate | [%] | [%] | [+/-] |

#### Features & Quotas
| Metric | This Period | Previous | Change |
|--------|------------|----------|--------|
| Quota limits hit | [n] | [n] | [+/-] |
| Feature adoption | [%] | [%] | [+/-] |

#### Billing
| Metric | This Period | Previous | Change |
|--------|------------|----------|--------|
| Payment failures | [n] | [n] | [+/-] |
| Refunds issued | [n] | [n] | [+/-] |

---

### Anomalies & Issues
| Issue | Severity | Status | Action |
|-------|----------|--------|--------|
| [issue] | [sev] | [status] | [action] |

---

### Action Items
- [ ] [Action 1] — Owner: [name]
- [ ] [Action 2] — Owner: [name]

---

### Queries Used
[Link to saved queries or embed SQL]
```

---

## Tool Reference

| Task | Primary Tool | Fallback |
|------|-------------|----------|
| Subscription status | Premium Platform MCP: `get-subscription` | Trino: subscription tables |
| Feature entitlements | Premium Platform MCP: `investigate-subscription-features` | `get-feature-instance` |
| Quota usage | Premium Platform MCP: `investigate-feature-quota` | `get-quota` / `get-quota-counter` |
| Product config | Premium Platform MCP: `investigate-product-configuration` | `get-product` |
| Transfer issues | Premium Platform MCP: `investigate-transfer-billing` | Manual: old + new account comparison |
| Billing status | Premium Platform MCP: `get-billing-service` | Audit events |
| Data trends | Trino MCP: `execute_trino_sql_query` | — |
| Ticket tracking | Jira MCP: `get-issues`, `create-issue` | — |
| Code investigation | Octocode MCP | Local search (if repo cloned) |

### Premium Platform MCP - Quick Patterns

**Check a subscription:**
```
get-subscription → subscriptionId: [uuid]
```

**Check all subscriptions for a site:**
```
get-subscription → metaSiteId: [uuid]
```

**Full feature investigation:**
```
investigate-subscription-features → metaSiteId: [uuid]
```

**Quota deep-dive:**
```
investigate-feature-quota → featureUniqueName: [name], metaSiteId: [uuid]
```

**Transfer investigation:**
```
investigate-transfer-billing → metaSiteId: [uuid], oldAccountId: [uuid], newAccountId: [uuid]
```

---

## Verification Checklist

Before finalizing any ops work:

```
Verification Checklist:
- [ ] All data comes from tools (Premium Platform MCP, Trino, Jira) — nothing imagined
- [ ] IDs and statuses are from live queries, not assumptions
- [ ] Root cause is supported by evidence
- [ ] Resolution steps are actionable
- [ ] Prevention/follow-up items are documented
- [ ] User confirmed findings are useful
```

---

## Red Flags — STOP and Verify

| Red Flag | Action |
|----------|--------|
| About to state a subscription status without checking | STOP → Use Premium Platform MCP |
| About to quote a metric without querying Trino | STOP → Run the query |
| About to describe a flow you haven't verified | STOP → Check with octocode or architecture docs |
| Found conflicting data between tools | STOP → Present both, investigate the discrepancy |
| Escalation involves billing/payment changes | STOP → Extra caution, verify before any action |

---

## Connecting to Other Skills

After completing ops work, use AskUserQuestion:

```
Question: "What would you like to do next?"
Options:
  - "Research our systems"
    → Route to premium-research
  - "Create deliverables"
    → Route to product-hub (user stories, estimations)
  - "Research competitors"
    → Route to competitor-research
  - "More ops work"
    → Stay in this skill
  - "Save and exit"
    → Save session, end
```

---

## Session Management

All ops work should be saved for future reference:

**Save Session:**
- Location: `../sessions/YYYY-MM-DD-ops-<topic>/`
- Contents: README.md with findings, queries.sql if data work, runbook.md if runbook created
- Update: `../sessions/INDEX.md`

---

## Quick Reference

| Say | Goes to |
|-----|---------|
| "Investigate subscription X" | → Investigate sub-skill |
| "Why is feature Y not working?" | → Investigate (feature/quota) |
| "Create a runbook for X" | → Runbook sub-skill |
| "Build a health check query" | → Operational queries |
| "User reported X" | → Escalation sub-skill |
| "We keep doing X manually" | → Automation opportunities |
| "Weekly ops report" | → Ops reporting |
