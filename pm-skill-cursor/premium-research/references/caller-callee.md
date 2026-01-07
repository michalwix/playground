# Caller-Callee Reference

> **Critical for flow understanding:** This document maps who calls whom in the Wix Premium architecture.
>
> **Important:** This lists known/documented callers. Always use octocode to discover additional callers for your specific investigation.

## Overview Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              FRONTENDS                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ premium-purchase│  │premium-subscrip │  │premium-managemnt│              │
│  │  (checkout-form)│  │ (subscriptions) │  │ (action modals) │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
│           ▼                    ▼                    ▼                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ checkout-view   │  │ premium-asset   │  │ subscription-   │              │
│  │ (billing)       │  │ (platform)      │  │ manager         │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
┌──────────────────────────────────────────────────────────────────────────────┐
│                              PLATFORM                                         │
│  ┌─────────────────┐                      ┌─────────────────┐               │
│  │ premium-store   │ ─────────────────────│ Dealer          │               │
│  │                 │◄────────────────────▶│ (personalizatn) │               │
│  └────────┬────────┘                      └─────────────────┘               │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐                      ┌─────────────────┐               │
│  │ order-session   │◄─────────────────────│ domain-store    │               │
│  │ (billing)       │                      │ (vertical)      │               │
│  └────────┬────────┘                      └─────────────────┘               │
│           │                                                                  │
└───────────┼──────────────────────────────────────────────────────────────────┘
            │
┌───────────┼──────────────────────────────────────────────────────────────────┐
│           ▼                         BILLING                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ checkout-view   │  │ SBS/BASS        │──│ Cashier         │              │
│  │                 │──│ (core billing)  │  │ (payments)      │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## BILLING LAYER

### checkout-view-server

**Called By:**

| Caller | Repo | File Location | How |
|--------|------|---------------|-----|
| checkout-form | `wix-private/premium-purchase` | `packages/checkout-form/src/Checkout/services/checkoutAPI.ts` | HTTP REST |
| checkout-frames | `wix-private/premium-purchase` | `packages/checkout-frames/...` | HTTP REST |
| premium-automation | `wix-private/premium` | `premium-server/premium-automation/` | gRPC |

**Endpoints Called:**
- `POST /checkout-view/api/v1/checkout/data` → `GetCheckoutData`
- `POST /checkout-view/api/v1/checkout/summary` → `UpdateOrderSummary`
- `POST /checkout-view/api/v1/checkout/submit` → `SubmitOrder`

**Calls To:**

| Callee | How | Purpose |
|--------|-----|---------|
| SBS (wix-billing) | Internal | Subscription creation, billing data |
| Cashier | gRPC | Payment processing |

**Octocode Discovery:**
```
# Find additional callers
octocode search: keywords=["checkout-view", "GetCheckoutData"] match="file"

# Find specific integration
octocode search: owner=wix-private, repo=YOUR_REPO, keywords=["checkout-view"]
```

---

### order-session-service

**Called By:**

| Caller | Repo | File Location | How |
|--------|------|---------------|-----|
| premium-store | `wix-private/premium` | `premium-store-modules/premium-store-core/.../OrderSessionCreator.scala` | gRPC |
| domain-store | `wix-private/premium` | `domains/domain-store/.../DomainStoreService.scala` | gRPC |
| GenericPurchasePageControllers | `wix-private/premium` | `premium-store-modules/premium-store/...` | gRPC |

**Key Code Locations:**
```scala
// OrderSessionCreator.scala
orderSessionService.createOrderSession(
  buildCreateOrderSessionRequest(...)
)

// DomainStoreService.scala
orderSessionServiceV2.createOrderSession(CreateOrderSessionRequest(Some(orderSession)))
```

**Calls To:**

| Callee | How | Purpose |
|--------|-----|---------|
| SBS | Internal | Order storage |

---

### SBS (wix-billing) & BASS

**Called By:**

| Caller | Repo | File Location | How |
|--------|------|---------------|-----|
| checkout-view | `wix-p/premium-billing` | Internal services | Internal calls |
| order-session | `wix-p/premium-billing` | Internal services | Internal calls |
| recurring | `wix-p/premium-billing` | Scheduled jobs | Internal |
| subscription-manager | `wix-private/premium` | Via billing-gateway | gRPC |

**Calls To:**

| Callee | Repo | File Location | How |
|--------|------|---------------|-----|
| Cashier | `wix-private/cashier` | `sbs/sbs-core/.../CashierChargeStrategy.scala` | gRPC |
| Cashier | `wix-private/cashier` | `billing-common/billing-common-payments/.../CashierAdapter.scala` | gRPC |
| Cashier | `wix-private/cashier` | `bass/billing-invoices/.../CashierFacade.scala` | gRPC |

**Key Cashier Integration Points:**
```scala
// CashierAdapter.scala - SBS calling Cashier
apiGatewayClient.addServiceIdentity()
ChargeForOrderRequest(orderId = request.orderId, payment = ...)

// CashierFacade.scala - BASS calling Cashier
// Handles payment events, charge processing
```

---

## PLATFORM LAYER

### premium-store

**Called By:**

| Caller | Repo | File Location | How |
|--------|------|---------------|-----|
| P3 serverless | `wix-private/premium-purchase-platform` | `serverless/.../premium-store.offering.repository.ts` | Ambassador gRPC |
| Vertical funnels | Various | Package picker integrations | Ambassador gRPC |
| P3 components | `wix-private/premium-purchase-platform` | `packages/p3-components/...` | Via serverless |

**Key Code Locations:**
```typescript
// premium-store.offering.repository.ts
async function getUserOffering(ctx, { productTypeId, ... }) {
  // Calls premium-store API
}

// Uses ambassador client
import { GetUserOfferingResponse } from '@wix/ambassador-premium-store-v1-dynamic-offering-service-entity/types';
```

**Calls To:**

| Callee | Repo | File Location | How |
|--------|------|---------------|-----|
| Dealer | `wix-private/dealer` | `premium-store-modules/.../DealerOffersServingProxy.scala` | gRPC |
| order-session-service | `wix-p/premium-billing` | `premium-store-modules/.../OrderSessionCreator.scala` | gRPC |
| Product Catalog | `wix-private/premium` | Internal | gRPC |
| Feature Catalog | `wix-private/premium` | Internal | gRPC |

**Key Dealer Integration:**
```scala
// DealerOffersServingProxy.scala
dealerOffersServing.listOffers(ListOffersRequest(placementId, ...))

// DealerOfferingFacade.scala
// Transforms Dealer responses to offering format
```

---

### premium-subscriptions-manager

**Called By:**

| Caller | Repo | File Location | How |
|--------|------|---------------|-----|
| cancel-modal | `wix-private/premium-management` | `packages/cancel-modal/src/services/api.ts` | HTTP REST |
| premium-subscriptions | `wix-private/premium-subscriptions` | Various components | Ambassador |
| cancel-premium-plan | `wix-private/premium-subscriptions` | `packages/cancel-premium-plan/...` | Ambassador |
| assign-subscription | `wix-private/premium-management` | `packages/assign-subscription/...` | HTTP REST |

**Key API Endpoints:**
```typescript
// api.ts in cancel-modal
export const SUBSCRIPTIONS_MANAGER_BASE_URL = "/_api/premium-subscriptions-manager/";

// Calls like:
axiosInstance.post(`/${SUBSCRIPTION_BASE_URL}/${premiumId}/turnAutoRenewOff`)
axiosInstance.post(`/${SUBSCRIPTION_BASE_URL}/${premiumId}/cancelImmediately`)
```

**Ambassador Usage:**
```typescript
// In premium-subscriptions packages
import { PremiumSubscriptionsManagerApiClient } from '../lib/api';
import { CancellationFlow } from '@wix/ambassador-premium-subscriptions-v1-subscription/types';
```

**Calls To:**

| Callee | How | Purpose |
|--------|-----|---------|
| SBS (via billing-gateway) | gRPC | Subscription modifications |
| feature-manager | gRPC | Quota updates |

---

### premium-features-manager

**Called By:**

| Caller | How | Purpose |
|--------|-----|---------|
| Any Wix vertical | gRPC Ambassador | Check feature eligibility |
| subscription-manager | gRPC | Update quotas on subscription changes |
| Internal platform | gRPC | Bulk eligibility checks |

**Ambassador Pattern:**
```typescript
import { IsEligibleRequest } from '@wix/ambassador-premium-features-manager-v1/types';

// Check eligibility
featuresManager.isEligible(IsEligibleRequest()
  .withUniqueName(featureName)
  .withContextId(siteId))
```

---

### premium-asset-view

**Called By:**

| Caller | Repo | File Location | How |
|--------|------|---------------|-----|
| premium-subscriptions | `wix-private/premium-subscriptions` | Various pages | Ambassador |
| subscription actions | `wix-private/premium-management` | Various modals | Ambassador |

**Ambassador Usage:**
```typescript
import { PremiumAsset } from '@wix/ambassador-premium-asset-v2-premium-asset/types';
import { ProviderName } from '@wix/ambassador-premium-data-view-retriever-server/types';
```

---

## INTEGRATIONS

### Cashier (Payment Gateway)

**Called By:**

| Caller | Repo | File Location | Protocol |
|--------|------|---------------|----------|
| SBS | `wix-p/premium-billing` | `sbs/sbs-core/.../CashierChargeStrategy.scala` | gRPC |
| SBS | `wix-p/premium-billing` | `billing-common/.../CashierAdapter.scala` | gRPC |
| BASS | `wix-p/premium-billing` | `bass/billing-invoices/.../CashierFacade.scala` | gRPC |
| BASS | `wix-p/premium-billing` | `bass/billing-invoices/.../CashierEventsHandler.scala` | Events |

**Key Integration Files:**
- `CashierChargeStrategy.scala` - Charge flow types (Initial, Recurring)
- `CashierAdapter.scala` - Main adapter for SBS → Cashier calls
- `CashierFacade.scala` - BASS facade for Cashier
- `CashierEventsHandler.scala` - Handles payment events from Cashier

---

### Dealer (Personalization)

**Called By:**

| Caller | Repo | File Location | Protocol |
|--------|------|---------------|----------|
| premium-store | `wix-private/premium` | `premium-store-modules/.../DealerOffersServingProxy.scala` | gRPC |
| premium-store | `wix-private/premium` | `premium-store-modules/.../DealerOfferingFacade.scala` | gRPC |
| premium-recommendations | `wix-private/premium` | `premium-recommendations/.../DealerFacade.scala` | gRPC |
| premium-discounts | `wix-private/premium` | `premium-discounts/.../DealerFacade.scala` | gRPC |
| premium-asset-view | `wix-private/premium` | `premium-asset-view/.../DealerOfferingFacade.scala` | gRPC |
| premium-product-change | `wix-private/premium` | `premium-subscriptions-product-change/.../DealerFacade.java` | gRPC |

**Key API:**
```scala
// DealerOffersServingProxy.scala
dealerOffersServing.listOffers(ListOffersRequest(placementId, customParams, limit))
```

---

## Common Flow: Purchase

```
User clicks Upgrade
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ premium-purchase-platform (P3)                                   │
│ serverless/premium-store.offering.repository.ts                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │ getUserOffering()
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ premium-store                                                    │
│ premium-store-modules/premium-store-core/                       │
├─────────────────────────────────────────────────────────────────┤
│  ├─► DealerOffersServingProxy.scala ──► Dealer.listOffers()    │
│  ├─► Product Catalog lookup                                     │
│  └─► Feature Catalog lookup                                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ createOrderPage()
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ premium-store → OrderSessionCreator.scala                       │
│ orderSessionService.createOrderSession()                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ order-session-service (billing)                                  │
│ Stores order session, returns session ID                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ redirect to checkout
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ checkout-form (premium-purchase)                                 │
│ packages/checkout-form/src/Checkout/services/checkoutAPI.ts    │
│ GET /checkout-view/api/v1/checkout/data                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ checkout-view-server (billing)                                   │
│ Loads order, pricing, payment options                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ user submits
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ checkout-view → SBS → CashierAdapter                            │
│ billing-common/billing-common-payments/.../CashierAdapter.scala │
│ Charge the card via Cashier                                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Cashier → Payment Provider (Stripe, PayPal, etc.)               │
└───────────────────────────┬─────────────────────────────────────┘
                            │ payment success
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ SBS creates subscription → feature-manager updates quotas       │
└─────────────────────────────────────────────────────────────────┘
```

---

## VERTICALS LAYER (Business Unit)

### Plans Vertical

**premium-purchase-plan → Platform:**

| Callee | Repo | File Location | Protocol |
|--------|------|---------------|----------|
| premium-store | `wix-private/premium` | `src/server/core/getOffering/index.ts` | Ambassador gRPC |
| Dealer | Via premium-store | Various | gRPC |
| PMD | `wix-private/premium-marketing-data` | Various | HTTP |

**Key Code:**
```typescript
// src/server/core/getOffering/index.ts
import { PremiumStore } from '@wix/ambassador-premium-store/rpc';
import { GetUserOfferingResponse } from '@wix/ambassador-premium-store/types';
```

---

### Domains Vertical

**premium-domains → Backend:**

| Callee | Ambassador Package | Purpose |
|--------|-------------------|---------|
| domain-store | `@wix/ambassador-domain-store` | Pricing, purchase |
| domain-search | `@wix/ambassador-domain-search` | Availability |
| domains-tld | `@wix/ambassador-domains-tld-v1-tld` | TLD info |
| premium-domains-price | `@wix/ambassador-premium-domains-v1-domain-price` | Pricing |
| premium-domains-availability | `@wix/ambassador-premium-domains-v2-availability` | Availability |
| domains-mydomains | `@wix/ambassador-domains-mydomains-v1-domain` | My domains |

**Key Code:**
```typescript
// packages/domains-serverless-services/src/services/display_price/display_price.service.ts
import { DomainStore } from '@wix/ambassador-domain-store/rpc';
import { listTlds } from '@wix/ambassador-domains-tld-v1-tld/rpc';
import { listDomainPrice } from '@wix/ambassador-premium-domains-v1-domain-price/rpc';
```

**domain-store → Billing:**

| Callee | Purpose |
|--------|---------|
| order-session-service | Create checkout session |
| coupons-core | Coupon validation |
| billing-gateway | Billing operations |

---

### Google Workspace Vertical

**premium-mailboxes → Backend:**

| Callee | Ambassador Package | Purpose |
|--------|-------------------|---------|
| premium-google-mailboxes | `@wix/ambassador-premium-google-mailboxes` | Mailbox operations |
| google-subscriptions | `@wix/ambassador-premium-google-subscriptions-v1-google-subscription` | Subscriptions |
| google-user | `@wix/ambassador-premium-google-subscriptions-v1-google-user` | User management |
| premium-asset | `@wix/ambassador-premium-asset-v2-premium-asset` | Asset data |
| premium-store | `@wix/ambassador-premium-store-v1-dynamic-offering-service-entity` | Offerings |

**Key Code:**
```typescript
// packages/common/src/api/...
import { GetGoogleCustomerRequest } from '@wix/ambassador-premium-google-mailboxes/types';
import { GoogleSubscription } from '@wix/ambassador-premium-google-subscriptions-v1-google-subscription/types';

// serverless/google-workspace/src/...
import { PremiumGoogleMailboxes } from '@wix/ambassador-premium-google-mailboxes/rpc';
import { queryGoogleSubscriptions } from '@wix/ambassador-premium-google-subscriptions-v1-google-subscription/rpc';
```

---

## How to Discover More Callers

When investigating a specific service, use octocode to find all callers:

### Find All Callers of a Service
```
# Search across all repos for callers
octocode search: keywords=["ambassador-SERVICE-NAME"] match="file"

# Search for REST endpoint usage
octocode search: keywords=["/_api/SERVICE-PATH"] match="file"

# Search for gRPC client usage
octocode search: keywords=["ServiceNameClient", "import"] match="file"
```

### Find How a Service Calls Another
```
# Search within caller repo for callee references
octocode search: owner=CALLER_ORG, repo=CALLER_REPO, keywords=["callee-service", "import"]

# Look for ambassador clients
octocode search: owner=CALLER_ORG, repo=CALLER_REPO, keywords=["ambassador-callee"]
```

### Trace a Complete Flow
```
# 1. Start with entry point (e.g., frontend)
octocode search: owner=wix-private, repo=premium-purchase, keywords=["checkout", "submit"]

# 2. Find what it calls
octocode read: path=<found-file>, matchString="fetch|post|api"

# 3. Follow the chain to next service
octocode search: owner=wix-p, repo=premium-billing, keywords=["SubmitOrder"]

# 4. Continue until you reach the end
```

---

## Ambassador Pattern (Common)

Most inter-service calls in Wix use the "Ambassador" pattern:

```typescript
// Import the typed client
import { ServiceNameClient } from '@wix/ambassador-service-name/http';
import { SomeRequest, SomeResponse } from '@wix/ambassador-service-name/types';

// Create client and call
const client = ServiceNameClient();
const response = await client.someMethod(SomeRequest.create({...}));
```

**To find ambassador usage:**
```
octocode search: keywords=["ambassador-SERVICE-NAME"] match="file"
```

---

## Key Reminder

**This document lists KNOWN callers.** The architecture is complex and new integrations are added regularly.

**Always verify with live octocode searches** to find:
- New callers added since this doc was written
- Vertical-specific integrations
- Test/automation callers
- Legacy integrations

The skill should:
1. Check this document for known callers
2. Run octocode searches for additional/current callers
3. Present combined findings to PM
