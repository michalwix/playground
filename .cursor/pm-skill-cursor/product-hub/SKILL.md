---
name: product-hub
description: |
  Help PMs create product deliverables faster.
  Use when PM wants to: write user stories, estimate effort, verify flows, draft specs.

  Triggers: "create", "write", "generate", "draft", "user story", "estimate",
  "stories", "spec", "new product", "new feature", "flows", "verify"

  Note: For competitor research, use the competitor-research skill instead.
---

# Product Hub Skill

Help PMs create product deliverables: user stories, estimations, and flow verification.

---

## CRITICAL: Always Ask for Reference Documents First

```
┌─────────────────────────────────────────────────────────────────────┐
│  MANDATORY FIRST STEP: Request PM's Reference Documents            │
│                                                                     │
│  Before creating ANY deliverable, you MUST ask:                     │
│                                                                     │
│  "Please share examples of user stories or product docs from       │
│   your team so I can match your style and format."                  │
│                                                                     │
│  WHY: Every team has their own style. Building in their style      │
│  ensures adoption and consistency.                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Use AskUserQuestion:**

```
Question: "Do you have reference docs I can use to match your team's style?"
Options:
  - "Yes, I'll share examples"
    → Great! Paste or share links to user stories, PRDs, or specs your team uses
  - "No, use best practices"
    → I'll use industry best practices (INVEST, Given/When/Then)
  - "Let me find some"
    → Take your time, this helps me create better output
```

**If PM shares reference docs:**
1. Analyze the format, tone, and structure
2. Note specific patterns (headings, acceptance criteria style, terminology)
3. Mirror their style exactly in generated output

---

## Step 1: What Are You Creating?

Use AskUserQuestion:

```
Question: "What do you want to create?"
Options:
  - "User Stories"
    → Write stories with acceptance criteria
  - "Estimation"
    → T-shirt size effort and identify risks
  - "Flow Verification"
    → Verify all purchase & monetization flows are covered
  - "Full Product Spec"
    → All of the above for a new feature
```

---

## Step 2: Check for Prior Context

Use AskUserQuestion:

```
Question: "Do you have prior research or context?"
Options:
  - "Yes, from premium-research"
    → I'll check for saved sessions
  - "Yes, I have docs"
    → Share your context (PRD, Figma, requirements)
  - "No, start fresh"
    → I'll help gather context first
```

If no context and the task requires understanding code/data:
→ Suggest: "Want me to route you to premium-research first to gather technical context?"

---

## Sub-skill: User Stories

### User Story Best Practices (INVEST Method)

Good user stories follow **INVEST**:

| Principle | Meaning | Check |
|-----------|---------|-------|
| **I**ndependent | Can be developed separately | Not blocked by other stories |
| **N**egotiable | Flexible, not a contract | Room for discussion |
| **V**aluable | Delivers user/business value | Clear "so that" benefit |
| **E**stimable | Can be sized | Enough detail to estimate |
| **S**mall | Fits in a sprint | Can break down if too big |
| **T**estable | Has clear acceptance criteria | Given/When/Then format |

### Acceptance Criteria Guidelines

**Format:** Use Given/When/Then (Gherkin syntax):
```
Given [precondition/context]
When [action taken]
Then [expected outcome]
```

**Best Practices:**
- Write 3-5 acceptance criteria per story (not more)
- Use plain language, avoid jargon
- Be specific and measurable
- Avoid "not" statements (unclear and hard to test)
- Each criterion should be independently testable

### Step 1: Understand Context

Ask open-ended: "What feature are you writing stories for? Give me a brief description."

Then use AskUserQuestion:

```
Question: "Who is the primary user?"
Options:
  - "Site owner (free tier)"
    → User without premium subscription
  - "Premium subscriber"
    → Basic paid user
  - "Business/eCommerce subscriber"
    → Advanced paid user
  - "Internal user"
    → Support, ops, admin
```

### Step 2: Clarify the Goal

Ask open-ended: "Complete this sentence: 'As a [user type], I want to ___ so that ___'"

### Step 3: Generate Stories

**If PM provided reference docs:** Match their exact format and style.

**If using best practices:** Use this format:

```markdown
## Epic: [Feature Name]

**Context:** [brief background]
**Primary User:** [user type]
**Goal:** [main objective]

---

### User Story 1: [Story Title]

**Story:**
As a [user type], I want [action], so that [benefit].

**Acceptance Criteria:**
1. Given [context], when [action], then [result]
2. Given [context], when [action], then [result]
3. Given [context], when [action], then [result]

**Edge Cases:**
- What if [edge case 1]?
- What if [edge case 2]?

**Technical Notes:**
- Services: [list affected services]
- Data: [tables/fields affected]
- Dependencies: [other features/stories]

**T-Shirt Size:** XS / S / M / L / XL

---
```

### Step 4: Approval Gate

After generating stories, use AskUserQuestion:

```
Question: "How do these stories look?"
Options:
  - "Good, continue"
    → Move to edge cases review
  - "Add more stories"
    → What scenarios are missing?
  - "Break a story down"
    → Which story needs splitting? (Use SPIDR: Spike, Paths, Interfaces, Data, Rules)
  - "Adjust acceptance criteria"
    → Which story needs refinement?
```

### Step 5: Edge Cases Checklist

Present edge cases checklist, use AskUserQuestion:

```
Question: "Which edge cases apply to your feature?"
Options (multiSelect: true):
  - "User state"
    → Logged out, free tier, trial, expired, multiple sites
  - "Payment"
    → Failed payment, no payment method, currency, proration
  - "Technical"
    → Slow network, concurrent actions, mobile vs desktop
  - "None of these"
    → Feature doesn't have these edge cases
```

Add applicable edge cases to the stories.

### Step 6: Verification Checklist

Before finalizing:

```
Verification Checklist - User Stories:
- [ ] Stories follow INVEST principles
- [ ] Each story has 3-5 clear acceptance criteria (Given/When/Then)
- [ ] Edge cases identified and documented
- [ ] Technical notes reference real services (from research)
- [ ] Dependencies clearly listed
- [ ] PM approved the stories
```

---

## Sub-skill: Estimation (T-Shirt Sizing)

### T-Shirt Sizing Framework

**IMPORTANT:** Estimates are in T-shirt sizes ONLY (XS, S, M, L, XL, XXL). No time estimates.

```
┌────────────────────────────────────────────────────────────────────────┐
│  T-SHIRT SIZE IS BASED ON COMPLEXITY, NOT JUST TIME                   │
│                                                                        │
│  A small UI tweak ≠ A change to SBS (core billing monolith)           │
│  Same "feature" can be XS or XL depending on WHERE it touches         │
└────────────────────────────────────────────────────────────────────────┘
```

### Complexity Factors

When sizing, consider ALL of these factors:

| Factor | Low Complexity | High Complexity |
|--------|----------------|-----------------|
| **Services** | 1 service | 3+ services, cross-team |
| **System Type** | New/isolated service | Core system (SBS, Cashier) |
| **Frontend** | Minor UI tweak | New flow/screens |
| **Data** | No schema change | Migration required |
| **Integration** | Internal only | External APIs, 3rd party |
| **Unknowns** | Well understood | Many unknowns |
| **Dependencies** | None | Blocked by other teams |

### T-Shirt Size Definitions (Premium Systems Context)

| Size | Description | Example |
|------|-------------|---------|
| **XS** | Single file change, no dependencies | Fix typo, update config, minor UI tweak |
| **S** | Single service, isolated change | Add field to API, simple UI component, single validation |
| **M** | 2-3 services, some coordination | New API endpoint with frontend, feature flag rollout |
| **L** | Multiple services, cross-team | New checkout flow, integration with Cashier, new vertical feature |
| **XL** | Core system change, significant scope | Modify SBS billing logic, new payment method, platform-wide change |
| **XXL** | Major initiative, multiple teams | New billing system integration, major migration, new product line |

### System Complexity Reference

```
┌─────────────────────────────────────────────────────────────────┐
│  SYSTEM COMPLEXITY (inherent risk multiplier)                   │
├─────────────────────────────────────────────────────────────────┤
│  🟢 LOW: New/isolated services, verticals, frontend components  │
│  🟡 MEDIUM: Platform services (premium-store, feature-manager)  │
│  🔴 HIGH: Core systems (SBS, Cashier, recurring)                │
│  ⚫ CRITICAL: Payment processing, billing calculations          │
└─────────────────────────────────────────────────────────────────┘

A "small" change to SBS is NOT the same as a "small" change to a new frontend.
Always factor in system complexity when sizing.
```

### Step 1: Understand What's Being Estimated

Use AskUserQuestion:

```
Question: "What are you estimating?"
Options:
  - "New feature"
    → Something that doesn't exist yet
  - "Enhancement"
    → Improving existing functionality
  - "Bug fix"
    → Fixing broken behavior
  - "Tech debt"
    → Refactoring, migration, cleanup
```

### Step 2: Describe the Change

Ask open-ended: "Describe the change in one sentence."

### Step 3: Check for Prior Research

Use AskUserQuestion:

```
Question: "Have you researched the codebase for this?"
Options:
  - "Yes, I know the services"
    → Great! Tell me what you found
  - "No, I need to research first"
    → Route to premium-research skill
  - "Estimate with limited info"
    → I'll note this affects confidence (size goes UP with uncertainty)
```

If no research, strongly suggest: "Using premium-research skill first helps me give better estimates. Without it, I'll size conservatively (larger)."

### Step 4: Gather Scope Information

Use AskUserQuestion (multiSelect: true):

```
Question: "What's the expected scope?"
Options:
  - "Single service change"
    → Isolated to one service
  - "Multiple services"
    → Cross-service coordination
  - "Frontend changes"
    → UI work required
  - "Data changes"
    → Schema or migration needed
```

Then use AskUserQuestion:

```
Question: "Which systems are affected?"
Options:
  - "Frontend only"
    → UI components, no backend
  - "Platform services"
    → premium-store, feature-manager, subscription-manager
  - "Billing core"
    → SBS, checkout-view, order-session
  - "Core + integrations"
    → Cashier, external APIs, payment providers
```

### Step 5: Generate Estimation

```markdown
## T-Shirt Estimation: [Feature Name]

**Date:** [date]
**Estimated by:** [PM name] + AI assist
**Type:** [new feature/enhancement/bug fix/tech debt]

---

### Scope Summary

**Description:** [one sentence]

**Services Affected:**
| Service | System Type | Change Type | Complexity |
|---------|-------------|-------------|------------|
| [service] | 🟢/🟡/🔴 | new/modify/integrate | Low/Med/High |

---

### Complexity Breakdown

| Factor | Assessment | Notes |
|--------|------------|-------|
| **Services Count** | [1/2-3/4+] | [which services] |
| **System Complexity** | 🟢/🟡/🔴 | [core system impact?] |
| **Frontend Scope** | None/Minor/Major | [screens/flows affected] |
| **Data Changes** | None/Schema/Migration | [tables affected] |
| **Integrations** | None/Internal/External | [APIs involved] |
| **Unknowns** | Low/Medium/High | [what's unclear] |
| **Dependencies** | None/Some/Blocking | [who else is needed] |

---

### T-Shirt Size: **[XS/S/M/L/XL/XXL]**

**Reasoning:**
- [Key factor 1 that drives the size]
- [Key factor 2]
- [Why not smaller/larger]

---

### Component Breakdown (if helpful)

| Component | Size | Notes |
|-----------|------|-------|
| Backend | XS/S/M/L/XL | [notes] |
| Frontend | XS/S/M/L/XL | [notes] |
| Data/Migration | XS/S/M/L/XL | [notes] |
| Testing | XS/S/M/L/XL | [notes] |

---

### Risks & Unknowns

| Risk | Impact | Mitigation |
|------|--------|------------|
| [risk 1] | High/Med/Low | [mitigation] |

**Unknowns that could increase size:**
- [ ] Unknown 1
- [ ] Unknown 2

---

### Dependencies

**Needs from other teams:**
- [dependency 1]

**Blocks other work:**
- [what this blocks]

---

### Confidence Level

🟢 **High** / 🟡 **Medium** / 🔴 **Low**

**Reason:** [why this confidence level]

---

### Recommendation

[Brief recommendation on how to proceed]
```

### Step 6: Approval Gate

Use AskUserQuestion:

```
Question: "How does this estimate look?"
Options:
  - "Looks accurate"
    → Save and finalize
  - "Missing components"
    → What else should I include?
  - "Size seems off"
    → Let's discuss the sizing factors
  - "Need more research"
    → Route to premium-research
```

### Step 7: Verification Checklist

Before finalizing:

```
Verification Checklist - Estimation:
- [ ] All affected services identified with system complexity
- [ ] T-shirt size reflects COMPLEXITY not just scope
- [ ] Core system changes appropriately sized larger
- [ ] Risks and unknowns documented
- [ ] Dependencies listed
- [ ] Confidence level reflects research depth
- [ ] PM approved the estimate
```

---

## Sub-skill: Flow Verification

**Load:** `references/general-flow-guidelines.md`

### When to Trigger

Automatically trigger flow verification when PM mentions:
- New product or feature
- Pricing/monetization changes
- "What do we need to build?"
- Subscription flow changes
- "Is this complete?"

### P3 Recommendation for Purchase Flows

**When PM asks about creating purchase flows, ALWAYS suggest P3:**

```
For purchase flows, I recommend using **P3 (Premium Purchase Platform)**.

**What is P3?**
- Smart React component system for purchase experiences
- Auto-fetches offering data from premium-store
- Pre-built components: PackagePicker, OfferingCard, CheckoutButton, UpgradeFlow

**Repo:** `wix-private/premium-purchase-platform`

**When to use P3:**
- Creating a new package picker
- Building checkout experience
- Any part of a purchase flow

This is the recommended approach for new purchase experiences.
```

### Step 1: Understand the Product/Feature

Ask open-ended: "Tell me about this product/feature:"
- What is it? (brief description)
- Who is it for? (user segment)
- How is it monetized? (subscription, one-time, usage-based, free?)

### Step 2: Identify Applicable Flows

Based on the product description, use AskUserQuestion:

```
Question: "Which flow categories apply to this product?"
Options (multiSelect: true):
  - "Purchase flows"
    → Package picker, pricing, checkout, payment, delivery
  - "Change flows"
    → Upgrade, downgrade, cycle change
  - "Lifecycle flows"
    → Cancellation, renewal, payment failures
  - "Other flows"
    → Refunds, transfers, gifting
```

### Step 3: Walk Through Each Flow

For each applicable flow category, ask detailed questions:

**PURCHASE Flows:**

Use AskUserQuestion:
```
Question: "For INITIAL PURCHASE, how does this work?"
Options:
  - "Standard checkout"
    → Full checkout flow with cart
  - "One-click purchase"
    → Simplified purchase flow
  - "Sales-assisted"
    → Enterprise/manual process
  - "Not applicable"
    → No purchase flow for this
```

Continue with:
- Pricing model (flat/metered/per-seat/trial?)
- Payment methods supported
- Feature delivery mechanism

**UPGRADE/DOWNGRADE Flows:**

Use AskUserQuestion:
```
Question: "For PLAN CHANGES, what's supported?"
Options:
  - "Both upgrade and downgrade"
    → Users can move either direction
  - "Upgrade only"
    → Users can only move up
  - "No changes in v1"
    → Lock users to their plan initially
  - "Not applicable"
    → Single tier product
```

Continue with:
- UX entry point
- Proration handling
- Feature transition timing

**LIFECYCLE Flows:**

Use AskUserQuestion:
```
Question: "For SUBSCRIPTION LIFECYCLE, what's the plan?"
Options:
  - "Standard lifecycle"
    → Cancel, renew, payment failures handled
  - "No cancellation"
    → Users can't self-cancel
  - "Custom handling"
    → Special rules for this product
  - "Not applicable"
    → One-time purchase, no lifecycle
```

Continue with:
- Cancellation type (immediate vs end of cycle)
- Grace period for payment failures
- Retention flow

### Step 4: Generate Coverage Summary

```markdown
## Flow Coverage Summary: [Product/Feature Name]

**Date:** [date]
**PM:** [name]
**Status:** Draft / Review / Final

---

### Product Overview
[1-2 sentence description]
[User segment]
[Monetization model]

---

### Flow Coverage Matrix

| Category | Flow | Status | Notes |
|----------|------|--------|-------|
| **Purchase** | Package Picker | ✅ Covered | [details] |
| | Pricing Model | ✅ Covered | [details] |
| | Checkout | ✅ Covered | [details] |
| | Payment Methods | ⚠️ Partial | [details] |
| | Features Delivery | ✅ Covered | [details] |
| **Changes** | Upgrade | ✅ Covered | [details] |
| | Downgrade | ❌ Scoped Out | v2 |
| | Cycle Change | ❌ Not Applicable | [reason] |
| **Lifecycle** | Cancel | ✅ Covered | [details] |
| | Auto-renew | ✅ Covered | [details] |
| | Payment Issues | ⚠️ TBD | Need to define grace period |
| **Other** | Refunds | ✅ Covered | [details] |
| | Transfer | ❌ Not Applicable | [reason] |

**Legend:** ✅ Covered | ⚠️ Partial/TBD | ❌ Scoped Out/N/A

---

### Open Questions
1. [Question 1]
2. [Question 2]

### Next Steps
- [ ] [Action item]
- [ ] [Action item]
```

### Step 5: Approval Gate

Use AskUserQuestion:

```
Question: "Is this flow coverage complete?"
Options:
  - "Yes, looks complete"
    → Finalize the summary
  - "Missing flows"
    → Which flows should I add?
  - "Need to change status"
    → Which flow needs updating?
  - "Add open questions"
    → What questions should I add?
```

### Step 6: Verification Checklist

Before finalizing:

```
Verification Checklist - Flow Coverage:
- [ ] All applicable flow categories reviewed
- [ ] Each flow has clear status (covered/partial/scoped out/N/A)
- [ ] Scoped out items have documented reason
- [ ] Open questions captured
- [ ] Next steps identified
- [ ] PM approved the coverage matrix
```

---

## Risk Identification Framework

### Common Risk Categories (Premium Systems)

When creating any deliverable, proactively identify risks in these categories:

| Category | Risk Examples | Questions to Ask |
|----------|---------------|------------------|
| **Technical** | Core system changes, data migrations, performance | Does this touch SBS/Cashier? Schema changes? |
| **Integration** | External APIs, payment providers, 3rd party | Who do we depend on? What if they're down? |
| **Data** | Migration failures, data loss, inconsistency | What happens to existing data? Rollback plan? |
| **User Impact** | Breaking changes, UX confusion, billing errors | What if users see wrong prices? Double charges? |
| **Compliance** | Payment regulations, tax implications, GDPR | Does this affect how we handle money/data? |
| **Dependencies** | Other teams, external deadlines, blocked work | Who else needs to deliver? What's the critical path? |
| **Rollout** | Feature flags, gradual rollout, rollback | How do we test in production? Can we undo? |

### Risk Assessment Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│  IMPACT vs LIKELIHOOD                                           │
├─────────────────────────────────────────────────────────────────┤
│                    │  Low Impact  │  Med Impact  │  High Impact │
│  High Likelihood   │  🟡 Monitor  │  🟠 Mitigate │  🔴 Block    │
│  Med Likelihood    │  🟢 Accept   │  🟡 Monitor  │  🟠 Mitigate │
│  Low Likelihood    │  🟢 Accept   │  🟢 Accept   │  🟡 Monitor  │
└─────────────────────────────────────────────────────────────────┘

🔴 Block = Must resolve before proceeding
🟠 Mitigate = Need mitigation plan
🟡 Monitor = Track, but don't block
🟢 Accept = Acknowledge and proceed
```

### Premium-Specific Risks to Always Consider

1. **Billing accuracy** - Any change affecting prices, prorations, or charges
2. **Payment failures** - What happens when payments fail mid-flow?
3. **Subscription state** - Edge cases: expired, cancelled, trial, multiple subs
4. **Multi-currency** - Does this work for all currencies/regions?
5. **Rollback** - Can we undo this if something goes wrong?

---

## Response Guidelines

### DO:
- **ALWAYS ask for reference docs first** (user stories, PRDs, specs from their team)
- Ask clarifying questions before generating
- Use AskUserQuestion for all choices
- Match the PM's team style if they provided examples
- Use INVEST for user stories, T-shirt sizing for estimates
- Include edge cases and risks proactively
- Factor in system complexity for sizing (SBS ≠ new frontend)
- Offer to refine and iterate
- **Verify before finalizing**
- Connect to codebase research when relevant

### DON'T:
- Generate without asking for reference docs
- Give estimates in time (hours/days) - use T-shirt sizes only
- Treat all systems as equal complexity
- Skip edge cases in user stories
- Forget to ask about dependencies
- Skip the verification checklist
- Finalize without PM approval

---

## Connecting to Other Skills

After completing a deliverable, use AskUserQuestion:

```
Question: "What would you like to do next?"
Options:
  - "Research our systems"
    → Route to premium-research
  - "Research competitors"
    → Route to competitor-research
  - "Create another deliverable"
    → Stay in product-hub
  - "Save and exit"
    → Save session, end
```

---

## Output Verification Summary

Every deliverable must pass verification before being finalized:

| Deliverable | Verification Requirements |
|-------------|--------------------------|
| User Stories | INVEST principles + Given/When/Then AC (3-5) + edge cases + matches team style + PM approval |
| Estimation | T-shirt size (not time!) + system complexity factored + risks documented + PM approval |
| Flow Coverage | All flows reviewed + statuses assigned + P3 suggested for purchase flows + PM approval |

### Critical Checks

```
┌─────────────────────────────────────────────────────────────────┐
│  BEFORE GENERATING ANY DELIVERABLE:                             │
│                                                                 │
│  ☐ Asked for reference docs from PM's team                     │
│  ☐ Understood the context and goals                             │
│  ☐ Identified which systems are affected                        │
│  ☐ Considered risks (especially billing/payment)                │
└─────────────────────────────────────────────────────────────────┘
```

**No deliverable is complete without PM explicitly approving it.**

---

## Quick Reference

### User Stories
- Use INVEST principles
- 3-5 acceptance criteria per story (Given/When/Then)
- Match team's style if they provided examples

### Estimation
- T-shirt sizes ONLY (XS, S, M, L, XL, XXL)
- Factor in system complexity (SBS change ≠ frontend change)
- Size UP with uncertainty

### Risks
- Always consider: billing accuracy, payment failures, rollback
- Use impact/likelihood matrix
- Core system changes = higher risk

### Systems Reference
- 🟢 LOW risk: New services, verticals, frontend
- 🟡 MEDIUM risk: Platform (premium-store, feature-manager)
- 🔴 HIGH risk: Core (SBS, Cashier, recurring)
- ⚫ CRITICAL: Payment processing, billing calculations
