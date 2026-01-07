# Frontend Architecture

> **Note:** This architecture reflects early 2026 state. Frontend repos are spread across multiple repositories by function.

## Overview

Frontend components are organized by function across multiple repos:

```
CHECKOUT FLOW
├── wix-private/premium-purchase          ← Checkout form & frames
├── wix-private/checkout-components       ← Shared checkout UI components
└── wix-private/premium-purchase-platform ← P3 - Purchase flow platform

SUBSCRIPTION MANAGEMENT
├── wix-private/premium-subscriptions     ← New subscription page (v2)
├── wix-private/premium-manage-subscriptions ← Legacy subscription page
└── wix-private/premium-management        ← Subscription action modals

BILLING PAGES
├── wix-private/billing-management        ← Billing history & invoices
├── wix-private/premium-checkout-consumers ← Checkout consumer pages
└── wix-private/billing-operations        ← Billing backoffice

BASS (UoU)
└── wix-private/premium-components        ← BASS frontend for merchants
```

---

## Checkout Flow Repos

### premium-purchase
**Repo:** `wix-private/premium-purchase`

The main checkout frontend implementation.

#### Calls To (Backend Services)

| Service | File Location | Protocol | Purpose |
|---------|---------------|----------|---------|
| **checkout-view-server** | `packages/checkout-form/src/Checkout/services/checkoutAPI.ts` | HTTP REST | Load checkout data, submit orders |
| **payment-request** | `packages/checkout-form/src/...` | HTTP REST | Create payment requests |

**Key API Calls:**
```typescript
// checkoutAPI.ts
export const CREATE_PAYMENT_REQUEST_URL = '/_serverless/payment-request/create';

// Checkout endpoints
GET /checkout-view/api/v1/checkout/data     → GetCheckoutData
POST /checkout-view/api/v1/checkout/summary → UpdateOrderSummary
POST /checkout-view/api/v1/checkout/submit  → SubmitOrder
```

**Discover more integrations:**
```
octocode search: owner=wix-private, repo=premium-purchase, keywords=["api", "fetch", "post"]
```

#### Packages
| Package | Purpose |
|---------|---------|
| `checkout-form` | Main checkout form component |
| `checkout-frames` | Iframe-based checkout |
| `checkout-server` | Checkout serverless backend |
| `purchase-flow-components` | Shared purchase UI components |
| `billing-client-common` | Shared billing client utilities |
| `payment-method-icons` | Payment method icon assets |

#### checkout-form Structure
```
packages/checkout-form/src/
├── Checkout/           ← Main checkout container
├── components/         ← UI components (forms, buttons)
├── PaymentModals/      ← Payment-specific modals
├── providers/          ← React context providers
├── services/           ← API service layer
├── hooks/              ← Custom React hooks
└── constants/          ← Configuration constants
```

#### Key Components
- **CheckoutContainer** - Main checkout orchestrator
- **PaymentForm** - Payment method input
- **BillingAddressForm** - Address collection
- **OrderSummary** - Cart display
- **PaymentMethodSelector** - Payment method selection

---

### checkout-components
**Repo:** `wix-private/checkout-components`

Shared UI components used across checkout experiences.

#### Packages
| Package | Purpose |
|---------|---------|
| `checkout-components` | Reusable checkout UI library |

---

### premium-purchase-platform (P3)
**Repo:** `wix-private/premium-purchase-platform`

Platform for building purchase flows with minimal code.

#### Calls To (Backend Services)

| Service | File Location | Protocol | Purpose |
|---------|---------------|----------|---------|
| **premium-store** | `serverless/.../premium-store.offering.repository.ts` | Ambassador gRPC | Get offerings, create order pages |
| **Dealer** | Via premium-store | Ambassador gRPC | Personalized recommendations |

**Key Integration:**
```typescript
// premium-store.offering.repository.ts
import { GetUserOfferingResponse } from '@wix/ambassador-premium-store-v1-dynamic-offering-service-entity/types';

async function getUserOffering(ctx, { productTypeId, ... }) {
  // Calls premium-store which calls Dealer
}
```

#### Packages
| Package | Purpose |
|---------|---------|
| `premium-purchase-platform-serverless` | API aggregator serverless |
| `p3-components` | Smart React components |
| `p3-studio` | No-code flow builder |

#### P3 Components
Smart components that auto-fetch data from premium-store:

| Component | Usage |
|-----------|-------|
| `<PackagePicker />` | Display available packages |
| `<OfferingCard />` | Individual package card |
| `<CheckoutButton />` | Initiate checkout |
| `<UpgradeFlow />` | Complete upgrade experience |
| `<ComparisonTable />` | Package comparison |

#### Example Usage
```jsx
import { PackagePicker } from '@wix/p3-components';

function UpgradePage() {
  return (
    <PackagePicker
      productTypeId="premium_plans"
      onPackageSelect={(pkg) => startCheckout(pkg)}
    />
  );
}
```

---

## Subscription Management Repos

### premium-subscriptions (New)
**Repo:** `wix-private/premium-subscriptions`

The new subscription management page (v2).

#### Calls To (Backend Services)

| Service | File Location | Protocol | Purpose |
|---------|---------------|----------|---------|
| **premium-asset-view** | Various | Ambassador gRPC | Get subscription data |
| **subscription-manager** | Various | Ambassador gRPC | Cancel, auto-renew, assign |
| **data-view-retriever** | Various | Ambassador gRPC | Aggregated subscription views |

**Key Ambassador Imports:**
```typescript
import { PremiumAsset } from '@wix/ambassador-premium-asset-v2-premium-asset/types';
import { ProviderName } from '@wix/ambassador-premium-data-view-retriever-server/types';
import { CancellationFlow } from '@wix/ambassador-premium-subscriptions-v1-subscription/types';
import { PremiumSubscriptionsManagerApiClient } from '../lib/api';
```

**Discover integrations:**
```
octocode search: owner=wix-private, repo=premium-subscriptions, keywords=["ambassador", "import"]
```

#### Packages
| Package | Purpose |
|---------|---------|
| `premium-manage-subscriptions-v2` | Main subscriptions page |
| `subscriptions-dashboard` | Dashboard widgets |
| `subscriptions-mobile` | Mobile-optimized views |
| `cancel-premium-plan` | Plan cancellation flow |
| `cancel-dynamic-product` | Dynamic product cancellation |
| `change-premium-plan` | Plan change flow |
| `premium-assign-subscription` | Subscription assignment UI |
| `premium-assign-subscription-bm` | BM assignment page |
| `insight-widgets` | Subscription insights |

#### Structure
```
premium-subscriptions/
├── packages/           ← UI packages
├── serverless/         ← Serverless backend
└── sled/               ← E2E tests
```

---

### premium-manage-subscriptions (Legacy)
**Repo:** `wix-private/premium-manage-subscriptions`

Legacy subscription management page. Being replaced by premium-subscriptions.

---

### premium-management
**Repo:** `wix-private/premium-management`

Subscription action modals and flows.

#### Calls To (Backend Services)

| Service | File Location | Protocol | Purpose |
|---------|---------------|----------|---------|
| **subscription-manager** | `packages/cancel-modal/src/services/api.ts` | HTTP REST | Cancel, auto-renew |
| **subscription-manager** | `packages/assign-subscription/...` | HTTP REST | Assign/unassign |

**Key API Pattern:**
```typescript
// api.ts
export const SUBSCRIPTIONS_MANAGER_BASE_URL = "/_api/premium-subscriptions-manager/";

// Calls
axiosInstance.post(`/${SUBSCRIPTION_BASE_URL}/${premiumId}/turnAutoRenewOff`)
axiosInstance.post(`/${SUBSCRIPTION_BASE_URL}/${premiumId}/cancelImmediately`)
```

**Ambassador Usage:**
```typescript
import { PremiumSubscriptionsManagerService } from '@wix/ambassador-premium-subscriptions-manager-service/http';
```

#### Packages
| Package | Purpose |
|---------|---------|
| `cancel-modal` | Cancellation modal with retention |
| `assign-subscription` | Subscription assignment flow |
| `allow-access` | Access management |
| `boleto-refund` | Boleto refund handling |
| `manage-mailboxes` | Mailbox management |
| `plan-features` | Feature display components |
| `partners-package-client` | Partner package UI |
| `partners-package-client-modals` | Partner modals |
| `partners-package-server` | Partner serverless |
| `remove-billing-manager` | Remove billing manager |

---

## Billing Pages Repos

### billing-management
**Repo:** `wix-private/billing-management`

Billing history and invoice pages.

#### Packages
| Package | Purpose |
|---------|---------|
| `billing-history-bm` | Billing history page |
| `billing-management` | Main billing management |

---

### premium-checkout-consumers
**Repo:** `wix-private/premium-checkout-consumers`

Pages displayed to users after checkout (success, failure, etc.)

---

### billing-operations
**Repo:** `wix-private/billing-operations`

Billing backoffice and operations tools.

#### Packages
| Package | Purpose |
|---------|---------|
| `bass-bo` | BASS backoffice |
| `billing-backoffice` | New unified billing BO (WIP) |
| `billing-operations` | Bulk operations system |

---

## BASS Frontend

### premium-components
**Repo:** `wix-private/premium-components`

Frontend for BASS (UoU subscriptions) - used by merchants to manage their customers' subscriptions.

#### Packages
| Package | Purpose |
|---------|---------|
| `billing-subscriptions-bm` | Main BM page for UoU subscriptions |
| `billing-subscriptions-bm-api` | BM API layer |
| `billing-subscriptions-bm-settings` | Subscription settings |
| `billing-subscriptions-client-common` | Shared client utilities |
| `subscriptions-tpa` | TPA for UoU subscribers |
| `subscriptions-automation` | Automation tools |
| `bass-backoffice` | BASS admin interface |

---

## Tech Stack

All frontend repos use similar technology:

| Technology | Purpose |
|------------|---------|
| **React** | UI framework |
| **TypeScript** | Type safety |
| **Stylable** | Wix CSS-in-JS solution |
| **Wix Design System** | UI component library |
| **Serverless** | Backend functions |
| **Yarn** | Package management |

### Directory Patterns
```
repo/
├── packages/           ← Monorepo packages
│   └── package-name/
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   └── index.ts
│       └── package.json
├── serverless/         ← Serverless functions
└── package.json        ← Root package.json
```

---

## Frontend → Backend API Flow

### Checkout Flow
```
checkout-form
    → checkout-view-server.GetCheckoutData()
    → User fills form
    → checkout-view-server.SubmitOrder()
        → Cashier (payment)
        → SBS (subscription)
    → Success/Error page
```

### Subscription Management Flow
```
premium-subscriptions
    → premium-asset-view (aggregated data)
    → User clicks "Cancel"
    → premium-management/cancel-modal
    → premium-manage-subscription.CancelImmediately()
    → Confirmation
```

### Offering Flow (P3)
```
p3-components/PackagePicker
    → premium-purchase-platform-serverless
        → premium-store.GetUserOffering()
        → Dealer recommendations
    → Display packages
    → User selects
    → premium-store.CreateOrderPage()
    → Redirect to checkout
```

---

## Exploring the Code

### Find checkout form components:
```
octocode view: owner=wix-private, repo=premium-purchase,
  path=packages/checkout-form/src/components
```

### Find subscription page:
```
octocode view: owner=wix-private, repo=premium-subscriptions,
  path=packages/premium-manage-subscriptions-v2/src
```

### Find cancellation modal:
```
octocode search: owner=wix-private, repo=premium-management,
  keywords=["cancel-modal", "CancellationModal"]
```

### Find P3 components:
```
octocode view: owner=wix-private, repo=premium-purchase-platform,
  path=packages/p3-components/src
```

### Find BASS BM page:
```
octocode view: owner=wix-private, repo=premium-components,
  path=packages/billing-subscriptions-bm/src
```
