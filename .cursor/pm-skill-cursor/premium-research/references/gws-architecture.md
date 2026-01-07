# Google Workspace Vertical Architecture

> **Main Repos:**
> - Backend: `wix-private/premium` → `premium-server/premium-google-mailboxes-modules/`, `google-subscriptions/`
> - Frontend: `wix-private/premium-mailboxes`
>
> **Note:** This architecture reflects early 2026 state.

## Overview

The Google Workspace (GWS) vertical handles Business Email (Google Workspace), Google Voice, Google Gemini, and related add-ons.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      GOOGLE WORKSPACE VERTICAL                               │
│                                                                             │
│  FRONTEND (premium-mailboxes)                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Package Pickers                    Management                       │   │
│  │  ┌──────────────┐ ┌─────────────┐  ┌─────────────┐ ┌─────────────┐ │   │
│  │  │Business Email│ │Google Voice │  │my-mailboxes │ │setup-users  │ │   │
│  │  │picker        │ │picker       │  │(site/acct)  │ │             │ │   │
│  │  └──────────────┘ └─────────────┘  └─────────────┘ └─────────────┘ │   │
│  │  ┌──────────────┐                  ┌─────────────┐ ┌─────────────┐ │   │
│  │  │Google Gemini │                  │add-seats    │ │reduce-seats │ │   │
│  │  │picker        │                  │             │ │             │ │   │
│  │  └──────────────┘                  └─────────────┘ └─────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                │                                            │
│  BACKEND                       │                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌────────────────────────────┐  ┌────────────────────────────┐    │   │
│  │  │ premium-google-mailboxes   │  │   google-subscriptions     │    │   │
│  │  │ (legacy, main traffic)     │  │   (new, platform-based)    │    │   │
│  │  └────────────────────────────┘  └────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Backend Services

### premium-google-mailboxes (Legacy)

**Location:** `wix-private/premium/premium-server/premium-google-mailboxes-modules/`

The legacy but primary service handling most GWS traffic today.

#### Modules

| Module | Purpose |
|--------|---------|
| `premium-google-mailboxes` | Main service |
| `premium-google-mailboxes-api` | HTTP API |
| `premium-google-mailboxes-api-proto` | Proto definitions |
| `premium-google-mailboxes-core` | Core business logic |
| `premium-google-mailboxes-dao` | Data access layer |
| `premium-google-mailboxes-public-apis` | Public API layer |
| `premium-google-mailboxes-dashboard-api` | Dashboard API |
| `premium-google-mailboxes-greyhound-api` | Event handling |
| `premium-google-mailbox-refunds` | Refund processing |
| `premium-google-mailbox-transfersite-api` | Site transfer API |
| `premium-google-mailboxes-bo-api` | Backoffice API |

#### Structure

```
premium-google-mailboxes-modules/
├── premium-google-mailboxes/           ← Main service
│   └── src/
│       ├── main/
│       └── it/                         ← Integration tests
├── premium-google-mailboxes-api/       ← HTTP API
├── premium-google-mailboxes-api-proto/ ← Proto definitions
├── premium-google-mailboxes-core/      ← Core logic
│   └── src/main/scala/specs/premium/mailbox/
├── premium-google-mailboxes-dao/       ← Data access
├── premium-google-mailboxes-public-apis/
└── ...
```

#### Key Capabilities
- Mailbox creation and management
- User provisioning
- Subscription management
- Domain verification
- Monthly migration handling

---

### google-subscriptions (New)

**Location:** `wix-private/premium/premium-server/google-subscriptions/`

New service that works with Premium Platform. Handles Google add-ons (Voice, Gemini).

#### Structure

```
google-subscriptions/
├── proto/                  ← Proto definitions
│   └── wix/
├── src/                    ← Service implementation
├── test/
└── test-resources/
```

#### Key Capabilities
- Google subscription management
- Google add-on provisioning (Voice, Gemini)
- Platform integration
- User management

---

## Frontend Repo

**Repo:** `wix-private/premium-mailboxes`

### Packages

#### Package Pickers

| Package | Purpose |
|---------|---------|
| `package-picker-business-email` | Business Email purchase |
| `package-picker-business-email-standalone` | Standalone version |
| `package-picker-google-voice` | Google Voice purchase |
| `package-picker-google-voice-standalone` | Standalone version |
| `package-picker-google-gemini` | Google Gemini purchase |
| `package-picker-google-gemini-standalone` | Standalone version |

#### Management Pages

| Package | Purpose |
|---------|---------|
| `my-mailboxes-site-level` | Site-level mailbox management |
| `my-mailboxes-account-level` | Account-level mailbox management |
| `setup-users` | User setup flow |
| `add-seats` | Add mailbox seats |
| `reduce-seats` | Reduce mailbox seats |
| `rename-user` | Rename user flow |
| `renew-subscription` | Subscription renewal |

#### Other Packages

| Package | Purpose |
|---------|---------|
| `business-email-cancel-modal` | Cancellation modal |
| `business-email-external` | External flows |
| `business-email-statics` | Static assets |
| `business-email-translations` | i18n |
| `common` | Shared utilities |
| `common-types` | Shared types |
| `google-voice-empty-state` | Empty state UI |

### Serverless

| Location | Purpose |
|----------|---------|
| `serverless/google-workspace/` | Serverless backend |
| `serverless/google-workspace/src/api/` | API endpoints |
| `serverless/google-workspace/src/api/webFunctions/` | Web functions |

#### Key Serverless Endpoints

| Endpoint | Purpose |
|----------|---------|
| `list-user-seats` | List user seats |
| `getAssetByDomain` | Get asset by domain |
| `getAssetByPremiumId` | Get asset by premium ID |
| `subscription-addons` | Subscription add-ons |

---

## Caller-Callee: Frontend → Backend

### premium-mailboxes → Backend

| Backend Service | Ambassador Package | Purpose |
|-----------------|-------------------|---------|
| premium-google-mailboxes | `@wix/ambassador-premium-google-mailboxes` | Mailbox operations |
| google-subscriptions | `@wix/ambassador-premium-google-subscriptions-v1-google-subscription` | Subscriptions |
| google-user | `@wix/ambassador-premium-google-subscriptions-v1-google-user` | User management |
| premium-asset | `@wix/ambassador-premium-asset-v2-premium-asset` | Asset data |
| premium-store | `@wix/ambassador-premium-store-v1-dynamic-offering-service-entity` | Offerings |
| premium-purchase-platform | `@wix/ambassador-premium-purchase-platform-v1-offering` | P3 offerings |
| mailbox-management | `@wix/ambassador-premium-mailbox-v1-mailbox-management` | Mailbox mgmt |
| premium-cart | `@wix/ambassador-premium-cart` | Cart operations |
| reseller | `@wix/ambassador-premium-reseller-v1-reseller` | Reseller flows |
| my-domains | `@wix/ambassador-premium-my-domains` | Domain info |

**Key Code Locations:**
```typescript
// packages/common/src/api/apiClientConfigs/MailboxesServerlessApi/mailboxesServerless.ts
import {
  GetGoogleCustomerRequest,
  GetGoogleCustomerResponse,
  GetUserMailboxesRequest,
} from '@wix/ambassador-premium-google-mailboxes/types';
import { GoogleSubscription } from '@wix/ambassador-premium-google-subscriptions-v1-google-subscription/types';

// serverless/google-workspace/src/getWorkspaceProducts/tests/getWorkspaceProducts.driver.ts
import { PremiumGoogleMailboxes } from '@wix/ambassador-premium-google-mailboxes/rpc';
import { queryGoogleSubscriptions } from '@wix/ambassador-premium-google-subscriptions-v1-google-subscription/rpc';
```

---

## Purchase Flow: Business Email

```
User in Dashboard/Editor
    │
    ▼
package-picker-business-email
    │
    ├── premium-store.GetUserOffering()
    └── premium-google-mailboxes.GetEligibility()
    │
    ▼
Select plan (seats, term)
    │
    ▼
premium-store.CreateOrderPage()
    │
    ▼
Checkout → Payment
    │
    ▼
google-subscriptions.CreateSubscription()
    │
    ▼
premium-google-mailboxes.ProvisionMailboxes()
    │
    ▼
setup-users (user configuration)
```

## Purchase Flow: Google Add-ons (Voice/Gemini)

```
User has Business Email
    │
    ▼
package-picker-google-voice / google-gemini
    │
    ├── premium-store.GetUserOffering()
    └── google-subscriptions.GetEligibility()
    │
    ▼
Select add-on
    │
    ▼
→ Standard checkout flow
    │
    ▼
google-subscriptions.AddAddon()
```

---

## Management Flow

### Add Seats
```
my-mailboxes-site-level / account-level
    │
    ▼
add-seats modal
    │
    ▼
premium-google-mailboxes.AddSeats()
    OR
google-subscriptions.UpdateSubscription()
    │
    ▼
Prorated payment
```

### Setup Users
```
After purchase
    │
    ▼
setup-users
    │
    ▼
premium-google-mailboxes.CreateUser()
    │
    ▼
Google Workspace API (provision)
    │
    ▼
User gets email
```

---

## Legacy vs New Service

| Aspect | premium-google-mailboxes | google-subscriptions |
|--------|-------------------------|---------------------|
| Age | Legacy | New (2024+) |
| Traffic | Main traffic today | Growing |
| Integration | Direct billing | Premium Platform |
| Products | Business Email | All Google products |
| Add-ons | Limited | Voice, Gemini, etc. |

**Future Direction:** google-subscriptions will eventually handle all GWS products, with premium-google-mailboxes becoming legacy.

---

## Exploring the Code

### Find Google Mailboxes API:
```
octocode search: owner=wix-private, repo=premium, keywords=["google-mailboxes", "api"], path=premium-server
```

### Find google-subscriptions proto:
```
octocode view: owner=wix-private, repo=premium, path=premium-server/google-subscriptions/proto
```

### Find frontend package pickers:
```
octocode view: owner=wix-private, repo=premium-mailboxes, path=packages/package-picker-business-email
```

### Find serverless backend:
```
octocode view: owner=wix-private, repo=premium-mailboxes, path=serverless/google-workspace/src
```

### Find integration with backend:
```
octocode search: owner=wix-private, repo=premium-mailboxes, keywords=["ambassador-premium-google"]
```
