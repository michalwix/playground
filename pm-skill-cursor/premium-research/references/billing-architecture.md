# Billing Layer Architecture

> **Repo:** `wix-p/premium-billing`
>
> **Note:** This architecture reflects early 2026 state. SBS is the core billing system for Wix users.

## Overview

The billing layer is a monolith in `wix-p/premium-billing` containing:

```
premium-billing/
├── wix-billing/          ← SBS: Core billing monolith
├── checkout-view/        ← Checkout API server
├── order-session/        ← Order session management
├── billing-gateway/      ← gRPC proxy to SBS
├── recurring/            ← Recurring billing processor
└── coupons-core/         ← Discount system
```

---

## SBS (wix-billing) - Core Billing System

### What It Is
SBS (Subscription Billing System) is the main billing monolith. It's the **data source** for all billing data and notifies other systems of billing events.

### Key Characteristics
- **Legacy but core**: Oldest system, but handles most Wix user subscriptions
- **Data owner**: All billing tables live here
- **Event publisher**: Notifies downstream systems of billing changes
- **Scala/Java**: Built with Play framework

### Directory Structure
```
wix-billing/
├── modules/
│   ├── wix-billing-api/      ← Public API definitions
│   ├── wix-billing-core/     ← Core domain logic
│   ├── wix-billing-db/       ← Database access
│   └── wix-billing-events/   ← Event publishing
├── sbs-ui/                    ← Backoffice UI (legacy)
└── tests/
```

### Integration Points
- **Calls to:** Cashier (for payment processing)
- **Called by:** Premium Platform (premium-store, subscription-manager)
- **Events to:** Kafka (for Trino analytics)

---

## Checkout-View-Server

### What It Is
The checkout API server that provides data for the checkout UI and handles order submission.

### Important Callers

| Caller | Repo | File Location | Protocol |
|--------|------|---------------|----------|
| **checkout-form** | `wix-private/premium-purchase` | `packages/checkout-form/src/Checkout/services/checkoutAPI.ts` | HTTP REST |
| **checkout-frames** | `wix-private/premium-purchase` | `packages/checkout-frames/...` | HTTP REST |
| **premium-automation** | `wix-private/premium` | `premium-server/premium-automation/` | gRPC |

**Discover more callers:**
```
octocode search: keywords=["checkout-view", "GetCheckoutData"] match="file"
octocode search: keywords=["/checkout-view/api/v1"] match="file"
```

### Calls To

| Callee | Protocol | Purpose |
|--------|----------|---------|
| SBS (wix-billing) | Internal | Subscription creation, billing data |
| Cashier | gRPC | Payment processing |

### Key APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/checkout/data` | POST | Get checkout page data (products, pricing, user info) |
| `/api/v1/checkout/summary` | POST | Update order summary (apply coupons, change quantity) |
| `/api/v1/checkout/submit` | POST | Submit order for payment |
| `/api/v1/checkout/payment-status` | GET | Check payment processing status |

### Proto Location
```
checkout-view/checkout-view-api/src/main/proto/
└── com/wixpress/billing/checkout/
    └── checkout-view.proto
```

### Key Messages (from proto)

**GetCheckoutDataRequest:**
```protobuf
message GetCheckoutDataRequest {
  string order_session_id = 1;
  string locale = 2;
  // Additional context fields
}
```

**GetCheckoutDataResponse:**
```protobuf
message GetCheckoutDataResponse {
  OrderSummary order_summary = 1;
  PaymentOptions payment_options = 2;
  UserInfo user_info = 3;
  repeated Product products = 4;
}
```

**SubmitOrderRequest:**
```protobuf
message SubmitOrderRequest {
  string order_session_id = 1;
  PaymentDetails payment_details = 2;
  BillingAddress billing_address = 3;
}
```

### Flow
```
Frontend (checkout-form)
    → GetCheckoutData (load page)
    → UpdateOrderSummary (coupon applied)
    → SubmitOrder (user clicks pay)
        → Cashier (payment processing)
        → SBS (subscription creation)
    → GetOrderPaymentStatus (poll for completion)
```

---

## Order-Session-Service

### What It Is
Manages order sessions - temporary storage for checkout context before submission.

### Important Callers

| Caller | Repo | File Location | Protocol |
|--------|------|---------------|----------|
| **premium-store** | `wix-private/premium` | `premium-store-modules/premium-store-core/.../OrderSessionCreator.scala` | gRPC |
| **domain-store** | `wix-private/premium` | `domains/domain-store/.../DomainStoreService.scala` | gRPC |
| **GenericPurchasePageControllers** | `wix-private/premium` | `premium-store-modules/premium-store/...` | gRPC |

**Key Code Pattern:**
```scala
// OrderSessionCreator.scala
orderSessionService.createOrderSession(
  buildCreateOrderSessionRequest(currency, orderProducts, ...)
)

// DomainStoreService.scala
orderSessionServiceV2.createOrderSession(CreateOrderSessionRequest(Some(orderSession)))
```

**Discover more callers:**
```
octocode search: keywords=["OrderSessionService", "createOrderSession"] match="file"
octocode search: keywords=["order-session", "CreateOrderSession"] match="file"
```

### Key APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v2/order-sessions` | POST | Create new order session |
| `/api/v2/order-sessions/{id}` | GET | Get order session details |

### Proto Location
```
order-session/order-session-api/src/main/proto/
└── com/wixpress/billing/ordersession/
    └── order-sessions.proto
```

### Key Messages

**CreateOrderSessionRequest:**
```protobuf
message CreateOrderSessionRequest {
  string site_id = 1;
  string user_id = 2;
  repeated OrderItem items = 3;
  string return_url = 4;
  string cancel_url = 5;
  OrderContext context = 6;
}
```

### Flow
```
premium-store.CreateOrderPage()
    → order-session-service.CreateOrderSession()
        → Returns session_id
    → Redirect to checkout with session_id
```

---

## Billing-Gateway

### What It Is
A gRPC proxy that exposes SBS functionality via modern gRPC endpoints. Since SBS is very old, this gateway provides a cleaner API surface.

### Purpose
- Converts REST/gRPC calls to SBS internal format
- Provides type-safe proto definitions for SBS operations
- Handles authentication and authorization

---

## Recurring Service

### What It Is
Handles recurring billing logic - renewals, retry logic, dunning.

### Key Responsibilities
- Schedule renewal attempts
- Handle payment failures with retry logic
- Manage dunning (payment failure notifications)
- Coordinate with Cashier for payment processing

---

---

## BASS - New Billing System (UoU Only)

> **When to investigate BASS:** Only when researching (1) UoU subscriptions, (2) feature-parity for new billing capabilities, or (3) specific platform→BASS API integration (e.g., `premium-store.provisionProduct` → `BASS.createSubscription`).

### What It Is
BASS (Billing as a Service) is the new billing system for UoU (User-of-User) subscriptions - i.e., when Wix merchants sell subscriptions to their own customers via eCom.

### BASS vs SBS

| Aspect | SBS | BASS |
|--------|-----|------|
| Users | **Wix Users** (merchants buying from Wix) | **UoU** (merchant's customers) |
| Callers | Premium Platform | eCom Platform |
| Status | Core system, stable | UoU only today |

### BASS Services (for UoU research)

| Service | Purpose |
|---------|---------|
| `billing-subscriptions` | UoU subscription lifecycle |
| `billing-invoices` | UoU invoice generation |
| `billing-orders` | UoU order management |

**Directory structure:**
```
premium-billing/
├── billing-subscriptions/  ← BASS: Subscription service
├── billing-invoices/       ← BASS: Invoice service
└── billing-orders/         ← BASS: Order service
```

---

## Backoffice Systems

### SBS UI (Legacy)
- Lives in `wix-billing/sbs-ui/`
- Internal tool for support/devs
- View subscriptions, invoices, orders
- Manual operations (refunds, adjustments)

### Billing Operations (New)
- Repo: `wix-private/billing-operations`
- Contains:
  - `billing-backoffice/` - New unified billing BO (WIP)
  - `billing-operations/` - Bulk operations system

---

## Key Integration: Cashier

Billing calls Cashier for all payment processing:

```
Checkout Submit
    → billing (validate order)
    → Cashier.chargeCard() or Cashier.createPayment()
        → Payment Provider (Stripe, PayPal, etc.)
    → billing (record transaction, create subscription)
```

**Cashier Repo:** `wix-private/cashier`

### How Billing Calls Cashier

| Caller Service | File Location | Purpose |
|----------------|---------------|---------|
| **SBS** | `sbs/sbs-core/.../CashierChargeStrategy.scala` | Charge flow types (Initial, Recurring) |
| **SBS** | `billing-common/billing-common-payments/.../CashierAdapter.scala` | Main adapter for payments |
| **BASS** | `bass/billing-invoices/.../CashierFacade.scala` | BASS → Cashier integration |
| **BASS** | `bass/billing-invoices/.../CashierEventsHandler.scala` | Handle payment events |

**Key Code Pattern:**
```scala
// CashierAdapter.scala - SBS calling Cashier
apiGatewayClient.addServiceIdentity()
ChargeForOrderRequest(orderId = request.orderId, payment = paymentWithAgreement(...))

// CashierFacade.scala - BASS calling Cashier
// Handles charges, payment events
```

**Discover Cashier integration details:**
```
octocode search: owner=wix-p, repo=premium-billing, keywords=["cashier", "ChargeForOrder"]
octocode search: owner=wix-p, repo=premium-billing, keywords=["CashierAdapter", "charge"]
```

Key Cashier services:
- `payment-services/charges/` - Charge processing
- `libpay-modules/` - Payment method handling
- `wixpay-services/merchant/` - Merchant account management

---

## Exploring the Code

### Find checkout submission logic:
```
octocode search: owner=wix-p, repo=premium-billing, keywords=["SubmitOrder", "checkout"]
```

### Find SBS subscription creation:
```
octocode search: owner=wix-p, repo=premium-billing, keywords=["createSubscription", "wix-billing"]
```

### Find BASS subscription API:
```
octocode search: owner=wix-p, repo=premium-billing, keywords=["billing-subscriptions", "proto"]
```

### View order session proto:
```
octocode read: owner=wix-p, repo=premium-billing,
  path=order-session/order-session-api/src/main/proto/com/wixpress/billing/ordersession/order-sessions.proto
```
