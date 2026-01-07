# Verticals Layer Architecture (Business Unit)

> **Note:** This architecture reflects early 2026 state. The Business Unit owns user-facing purchase experiences.

## Platform Integration Status

Different verticals have different levels of integration with the premium-platform:

| Vertical | Platform Integration | Management | Notes |
|----------|---------------------|------------|-------|
| **New verticals** | ✅ Fully on platform | Platform | Purchase, delivery, management all through premium-platform |
| **Plans** | ✅ Platform → SBS | Platform | Goes through platform layer to SBS |
| **Mailbox/GWS** | ⚠️ Partial | Mixed | Purchase on platform, management in `premium-google-mailboxes`. Goal: migrate to platform. Google add-ons (Voice, Gemini) = fully on platform |
| **Domains** | ❌ Mostly not on platform | Own system | Directly on SBS with own management |
| **Other verticals** | ✅ Fully on platform | Platform | google-ads, email marketing, wixel, etc. |

**Legend:** ✅ Fully integrated | ⚠️ Partial | ❌ Not on platform

---

## Overview

The Verticals layer is the top of the Premium pyramid - user-facing products and purchase flows.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BUSINESS UNIT (Verticals)                           │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │      PLANS      │  │     DOMAINS     │  │  GOOGLE         │            │
│  │                 │  │                 │  │  WORKSPACE      │            │
│  │  Premium Plans  │  │  Domain Search  │  │                 │            │
│  │  Package Picker │  │  Registration   │  │  Business Email │            │
│  │  Studio/Wixel   │  │  DNS/Transfer   │  │  Google Add-ons │            │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘            │
│           │                    │                    │                      │
│           └────────────────────┼────────────────────┘                      │
│                                │                                           │
│                                ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Shared Components                                 │  │
│  │  PMD (Premium Marketing Data) | P3 Components | Checkout Flows     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │   PLATFORM LAYER      │
                    │  premium-store        │
                    │  subscription-manager │
                    │  feature-manager      │
                    └───────────────────────┘
```

## Teams & Ownership

| Team | Vertical | Responsibility |
|------|----------|----------------|
| **Plans** | Premium Plans | Main vertical, package pickers, purchase flows, subscription management |
| **Domains** | Domains | Domain search, registration, DNS, transfers, domain management |
| **Google Workspace** | GWS | Business email, Google add-ons (Voice, Gemini), mailbox management |

---

## Plans Vertical

**Platform Integration:** ✅ **Fully on platform** - Goes through platform layer to SBS.

**Main Repos:**
- `wix-private/premium-purchase-plan` - Main Plans funnel (Sunrise = modern offering)
- `wix-private/premium-package-pickers` - New package pickers (Studio = advanced offering for partners, Wixel)
- `wix-private/premium-marketing-data` - PMD (marketing configuration)

**Deep dive:** See [plans-architecture.md](./plans-architecture.md)

**Naming:** "Sunrise" = modern plans offering. "Studio" = advanced offering with better editor, usually for partners.

### Key Packages (premium-purchase-plan)

| Package | Purpose |
|---------|---------|
| `premium-purchase-plan` | Main fullstack app |
| `package-picker-sunrise` | Main package picker |
| `package-picker-autonomous` | Legacy P3 (deprecated) |
| `package-picker-common` | Shared picker logic |
| `package-picker-components` | UI components |
| `premium-express-checkout` | Express checkout flow |

### Key Packages (premium-package-pickers)

| Package | Purpose |
|---------|---------|
| `package-picker-studio` | Studio editor package picker |
| `package-picker-studio-mobile` | Studio mobile |
| `package-picker-wixel` | Wixel package picker |
| `package-picker-wixel-mobile` | Wixel mobile |
| `package-picker-sdk` | Shared SDK |
| `package-picker-shared` | Shared utilities |

---

## Domains Vertical

**Platform Integration:** ❌ **Mostly not on platform** - Directly on SBS with own management system.

**Main Repos:**
- Backend: `wix-private/premium` → `domains/` (20+ services)
- Frontend: `wix-private/premium-domains`, `wix-private/my-domains`, `wix-private/connect-domain`

**Deep dive:** See [domains-architecture.md](./domains-architecture.md)

### Key Backend Services

| Service | Purpose |
|---------|---------|
| `domain-store` | Main purchase/pricing service |
| `domain-search` | Domain availability search |
| `domain-registrar` | Registrar integration |
| `domain-delivery` | Domain provisioning |
| `domain-dns` | DNS management |
| `domain-transfer-in/out` | Transfer flows |
| `my-domains` | User domains service |

### Key Frontend Packages

| Package | Purpose |
|---------|---------|
| `domains-funnel` | Main domain purchase funnel |
| `domains-purchase-app` | Purchase application |
| `domains-search-suite` | Domain search UI |
| `domains-upgrade` | Domain upgrade flows |

---

## Google Workspace Vertical

**Platform Integration:** ⚠️ **Partial** - Purchase on platform, management still in legacy system. Goal is full migration.

**Main Repos:**
- Backend: `wix-private/premium` → `premium-server/premium-google-mailboxes-modules/`, `google-subscriptions/`
- Frontend: `wix-private/premium-mailboxes`

**Deep dive:** See [gws-architecture.md](./gws-architecture.md)

### Key Backend Services

| Service | Purpose | Platform Status |
|---------|---------|-----------------|
| `premium-google-mailboxes` | Legacy mailbox service (main traffic) | ❌ Not on platform (goal: migrate) |
| `google-subscriptions` | New service with platform integration | ✅ On platform |

**Google Add-ons:** Voice, Gemini = ✅ Fully on platform

### Key Frontend Packages

| Package | Purpose |
|---------|---------|
| `package-picker-business-email` | Business email purchase |
| `package-picker-google-voice` | Google Voice purchase |
| `package-picker-google-gemini` | Google Gemini purchase |
| `my-mailboxes-site-level` | Site mailbox management |
| `my-mailboxes-account-level` | Account mailbox management |
| `setup-users` | User setup flow |
| `add-seats` / `reduce-seats` | Seat management |

---

## Shared Components

### PMD (Premium Marketing Data)
**Repo:** `wix-private/premium-marketing-data`

Marketing configuration database (bad practice, but works):
- Feature flags
- A/B test configurations
- Marketing content
- UI configurations

### P3 Components (Recommended for New Purchase Flows)
See [platform-architecture.md](./platform-architecture.md#p3---premium-purchase-platform)

**Repo:** `wix-private/premium-purchase-platform`

Smart React components for purchase flows. **Use P3 for any new purchase flow** - it auto-fetches data from premium-store and handles complexity.

Key components: `PackagePicker`, `OfferingCard`, `CheckoutButton`, `UpgradeFlow`

---

## Verticals → Platform Integration

All verticals call Platform layer for:

| Need | Platform Service | API |
|------|------------------|-----|
| Offerings | premium-store | `GetUserOffering` |
| Checkout | premium-store → order-session | `CreateOrderPage` |
| Personalization | Dealer (via premium-store) | `listOffers` |
| Subscriptions | subscription-manager | Cancel, AutoRenew, Assign |
| Features | feature-manager | `IsEligible`, `ReportQuotaUsage` |

---

## Common Flow: Purchase in Any Vertical

```
User in Dashboard
    │
    ▼
Vertical Funnel (Plans/Domains/GWS)
    │
    ├─► PMD (marketing config)
    │
    ▼
premium-store.GetUserOffering()
    │
    ├─► Dealer (personalization)
    ├─► Product Catalog
    └─► Feature Catalog
    │
    ▼
Package Picker (P3 or vertical-specific)
    │
    ▼
premium-store.CreateOrderPage()
    │
    ▼
order-session-service.CreateOrderSession()
    │
    ▼
Checkout (checkout-view, premium-purchase)
    │
    ▼
Payment → Subscription → Features
```

---

## Key Contacts by Vertical

> **Note:** Update with actual team ownership

| Vertical | Team | Slack |
|----------|------|-------|
| Plans | Plans Team | #plans-team |
| Domains | Domains Team | #domains-team |
| Google Workspace | GWS Team | #gws-team |
