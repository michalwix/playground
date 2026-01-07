# Platform Layer Architecture

> **Repo:** `wix-private/premium` (under `premium-server/`)
>
> **Note:** This architecture reflects early 2026 state. Platform is the monetization layer between verticals and billing.

## Overview

The Platform layer provides shared monetization capabilities used by all verticals:

```
wix-private/premium/premium-server/
├── premium-store-modules/              ← Offering & checkout gateway
├── premium-subscriptions-manager-modules/ ← Subscription lifecycle
├── premium-features-manager-modules/   ← Quota/entitlement system
├── premium-asset-view/                 ← Aggregated subscription data
├── product-catalog/                    ← Product definitions (v2)
├── feature-catalog/                    ← Feature definitions
└── premium-refund/                     ← Refund processing
```

Also in `wix-p/premium-billing`:
```
premium-billing/
└── coupons-core/                       ← Discount system
```

---

## Premium-Store (Offering Service)

### What It Is
The gateway for all offering and checkout operations. No data storage - aggregates from catalogs, dealer, and billing.

### Important Callers

| Caller | Repo | File Location | Protocol |
|--------|------|---------------|----------|
| **P3 serverless** | `wix-private/premium-purchase-platform` | `serverless/.../premium-store.offering.repository.ts` | Ambassador gRPC |
| **Vertical funnels** | Various | Package picker integrations | Ambassador gRPC |
| **P3 components** | `wix-private/premium-purchase-platform` | `packages/p3-components/...` | Via serverless |

**Key Code Pattern:**
```typescript
// premium-store.offering.repository.ts
import { GetUserOfferingResponse } from '@wix/ambassador-premium-store-v1-dynamic-offering-service-entity/types';

async function getUserOffering(ctx, { productTypeId, ... }) {
  // Calls premium-store API
}
```

**Discover more callers:**
```
octocode search: keywords=["ambassador-premium-store", "getUserOffering"] match="file"
octocode search: keywords=["premium-store", "GetUserOffering"] match="file"
```

### Calls To

| Callee | Repo | File Location | Purpose |
|--------|------|---------------|---------|
| **Dealer** | `wix-private/dealer` | `premium-store-modules/.../DealerOffersServingProxy.scala` | Personalized recommendations |
| **order-session-service** | `wix-p/premium-billing` | `premium-store-modules/.../OrderSessionCreator.scala` | Create order sessions |
| **Product Catalog** | Internal | Internal | Product data |
| **Feature Catalog** | Internal | Internal | Feature definitions |

**Key Dealer Integration:**
```scala
// DealerOffersServingProxy.scala
dealerOffersServing.listOffers(ListOffersRequest(placementId, customParams, limit))
```

### Key Responsibilities
- Fetch personalized offerings for users (via Dealer)
- Handle package picker API requests
- Create order pages (checkout initiation)
- Provision products after purchase

### Key APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/offering/{product_type_id}` | GET/POST | Get user's available offerings |
| `/api/v1/createOrderPage` | POST | Initiate checkout, create order session |
| `/api/v1/provision-products` | POST | Provision purchased products |
| `/api/v1/free-trial/eligibility` | GET | Check free trial eligibility |

### Proto Location
```
premium-store-modules/premium-store-api/src/main/proto/
└── com/wixpress/premium/store/
    ├── DynamicOfferingApi.proto      ← Main offering API
    ├── CreateOrderPageApi.proto      ← Checkout initiation
    └── ProvisioningApi.proto         ← Product provisioning
```

### Key Messages

**GetUserOfferingRequest:**
```protobuf
message GetUserOfferingRequest {
  string product_type_id = 1;    // e.g., "premium_plans", "domains"
  string site_id = 2;
  string user_id = 3;
  OfferingContext context = 4;   // Upgrade context, etc.
}
```

**GetUserOfferingResponse:**
```protobuf
message GetUserOfferingResponse {
  repeated Package packages = 1;       // Available packages
  Package recommended_package = 2;      // Dealer recommendation
  repeated Discount discounts = 3;      // Available discounts
  UpgradeInfo upgrade_info = 4;         // If upgrading
}
```

**CreateOrderPageRequest:**
```protobuf
message CreateOrderPageRequest {
  string product_type_id = 1;
  string package_id = 2;
  string site_id = 3;
  string return_url = 4;
  string cancel_url = 5;
  repeated AddonSelection addons = 6;
}
```

### Integration with Dealer
Premium-store calls Dealer for personalized recommendations:
```
GetUserOffering()
    → Dealer.listOffers(realEstateId, userId)
        ← Personalized package recommendations
    → Merge with catalog data
    → Return enriched offering
```

### Flow
```
Vertical Funnel
    → premium-store.GetUserOffering()
        → Dealer (recommendations)
        → Product Catalog (packages)
        → Feature Catalog (benefits)
    → User selects package
    → premium-store.CreateOrderPage()
        → order-session-service.CreateOrderSession()
    → Redirect to checkout
```

---

## Premium-Subscriptions-Manager

### What It Is
Manages subscription lifecycle - all user actions on existing subscriptions flow through here.

### Important Callers

| Caller | Repo | File Location | Protocol |
|--------|------|---------------|----------|
| **cancel-modal** | `wix-private/premium-management` | `packages/cancel-modal/src/services/api.ts` | HTTP REST |
| **premium-subscriptions** | `wix-private/premium-subscriptions` | Various components | Ambassador gRPC |
| **cancel-premium-plan** | `wix-private/premium-subscriptions` | `packages/cancel-premium-plan/...` | Ambassador gRPC |
| **assign-subscription** | `wix-private/premium-management` | `packages/assign-subscription/...` | HTTP REST |

**Key Code Pattern:**
```typescript
// api.ts in cancel-modal
export const SUBSCRIPTIONS_MANAGER_BASE_URL = "/_api/premium-subscriptions-manager/";

// REST calls
axiosInstance.post(`/${SUBSCRIPTION_BASE_URL}/${premiumId}/turnAutoRenewOff`)
axiosInstance.post(`/${SUBSCRIPTION_BASE_URL}/${premiumId}/cancelImmediately`)

// Ambassador pattern
import { PremiumSubscriptionsManagerApiClient } from '../lib/api';
import { CancellationFlow } from '@wix/ambassador-premium-subscriptions-v1-subscription/types';
```

**Discover more callers:**
```
octocode search: keywords=["premium-subscriptions-manager", "cancel"] match="file"
octocode search: keywords=["ambassador-premium-subscriptions", "turnAutoRenew"] match="file"
```

### Calls To

| Callee | Protocol | Purpose |
|--------|----------|---------|
| SBS (via billing-gateway) | gRPC | Subscription modifications |
| feature-manager | gRPC | Quota updates |

### Key Responsibilities
- Cancel subscriptions
- Toggle auto-renewal
- Assign/unassign subscriptions to sites
- Consume billing events and notify verticals
- Handle retention flows

### Key APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/subscriptions` | GET | List user's subscriptions |
| `/v1/subscriptions/{id}` | GET | Get subscription details |
| `/v1/subscriptions/{id}/cancelImmediately` | POST | Cancel now (with/without refund) |
| `/v1/subscriptions/{id}/cancelAtEndOfPeriod` | POST | Cancel at renewal |
| `/v1/subscriptions/{id}/turnAutoRenewOff` | POST | Turn off auto-renewal |
| `/v1/subscriptions/{id}/turnAutoRenewOn` | POST | Turn on auto-renewal |
| `/v1/subscriptions/{id}/assignToSite` | PATCH | Assign to a site |
| `/v1/subscriptions/{id}/unassignFromSite` | PATCH | Unassign from site |

### Proto Location
```
premium-subscriptions-manager-modules/
└── premium-subscriptions-manager-api/src/main/proto/
    └── com/wixpress/premium/subscriptions/
        └── subscriptions-manager-api.proto
```

### Key Messages

**CancelImmediatelyRequest:**
```protobuf
message CancelImmediatelyRequest {
  string subscription_id = 1;
  CancelReason reason = 2;
  bool with_refund = 3;
  string refund_reason = 4;
}
```

**AssignToSiteRequest:**
```protobuf
message AssignToSiteRequest {
  string subscription_id = 1;
  string site_id = 2;
}
```

### Event Handling
Subscription Manager consumes billing events and notifies verticals:
```
SBS Event (subscription created/cancelled/renewed)
    → Subscription Manager (consume)
        → Vertical notification (via dedicated API)
        → Feature Manager (update quotas)
```

---

## Premium-Features-Manager

### What It Is
The quota and entitlement system. Manages what features a subscription provides and tracks usage.

### Important Callers

| Caller | Protocol | Purpose |
|--------|----------|---------|
| **Any Wix vertical** | Ambassador gRPC | Check feature eligibility |
| **subscription-manager** | gRPC | Update quotas on subscription changes |
| **Internal platform** | gRPC | Bulk eligibility checks |

**Key Ambassador Pattern:**
```typescript
import { IsEligibleRequest } from '@wix/ambassador-premium-features-manager-v1/types';

// Check eligibility
featuresManager.isEligible(IsEligibleRequest()
  .withUniqueName(featureName)
  .withContextId(siteId))
```

**Discover callers:**
```
octocode search: keywords=["ambassador-premium-features-manager", "isEligible"] match="file"
octocode search: keywords=["features-manager", "eligibility"] match="file"
```

### Key Responsibilities
- Track feature eligibility per subscription
- Manage quota allocation and usage
- Handle bulk eligibility checks
- Report quota consumption

### Key APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/features` | GET | List all features |
| `/v1/features/{unique_name}` | GET | Get feature definition |
| `/v1/features/{unique_name}/is-eligible` | GET | Check if user is eligible |
| `/v1/features/bulk-is-eligible` | POST | Bulk eligibility check |
| `/v1/features/{unique_name}/report-quota-usage` | POST | Report quota consumption |

### Proto Location
```
premium-features-manager-modules/
└── premium-features-manager-api/src/main/proto/
    └── com/wixpress/premium/features/
        └── features-manager-api.proto
```

### Key Messages

**IsEligibleRequest:**
```protobuf
message IsEligibleRequest {
  string unique_name = 1;      // Feature name
  string context_id = 2;       // Site ID or Account ID
  ContextType context_type = 3; // SITE or ACCOUNT
}
```

**IsEligibleResponse:**
```protobuf
message IsEligibleResponse {
  bool is_eligible = 1;
  Quota quota = 2;             // If feature has quota
  string subscription_id = 3;   // Source subscription
}
```

**ReportQuotaUsageRequest:**
```protobuf
message ReportQuotaUsageRequest {
  string unique_name = 1;
  string context_id = 2;
  int64 usage_delta = 3;       // How much to add/subtract
}
```

### Flow
```
Vertical checks eligibility:
    → feature-manager.IsEligible(feature="custom_domain", siteId)
        ← { eligible: true, quota: { limit: 5, used: 2 } }

Vertical reports usage:
    → feature-manager.ReportQuotaUsage(feature="email_storage", delta=100MB)
        ← { success: true, remaining: 4.9GB }
```

---

## Premium-Asset-View

### What It Is
Aggregation service that provides a unified view of user's subscription data. Main "read" source for subscription page.

### Key Responsibilities
- Aggregate data from platform, billing, and verticals
- Serve subscription management pages
- Provide allowed actions per subscription

### Directory
```
premium-server/premium-asset-view/
├── src/main/scala/
│   └── com/wixpress/premium/assetview/
│       ├── api/            ← API endpoints
│       └── services/       ← Aggregation logic
```

---

## Catalogs

### Product Catalog (v2)
Defines all purchasable products and packages.

**Location:** `premium-server/product-catalog/`

**Key Entities:**
- Products (e.g., "Premium Plan", "Domain")
- Packages (e.g., "Business", "Unlimited")
- Pricing tiers
- Regional availability

### Feature Catalog
Defines all features and their quotas.

**Location:** `premium-server/feature-catalog/`

**Key Entities:**
- Feature definitions
- Quota limits
- Package-to-feature mappings

### Coupons-Core (Discount Catalog)
Manages all discount and coupon logic.

**Location:** `wix-p/premium-billing/coupons-core/`

**Key Responsibilities:**
- Coupon validation
- Discount calculation
- Campaign management
- Proration calculations

---

## P3 - Premium Purchase Platform

### What It Is
Frontend platform for building purchase flows. Provides smart components that auto-fetch data.

**Repo:** `wix-private/premium-purchase-platform`

### Structure
```
premium-purchase-platform/
├── packages/
│   ├── premium-purchase-platform-serverless/  ← API aggregator
│   ├── p3-components/                         ← Smart React components
│   └── p3-studio/                             ← No-code flow builder
└── serverless/
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `PackagePicker` | Display available packages |
| `OfferingCard` | Individual package card |
| `CheckoutButton` | Initiate checkout |
| `UpgradeFlow` | Complete upgrade experience |

### Integration
P3 components automatically call premium-store APIs:
```jsx
<PackagePicker productTypeId="premium_plans" />
// Internally calls: premium-store.GetUserOffering()
```

---

## Satellite Services

### B2B Flows (Enterprise/Large Users)

For large users and B2B scenarios, check these services:

| Service | Repo Location | Purpose |
|---------|---------------|---------|
| **packages** | `wix-private/premium/premium-server/packages/` | B2B package management |
| **reseller-manager** (rslr-magmer) | `wix-private/premium/premium-server/reseller-manager/` | Reseller account management |

**When to consider B2B:**
- Enterprise users with custom pricing
- Reseller/partner scenarios
- Bulk subscription management

**Explore B2B code:**
```
octocode search: owner=wix-private, repo=premium, keywords=["packages", "reseller"] path="premium-server"
```

### Transfer Site
Handles site transfer between accounts with subscription handling.

### Premium-Refund
Dedicated refund processing service.

---

## Exploring the Code

### Find offering API:
```
octocode search: owner=wix-private, repo=premium, keywords=["GetUserOffering", "proto"]
```

### Find subscription manager:
```
octocode search: owner=wix-private, repo=premium, keywords=["subscriptions-manager", "cancel"]
```

### Find feature eligibility:
```
octocode search: owner=wix-private, repo=premium, keywords=["IsEligible", "features-manager"]
```

### View P3 components:
```
octocode view: owner=wix-private, repo=premium-purchase-platform, path=packages/p3-components/src
```
