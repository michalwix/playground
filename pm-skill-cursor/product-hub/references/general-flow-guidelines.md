# General Flow Guidelines

## Purpose

When a PM asks questions about a new product, feature, or monetization strategy, use this checklist to verify all critical flows are considered. Not all flows apply to every product — but each should be **explicitly addressed** (covered, scoped out, or marked as not relevant).

**Trigger this verification when PM mentions:**
- New product/feature
- Pricing changes
- New payment model
- Subscription flow changes
- "What do we need to build?"

---

## P3 Recommendation

**For any new purchase flow, use P3 (Premium Purchase Platform):**

| Component | Purpose |
|-----------|---------|
| `PackagePicker` | Display available packages |
| `OfferingCard` | Individual package card |
| `CheckoutButton` | Initiate checkout |
| `UpgradeFlow` | Complete upgrade experience |

**Repo:** `wix-private/premium-purchase-platform`

P3 components auto-fetch data from premium-store, handling the complexity of offerings, pricing, and personalization.

---

## Flow Hierarchy

Each flow is covered by the **pyramid hierarchy**:

```
┌─────────────────────────────────────────┐
│             VERTICALS                    │
│   (Plans, Domains, Mailbox, GWS, etc.)  │
└─────────────────┬───────────────────────┘
                  │
      ┌───────────┴───────────┐
      ▼                       ▼
┌─────────────┐         ┌─────────────┐
│  PLATFORM   │         │   BILLING   │
│  (modern)   │         │  (legacy)   │
└──────┬──────┘         └─────────────┘
       │
       ▼
┌─────────────┐
│   BILLING   │
│   (SBS)     │
└─────────────┘
```

**Modern flow:** Vertical → Platform → SBS (billing)
**Legacy flow (Domains):** Vertical → SBS directly

---

## Verification Checklist

### 1. PURCHASE (Initial Acquisition)

| Flow | Description | Questions to Ask |
|------|-------------|------------------|
| **Package Picker** | UI for plan selection | Which vertical? How are plans displayed? |
| **Pricing Model** | How price is determined | Flat? Metered? Per-seat? Dynamic? |
| **Pricing Catalog** | Where prices live | Catalog service? Hardcoded? External? |
| **Offering** | What's being sold | Which offerings exist? Bundles? |
| **Checkout** | Payment flow | Full checkout? Instant purchase? Sales? |
| **Sales Flow** | Manual sales path | Internal sales? Partner sales? |
| **Payment Methods** | How users pay | Cards? PayPal? Local methods? |
| **Coupons** | Discount mechanisms | Coupon templates? Gift cards? Promo codes? |
| **Free Trial** | Trial period | Length? Conversion flow? Auto-charge? |
| **Features** | What plan delivers | Feature Manager? 3rd party (domain/mailbox)? |

**Key Question:** "When a user purchases this, what happens at each layer?"

---

### 2. UPGRADE / DOWNGRADE

| Flow | Description | Questions to Ask |
|------|-------------|------------------|
| **UX Entry Point** | How users find it | Package picker? Modal? Settings? |
| **Trigger Method** | How change happens | Full checkout? One-click? API? |
| **Proration Type** | How credits calculated | Time-based? Credit-based? Money-based? |
| **Proration Timing** | When applied | Immediate? End of cycle? |
| **Feature Proration** | Feature access timing | Instant feature change? Wait for cycle? |

**Key Question:** "What happens to the user's money and features when they change plans?"

---

### 3. CHANGE CYCLE

| Flow | Description | Questions to Ask |
|------|-------------|------------------|
| **Cycle Options** | Available frequencies | Monthly? Annual? Multi-year? |
| **Change Flow** | How users change | Self-service? Support only? |
| **Timing** | When changes take effect | Immediate? At renewal? |

**Key Question:** "Can users change their billing frequency? When does it apply?"

---

### 4. LIFECYCLE MANAGEMENT

| Flow | Description | Questions to Ask |
|------|-------------|------------------|
| **Cancel** | Ending subscription | Immediate? End-of-cycle? Partial refund? |
| **Auto-renew** | Renewal control | Can toggle off? What happens? |
| **Context Assignment** | Where sub belongs | Site-level? Account-level? Transferable? |
| **Allowed Actions** | What user can do | Which actions per state? |
| **Payment Issues** | Failed payment handling | Grace period? Dunning? Pay-now? |
| **Grace Period** | Time before suspension | How long? What's accessible? |

**Key Question:** "What happens after purchase? How does the subscription evolve?"

---

### 5. ADDITIONAL FLOWS

| Flow | Description | Questions to Ask |
|------|-------------|------------------|
| **Refunds** | Money back scenarios | When allowed? Full/partial? |
| **Transfer Site** | Moving ownership | What happens to subscription? |
| **Multi-site** | Multiple sites per account | Shared subscription? Per-site? |
| **Renewal** | Automatic charging | Same price? Price increases? |

**Key Question:** "What edge cases exist after the main flow?"

---

## How to Use This Checklist

### Step 1: Identify Scope
When PM describes a new product/feature, ask:
```
Let me verify we're covering all necessary flows.

For [Product/Feature], which of these apply?
- Initial purchase flow
- Upgrade/downgrade capability
- Billing cycle changes
- Lifecycle management (cancel, suspend, etc.)
- Special cases (refunds, transfers, etc.)
```

### Step 2: Walk Through Relevant Flows
For each applicable area, verify:
```
For the PURCHASE flow:
- [ ] Package picker UX defined?
- [ ] Pricing model determined?
- [ ] Checkout flow specified?
- [ ] Payment methods identified?
- [ ] Feature delivery mechanism clear?

Any gaps we should address or scope out?
```

### Step 3: Document Decisions
Create explicit record:
```
## Flow Coverage for [Feature]

### Covered
- Purchase: Full checkout via plans funnel
- Upgrade: Package picker modal

### Scoped Out (v1)
- Downgrade: Manual support only for now
- Transfer: Not supported initially

### Not Applicable
- Multi-site: Single-site product
```

---

## Smart Suggestions

When researching flows, consider the **full SaaS lifecycle**:

```
ACQUIRE → ACTIVATE → MONETIZE → RETAIN → EXPAND

- Acquire: How do users find and sign up?
- Activate: First value moment? Trial conversion?
- Monetize: Initial purchase? Upsells?
- Retain: Cancellation prevention? Win-back?
- Expand: Upgrades? Add-ons? Referrals?
```

**Connect to Wix ecosystem:**
- Does this integrate with existing Wix features?
- Can we bundle with other Wix products?
- How does this fit the Wix Premium hierarchy?

---

## Reference Links

For implementation details of each flow:
- **Purchase/Checkout:** `references/billing-architecture.md`
- **Platform/Offering:** `references/platform-architecture.md`
- **Verticals:** `references/verticals-architecture.md`
- **Caller-callee:** `references/caller-callee.md`
