---
name: competitor-research
description: |
  Live online research for competitor analysis. ALWAYS fetches current data.
  Use when PM wants to: compare competitors, check pricing, analyze features,
  understand competitor flows, or create competitive intelligence.

  Triggers: "competitor", "compare", "what does X charge", "pricing",
  "how does X work", "vs", "alternative", "SWOT", "competitive"
---

# Competitor Research Skill

Live online research for competitive intelligence. Every claim must have a source.

---

## The Iron Law

```
NEVER USE CACHED KNOWLEDGE FOR COMPETITOR DATA.
ALWAYS FETCH LIVE. EVERY CLAIM NEEDS: URL + DATE.

If you can't fetch it, say so. Don't guess.
```

---

## Step 0: Check Past Research

Check `../sessions/` for existing competitor research:

```
I found past research on [competitor]:
- [date]: [topic] (may be outdated)

Do you want to:
1. Update that research with fresh data
2. Start new research
```

**Important:** Past research is context only. Always re-fetch for current data.

---

## Step 1: Who Are We Researching?

Use AskUserQuestion:

```
Question: "Which competitor(s) do you want to research?"
Options:
  - "Billing platforms"
    → Stripe, Recurly, Chargebee
  - "Website builders"
    → Squarespace, Webflow, WordPress.com
  - "AI builders"
    → Base44, Loveable, Bolt, V0 by Vercel
  - "Other"
    → Let me specify
```

If "Other", ask: "Which competitor? Provide name and website if known."

---

## Step 2: What Aspect?

Use AskUserQuestion:

```
Question: "What aspect do you want to analyze?"
Options:
  - "Pricing & Packaging"
    → Plans, tiers, pricing models, discounts
  - "Features"
    → Feature comparison matrix
  - "Flows"
    → Onboarding, upgrade, cancellation UX
  - "API & Developer Experience"
    → Documentation, SDKs, webhooks
  - "Full SWOT"
    → Comprehensive strengths/weaknesses/opportunities/threats
```

---

## Step 3: Live Research Protocol

**MANDATORY: Fetch before generating anything.**

### Research Workflow

1. **Announce:** "Fetching [competitor]'s [aspect] from their website..."

2. **Fetch Primary Sources:**
   ```
   PRIMARY (Must fetch):
   □ Pricing page: [competitor].com/pricing
   □ Product/features page: [competitor].com/features
   □ Documentation (if API): docs.[competitor].com

   SECONDARY (If available):
   □ Blog/changelog for recent updates
   □ Help center for details
   ```

3. **Use WebFetch tool** for each source

4. **Extract and cite:**
   - Every fact needs: `Source: [URL] (fetched [today's date])`

### Research by Competitor Type

| Competitor Type | Key Pages to Fetch |
|-----------------|-------------------|
| **Stripe/Recurly** (Billing) | /pricing, /docs, /changelog |
| **Squarespace/Webflow** (Builders) | /pricing, /features, /templates |
| **Base44/Loveable/Bolt** (AI) | /pricing, /features, /docs |
| **GoDaddy** (Domains) | /pricing, domain search page |

---

## Step 4: Present Findings with Gates

Present in sections, get approval after each:

### Section 1: Executive Summary
```
Here's what I found about [Competitor]'s [aspect]:

[2-3 key takeaways]

Sources checked:
- [URL 1] (fetched [date])
- [URL 2] (fetched [date])

Does this capture the key points? [Yes / No, let me clarify / Add more]
```

### Section 2: Detailed Comparison
```
## [Aspect] Comparison

| Aspect | [Competitor] | Wix Premium | Advantage |
|--------|--------------|-------------|-----------|
| ... | ... (Source: URL) | ... | 🟢/🔴/🟡 |

Does this comparison look accurate? [Yes / No, adjust / Add rows]
```

### Section 3: Recommendations
```
## Strategic Recommendations

Based on this research:
1. [Recommendation 1] — Because [finding]
2. [Recommendation 2] — Because [finding]

Do these recommendations make sense? [Yes / No, revise / Add more]
```

---

## Step 5: Verification Checklist

**Before finalizing, verify:**

```
Verification Checklist:
- [ ] All pricing data fetched live (not from memory)
- [ ] Every claim has URL + fetch date
- [ ] Comparison table reviewed by PM
- [ ] Recommendations approved
- [ ] No speculation marked as fact
```

Use AskUserQuestion:
```
Question: "Ready to finalize this analysis?"
Options:
  - "Yes, save it"
    → Save to sessions/
  - "No, revise a section"
    → Which section needs changes?
  - "No, research more"
    → What else should I look up?
```

---

## Output Template

```markdown
## [Competitor] vs Wix Premium Analysis

**Research Date:** [date]
**Analyst:** [PM name] + AI assist
**Focus:** [pricing/features/flows/api/swot]

---

### Research Sources

| Source Type | URL | Fetched |
|-------------|-----|---------|
| Pricing Page | [link] | [date] |
| Features | [link] | [date] |
| Documentation | [link] | [date] |

---

### Executive Summary

[2-3 sentences on key findings]

---

### Comparison

| Aspect | [Competitor] | Wix Premium | Advantage |
|--------|--------------|-------------|-----------|
| [row] | [data] (Source: URL) | [data] | 🟢/🔴/🟡 |

---

### Key Findings

1. **[Finding 1]:** [detail] — Source: [URL]
2. **[Finding 2]:** [detail] — Source: [URL]
3. **[Finding 3]:** [detail] — Source: [URL]

---

### Recent Changes (Last 6 Months)

- [Any pricing/feature changes discovered from changelog/blog]

---

### Recommendations

- [ ] [Action item 1]
- [ ] [Action item 2]
- [ ] [Action item 3]

---

### Verification

- [x] All data fetched live on [date]
- [x] PM approved findings
- [x] Sources documented
```

---

## Common Competitor Research Patterns

### Pricing Comparison
1. Fetch pricing pages for all competitors
2. Extract: tiers, prices, billing cycles, limits
3. Build comparison matrix
4. Identify: where we're cheaper, where we're expensive, unique value

### Feature Gap Analysis
1. Fetch feature pages
2. List all features by category
3. Mark: ✅ We have / ❌ We don't / 🟡 Partial
4. Prioritize gaps by customer impact

### Flow Teardown
1. Describe the flow to analyze (signup, upgrade, cancel)
2. Search for UX reviews, screenshots, teardowns
3. Document step-by-step
4. Compare friction points

---

## Red Flags - STOP

| Red Flag | Action |
|----------|--------|
| About to state pricing without URL | STOP → Fetch the pricing page first |
| Using phrases like "typically" or "usually" | STOP → Get specific data |
| Competitor page won't load | STOP → Note as "Unable to verify" |
| Data seems outdated | STOP → Check for changelog/blog updates |
| PM questions a finding | STOP → Re-fetch and verify |

---

## Connecting to Other Skills

After completing research:

```
Question: "What would you like to do next?"
Options:
  - "Research our implementation"
    → Route to premium-research
  - "Create user stories based on this"
    → Route to product-hub
  - "Save and exit"
    → Save session, end
```
