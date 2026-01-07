# Wix Premium Architecture Reference

> **Note**: This architecture reflects the system state as of early 2026. If code exploration reveals discrepancies, the codebase is the source of truth - please verify and update this document.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            VERTICALS                                        │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│  │     Plans     │  │    Domains    │  │  Google WS    │  ... other        │
│  │    Funnels    │  │    Funnels    │  │   Funnels     │  verticals        │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘                   │
│          │                  │                  │                            │
│          └──────────────────┼──────────────────┘                            │
│                             ↓                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                           PLATFORM                        (wix-private)     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │   Offering   │ │   Catalog    │ │   Features   │ │   Subscription   │   │
│  │  (premium-   │ │  (product-   │ │   Manager    │ │     Manager      │   │
│  │    store)    │ │   catalog)   │ │              │ │                  │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘   │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                      Pricing Service                                │    │
│  │     (coupons-core, discounts, proration calculations)              │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                             ↓                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                           BILLING                    (wix-p/premium-billing)│
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │   Checkout   │ │   Payments   │ │   Invoices   │ │    Orders    │       │
│  │  (checkout-  │ │ (via Cashier)│ │              │ │              │       │
│  │    view)     │ │              │ │              │ │              │       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │    SBS (wix-billing) - Core Billing System                      │       │
│  └─────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INTEGRATIONS                                         │
│  ┌──────────────────────┐      ┌──────────────────────┐                    │
│  │   Cashier            │      │   Dealer             │                    │
│  │   (Payment Gateway)  │      │   (Personalization)  │                    │
│  │   wix-private/cashier│      │   wix-private/dealer │                    │
│  └──────────────────────┘      └──────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## GitHub Organizations

| Organization | Purpose | Key Contents |
|-------------|---------|--------------|
| `wix-private` | Main Wix codebase | Platform services, frontends, funnels, infra |
| `wix-p` | Billing core | `premium-billing` monorepo (SBS) |

## System Nicknames & Aliases

When PMs or engineers refer to systems, they often use nicknames:

| Official Name | Nicknames/Aliases | Notes |
|---------------|-------------------|-------|
| **premium-platform** | "the platform", "dynamic", "dynamic offering" | Backoffice called "dynamo" |
| **wix-billing** | "SBS" (Subscription Billing System) | The core billing monolith |
| **premium-purchase-plan** (sunrise) | "sunrise", "modern plans" | Modern offering experience |
| **premium-package-pickers** (studio) | "studio", "advanced offering" | Better editor, usually for partners |

## Layer-by-Layer Summary

### Billing Layer
**Repo:** `wix-p/premium-billing`

The billing layer is a monolith containing multiple services:

| Service | Purpose | Main APIs |
|---------|---------|-----------|
| **wix-billing (SBS)** | Core billing system, data source | Legacy APIs, events |
| **checkout-view-server** | Checkout UI data & submission | `GetCheckoutData`, `SubmitOrder` |
| **order-session-service** | Order session management | `CreateOrderSession` |
| **billing-gateway** | gRPC proxy to SBS | Various proxied endpoints |
| **recurring** | Recurring billing logic | Renewal processing |

**Deep dive:** See [billing-architecture.md](./billing-architecture.md)

> **BASS Note:** BASS (new billing system) exists for UoU subscriptions. Only investigate BASS when: (1) researching UoU flows, (2) checking feature-parity for new capabilities, or (3) specific platform→BASS API integration.

### Platform Layer
**Repo:** `wix-private/premium` (under `premium-server/`)

| Service | Purpose | Main APIs |
|---------|---------|-----------|
| **premium-store** | Offering & checkout gateway | `GetUserOffering`, `CreateOrderPage` |
| **premium-manage-subscription** | Subscription lifecycle | `Cancel`, `AutoRenewOff/On`, `Assign/Unassign` |
| **feature-manager** | Quota/entitlement system | `IsEligible`, `ReportQuotaUsage` |
| **product-catalog** | Product definitions | Product configuration |
| **coupons-core** | Discount system | Coupon validation |

**Deep dive:** See [platform-architecture.md](./platform-architecture.md)

### Frontend Layer
Multiple repos for different UI experiences:

| Repo | Purpose |
|------|---------|
| `wix-private/premium-purchase` | Checkout form, frames |
| `wix-private/checkout-components` | Shared checkout UI components |
| `wix-private/premium-subscriptions` | New subscription management page |
| `wix-private/premium-management` | Subscription action modals |
| `wix-private/billing-management` | Billing history pages |
| `wix-private/premium-purchase-platform` | **P3 - Purchase flow platform (recommended for new flows)** |

**Deep dive:** See [frontend-architecture.md](./frontend-architecture.md)

> **P3 Recommendation:** For any new purchase flow, use P3 (premium-purchase-platform). It provides smart React components that auto-fetch data from premium-store.

### Verticals Layer (Business Unit)
**Reference:** See [verticals-architecture.md](./verticals-architecture.md)

User-facing purchase experiences:
- **Plans:** [plans-architecture.md](./plans-architecture.md)
- **Domains:** [domains-architecture.md](./domains-architecture.md)
- **Google Workspace:** [gws-architecture.md](./gws-architecture.md)

### Caller-Callee Relationships
**Reference:** See [caller-callee.md](./caller-callee.md)

Who calls whom, where in the code, and how they communicate. Essential for tracing flows.

### Integrations

| System | Repo | Purpose |
|--------|------|---------|
| **Cashier** | `wix-private/cashier` | Payment gateway, provider integration |
| **Dealer** | `wix-private/dealer` | Personalization, offer recommendations |

## Common Flows

### Purchase Flow (New Subscription)
```
User clicks "Upgrade"
    ↓
Vertical Funnel (e.g., Plans)
    ↓
premium-store.GetUserOffering()  ← Dealer recommendations
    ↓
Package Picker (P3 components)
    ↓
premium-store.CreateOrderPage()
    ↓
order-session-service.CreateOrderSession()
    ↓
checkout-view-server.GetCheckoutData()
    ↓
Checkout Form (premium-purchase)
    ↓
checkout-view-server.SubmitOrder()
    ↓
Cashier (payment processing)
    ↓
SBS (subscription creation)
    ↓
feature-manager (quota allocation)
    ↓
Success Page
```

### Cancellation Flow
```
User clicks "Cancel" on subscriptions page
    ↓
premium-subscriptions (UI)
    ↓
premium-management/cancel-modal
    ↓
premium-manage-subscription.CancelImmediately()
    ↓
SBS (billing stop, refund calculation)
    ↓
feature-manager (quota removal)
    ↓
Confirmation
```

### Upgrade Flow (Tier Change)
```
User clicks "Upgrade" on existing subscription
    ↓
premium-store.GetUserOffering() (with upgrade context)
    ↓
Proration calculation
    ↓
Checkout with credit applied
    ↓
SBS (subscription modification)
    ↓
feature-manager (quota update)
```

## Tech Stack

| Layer | Languages | Frameworks | Build System |
|-------|-----------|------------|--------------|
| Billing | Scala, Java | Play, internal | Bazel |
| Platform | Scala, Java | Play, internal | Bazel |
| Frontends | TypeScript, React | Wix internal, Stylable | Yarn, serverless |

## Event-Driven Architecture

All layers publish events to Kafka, which are then available in Trino for analytics:

```
Service Action → Kafka Event → Trino Tables
```

Key event sources:
- SBS: Subscription lifecycle events
- Platform: Feature eligibility changes
- Frontends: UI analytics, conversion events

## B2B Flows (Enterprise/Large Users)

For large users and B2B scenarios, check these services:

| Service | Repo Location | Purpose |
|---------|---------------|---------|
| **packages** | `wix-private/premium` | B2B package management |
| **reseller-manager** (rslr-magmer) | `wix-private/premium` | Reseller account management |

**When to consider B2B:**
- Enterprise users with custom pricing
- Reseller/partner scenarios
- Bulk subscription management

## Key Contacts by System

> **Note:** Update with actual team ownership

| System | Owner Team |
|--------|------------|
| SBS | Billing Core |
| Platform Services | Platform Team |
| Funnels | Business Unit |
| Cashier | Payments Team |
