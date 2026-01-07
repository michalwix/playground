# Plans Vertical Architecture

> **Main Repos:**
> - `wix-private/premium-purchase-plan` - Main Plans funnel
> - `wix-private/premium-package-pickers` - New package pickers (Studio, Wixel)
> - `wix-private/premium-marketing-data` - PMD configuration
>
> **Note:** This architecture reflects early 2026 state.

## Overview

The Plans vertical handles Premium Plan purchases - the main monetization vertical for Wix.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PLANS VERTICAL                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Package Pickers                                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │   Sunrise   │  │   Studio    │  │   Wixel     │  │  Express  │  │   │
│  │  │   (main)    │  │   (new)     │  │   (new)     │  │  Checkout │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Data Sources                                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │   │
│  │  │  premium-store  │  │     Dealer      │  │        PMD          │ │   │
│  │  │ (getUserOffering)│  │  (listOffers)   │  │  (marketing data)   │ │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## premium-purchase-plan

**Repo:** `wix-private/premium-purchase-plan`

Main fullstack application for selling premium plans.

### Packages

| Package | Purpose |
|---------|---------|
| `premium-purchase-plan` | Main fullstack app |
| `package-picker-sunrise` | Main package picker (primary flow) |
| `package-picker-autonomous` | Legacy P3 picker (deprecated) |
| `package-picker-common` | Shared picker logic |
| `package-picker-components` | UI components library |
| `premium-express-checkout` | Express checkout flow |
| `premium-express-checkout-bm` | Express checkout BM |
| `premium-intent-serverless-proto` | Intent proto definitions |
| `premium-purchase-plan-data-stores` | Data store layer |
| `premium-purchase-plan-translations` | i18n translations |

### Key Files & Directories

```
premium-purchase-plan/
├── packages/
│   ├── premium-purchase-plan/
│   │   ├── src/
│   │   │   ├── server/
│   │   │   │   ├── core/
│   │   │   │   │   └── getOffering/       ← Calls premium-store
│   │   │   │   ├── renderers/
│   │   │   │   │   └── DynamicOfferingRenderer/
│   │   │   │   └── utils/
│   │   │   └── client/
│   │   └── index-dev.ts
│   ├── package-picker-sunrise/
│   └── package-picker-components/
└── package.json
```

### Calls To (Backend Services)

| Service | File Location | Protocol | Purpose |
|---------|---------------|----------|---------|
| **premium-store** | `src/server/core/getOffering/index.ts` | Ambassador gRPC | Get offerings |
| **Dealer** | Via premium-store | gRPC | Personalization |
| **PMD** | Various | HTTP | Marketing config |

**Key Code Pattern:**
```typescript
// src/server/core/getOffering/index.ts
import { GetUserOfferingResponse } from '@wix/ambassador-premium-store/types';
import { PremiumStore } from '@wix/ambassador-premium-store/rpc';

async function getUserOffering({
  aspects,
  siteGuid,
  packagePickerType,
  // ...
}) {
  // Calls premium-store GetUserOffering
}
```

**Ambassador Imports:**
```typescript
import { GetUserOfferingResponse } from '@wix/ambassador-premium-store/types';
import { PremiumStore } from '@wix/ambassador-premium-store/rpc';
import { MetaSiteSearchWeb } from '@wix/ambassador-meta-site-search-web/rpc';
```

---

## premium-package-pickers

**Repo:** `wix-private/premium-package-pickers`

New package pickers for specific editor experiences.

### Packages

| Package | Purpose |
|---------|---------|
| `package-picker-studio` | Studio editor package picker |
| `package-picker-studio-mobile` | Studio mobile version |
| `package-picker-wixel` | Wixel package picker |
| `package-picker-wixel-mobile` | Wixel mobile version |
| `package-picker-sdk` | Shared SDK for all pickers |
| `package-picker-shared` | Shared utilities |
| `package-picker-shared-studio` | Studio-specific shared |
| `package-picker-shared-wixel` | Wixel-specific shared |

### Directory Structure

```
premium-package-pickers/
├── docs/                    ← Documentation
├── packages/
│   ├── package-picker-sdk/          ← Shared SDK
│   ├── package-picker-shared/       ← Common utilities
│   ├── package-picker-studio/       ← Studio picker
│   ├── package-picker-studio-mobile/
│   ├── package-picker-wixel/        ← Wixel picker
│   └── package-picker-wixel-mobile/
└── serverless/              ← Serverless backend
```

### Studio vs Wixel

| Aspect | Studio | Wixel |
|--------|--------|-------|
| Editor | Wix Studio (advanced) | Wixel (AI-powered) |
| Target | Agencies, developers | AI-assisted users |
| Plans | Studio-specific tiers | Wixel-specific tiers |

---

## PMD (Premium Marketing Data)

**Repo:** `wix-private/premium-marketing-data`

"Database" for marketing features and configurations.

### What It Contains
- Feature flags
- A/B test configurations
- Marketing content (banners, messages)
- UI configurations per plan/vertical
- Sale configurations

### Structure

```
premium-marketing-data/
├── packages/
│   └── premium-marketing-data/
│       └── src/
│           ├── data/           ← Configuration data
│           └── types/          ← TypeScript types
└── package.json
```

### Usage Pattern
Plans components fetch PMD data for:
- Which features to highlight
- Pricing display configurations
- Sale/discount badges
- Experiment variants

> **Note:** PMD is considered "bad practice" but works. Future direction is to move configs to proper systems.

---

## Purchase Flows

### Sunrise (Main Flow)
```
User Dashboard
    ↓
"Upgrade" button
    ↓
package-picker-sunrise
    ├── Fetch: premium-store.GetUserOffering()
    ├── Fetch: Dealer recommendations
    └── Fetch: PMD marketing data
    ↓
Display packages
    ↓
User selects plan
    ↓
premium-store.CreateOrderPage()
    ↓
order-session-service.CreateOrderSession()
    ↓
Checkout (checkout-view, premium-purchase)
```

### Studio Flow
```
Wix Studio Editor
    ↓
"Upgrade" trigger
    ↓
package-picker-studio
    ├── Studio-specific offerings
    └── Agency/developer targeting
    ↓
Studio plan selection
    ↓
→ Standard checkout flow
```

### Express Checkout
```
Quick upgrade prompt
    ↓
premium-express-checkout
    ↓
Minimal UI, fast path
    ↓
Direct to checkout
```

---

## Caller-Callee Summary

### Plans Calls To:

| Callee | Purpose |
|--------|---------|
| premium-store | Get offerings, create order page |
| Dealer | Personalized recommendations |
| PMD | Marketing configurations |
| order-session-service | Create checkout session |
| checkout-view | Checkout data and submission |

### Plans Called By:

| Caller | Purpose |
|--------|---------|
| Wix Dashboard | Upgrade button |
| Editor banners | Upgrade prompts |
| Site management | Plan management |

---

## Exploring the Code

### Find offering integration:
```
octocode search: owner=wix-private, repo=premium-purchase-plan, keywords=["getUserOffering", "premium-store"]
```

### Find package picker components:
```
octocode view: owner=wix-private, repo=premium-purchase-plan, path=packages/package-picker-components/src
```

### Find Studio picker:
```
octocode view: owner=wix-private, repo=premium-package-pickers, path=packages/package-picker-studio/src
```

### Find PMD data:
```
octocode view: owner=wix-private, repo=premium-marketing-data, path=packages/premium-marketing-data/src
```
