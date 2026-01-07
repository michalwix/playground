# Domains Vertical Architecture

> **Main Repos:**
> - Backend: `wix-private/premium` → `domains/` (20+ services)
> - Frontend: `wix-private/premium-domains`, `wix-private/my-domains`, `wix-private/connect-domain`
>
> **Note:** This architecture reflects early 2026 state.

## Overview

The Domains vertical handles domain search, purchase, registration, DNS management, and transfers.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DOMAINS VERTICAL                                     │
│                                                                             │
│  FRONTEND                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ premium-domains │  │   my-domains    │  │  connect-domain │            │
│  │  (purchase)     │  │  (management)   │  │   (wizard)      │            │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘            │
│           └────────────────────┼────────────────────┘                      │
│                                │                                           │
│  BACKEND (wix-private/premium/domains/)                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │  │
│  │  │domain-store│ │domain-search│ │domain-dns  │ │ domain-   │       │  │
│  │  │  (main)    │ │(availability)│ │(management)│ │ registrar │       │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │  │
│  │  │domain-     │ │domain-     │ │domain-     │ │  my-       │       │  │
│  │  │ delivery   │ │transfer-in │ │transfer-out│ │ domains    │       │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Backend Services

**Location:** `wix-private/premium/domains/`

### Core Services

| Service | Path | Purpose |
|---------|------|---------|
| **domain-store** | `domains/domain-store/` | Main purchase & pricing service |
| **domain-search** | `domains/domain-search/` | Domain availability search |
| **domain-registrar** | `domains/domain-registrar/` | Registrar integration |
| **domain-delivery** | `domains/domain-delivery/` | Domain provisioning |
| **domain-dns** | `domains/domain-dns/` | DNS record management |
| **my-domains** | `domains/my-domains/` | User domains aggregation |
| **user-domains** | `domains/user-domains/` | User domain data |

### Transfer Services

| Service | Purpose |
|---------|---------|
| `domain-transfer-in` | Inbound domain transfers |
| `domain-transfer-out` | Outbound domain transfers |
| `domain-confirmation-process` | Transfer confirmations |

### Support Services

| Service | Purpose |
|---------|---------|
| `domain-tld` | TLD (top-level domain) management |
| `domain-sku` | SKU/pricing management |
| `domain-lookup` | Domain lookup/WHOIS |
| `domain-assignment` | Domain-to-site assignment |
| `domain-connected` | Connected domain tracking |
| `domain-registered` | Registered domain management |
| `domain-notifications` | Domain notifications |
| `domain-audit` | Audit logging |
| `domain-propagation` | DNS propagation checking |
| `premium-ssl-modules` | SSL certificate management |

### DNS Services

| Service | Purpose |
|---------|---------|
| `dns` | Core DNS service |
| `bind-dns` | BIND DNS integration |
| `unbound-dns` | Unbound DNS integration |
| `dnsyo-scala` | DNS testing |

---

## domain-store (Main Service)

### Structure

```
domains/domain-store/
├── domain-store-api/              ← Public API
│   └── src/main/proto/            ← Proto definitions
├── domain-store-internal-api/     ← Internal API
│   └── src/main/proto/
└── service/                       ← Service implementation
    └── src/
        ├── main/scala/.../DomainStoreService.scala
        └── e2e/
```

### Key APIs

| API | Purpose |
|-----|---------|
| `CreateOrderSession` | Create domain purchase session |
| `GetDomainPricing` | Get domain pricing |
| `ListEligibleCoupons` | Get available coupons |
| `CheckAvailability` | Check domain availability |

### Calls To

| Callee | Purpose |
|--------|---------|
| order-session-service | Create checkout session |
| domain-delivery | Provision domains |
| coupons-core | Coupon validation |
| billing-gateway | Billing operations |
| domain-sku | Pricing data |
| domain-tld | TLD configurations |

### Called By

| Caller | Purpose |
|--------|---------|
| premium-domains (frontend) | Domain purchase |
| domain-delivery | Store operations |
| domain-registrar | Registration flows |

**Key Integration Code:**
```scala
// DomainStoreService.scala
orderSessionServiceV2.createOrderSession(
  CreateOrderSessionRequest(Some(orderSession))
)
```

---

## Frontend Repos

### premium-domains
**Repo:** `wix-private/premium-domains`

Main domain purchase frontend.

#### Packages

| Package | Purpose |
|---------|---------|
| `domains-funnel` | Main purchase funnel |
| `domains-purchase-app` | Purchase application |
| `domains-purchase-bm` | BM purchase flow |
| `domains-search-suite` | Domain search experience |
| `domains-search-gate` | Search entry point |
| `core-domain-search` | Core search logic |
| `domain-search-common` | Shared search utilities |
| `domains-upgrade` | Domain upgrade flows |
| `domains-concierge` | Concierge experience |
| `domains-static` | Static pages |
| `domains-serverless-api` | Serverless API layer |
| `domains-serverless-services` | Serverless services |
| `domains-storefront-serverless` | Storefront serverless |

#### Key Serverless Services

| Service | Purpose |
|---------|---------|
| `EligibilityCart` | Cart eligibility checks |
| `display_price` | Price display service |

### my-domains
**Repo:** `wix-private/my-domains`

Domain management pages.

### connect-domain
**Repo:** `wix-private/connect-domain`

Domain connection wizard.

---

## Caller-Callee: Frontend → Backend

### premium-domains → Backend

| Backend Service | Ambassador Package | Purpose |
|-----------------|-------------------|---------|
| domain-store | `@wix/ambassador-domain-store` | Pricing, purchase |
| domain-search | `@wix/ambassador-domain-search` | Availability |
| domains-tld | `@wix/ambassador-domains-tld-v1-tld` | TLD info |
| premium-domains-price | `@wix/ambassador-premium-domains-v1-domain-price` | Pricing |
| premium-domains-availability | `@wix/ambassador-premium-domains-v2-availability` | Availability |
| domains-mydomains | `@wix/ambassador-domains-mydomains-v1-domain` | My domains |
| billing-coupon | `@wix/ambassador-billing-v1-coupon` | Coupons |
| premium-my-domains | `@wix/ambassador-premium-my-domains` | My domains |
| metasite-api | `@wix/ambassador-metasite-api-v1-meta-site` | Site info |

**Key Code Locations:**
```typescript
// packages/domains-serverless-services/src/services/display_price/display_price.service.ts
import { DomainStore } from '@wix/ambassador-domain-store/rpc';
import { getSite } from '@wix/ambassador-domains-mydomains-v1-domain/rpc';
import { listTlds } from '@wix/ambassador-domains-tld-v1-tld/rpc';
import { listDomainPrice } from '@wix/ambassador-premium-domains-v1-domain-price/rpc';

// packages/domains-serverless-services/src/EligibilityCart/sharedEligiblityCheck.ts
import { DomainStore } from '@wix/ambassador-domain-store/rpc';
import { PremiumMyDomains } from '@wix/ambassador-premium-my-domains/rpc';
```

---

## Purchase Flow

```
User clicks "Get a Domain"
    │
    ▼
domains-funnel (premium-domains)
    │
    ▼
domains-search-suite
    ├── domain-search.CheckAvailability()
    └── domain-store.GetDomainPricing()
    │
    ▼
User selects domain
    │
    ▼
domain-store.CreateOrderSession()
    │
    ▼
order-session-service.CreateOrderSession()
    │
    ▼
Checkout (checkout-view)
    │
    ▼
Payment
    │
    ▼
domain-delivery.ProvisionDomain()
    ├── domain-registrar (register with registrar)
    └── domain-dns (configure DNS)
    │
    ▼
Domain connected to site
```

---

## DNS Management Flow

```
User in My Domains
    │
    ▼
my-domains / premium-domains
    │
    ▼
domain-dns.GetRecords()
    │
    ▼
User modifies DNS
    │
    ▼
domain-dns.UpdateRecords()
    │
    ▼
domain-propagation.CheckPropagation()
```

---

## Transfer Flow

### Transfer In
```
User initiates transfer
    │
    ▼
domain-transfer-in.InitiateTransfer()
    │
    ▼
domain-confirmation-process
    │
    ▼
domain-registrar (execute transfer)
    │
    ▼
domain-registered (record)
```

### Transfer Out
```
User requests transfer out
    │
    ▼
domain-transfer-out.InitiateTransfer()
    │
    ▼
Provide auth code
    │
    ▼
domain-registrar (release)
```

---

## Exploring the Code

### Find domain-store API:
```
octocode search: owner=wix-private, repo=premium, keywords=["domain-store", "proto"], path=domains
```

### Find domain search service:
```
octocode view: owner=wix-private, repo=premium, path=domains/domain-search
```

### Find frontend purchase flow:
```
octocode search: owner=wix-private, repo=premium-domains, keywords=["domains-funnel", "purchase"]
```

### Find serverless services:
```
octocode view: owner=wix-private, repo=premium-domains, path=packages/domains-serverless-services/src
```

### Find domain-store callers:
```
octocode search: keywords=["ambassador-domain-store"] match="file"
```
