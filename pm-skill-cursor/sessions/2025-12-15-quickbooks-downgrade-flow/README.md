# QuickBooks Downgrade Flow Planning - Research Session

**Date:** 2025-12-15  
**Topic:** Plan downgrade flow for QuickBooks product type  
**Status:** In Progress

---

## Research Goals

1. ✅ Find QuickBooks artifact and purchase flows
2. ✅ Find references for similar downgrade/change plan flows
3. ⏳ Document findings and create plan

---

## Finding 1: QuickBooks Product Type & Purchase Flow

### QuickBooks Product Type Definition

**Location:** `wix-private/premium/premium-server/premium-quickbook/src/com/wixpress/premium/quickbook/subscriptions/v1/handlers/QuickbookOrderHandler.scala`

**Key Constants:**
- `QuickbooksProductCode: String = "QBO"`
- `PayrollProductCode: String = "PAYROLL"`
- `OrderActionType: String = "PURCHASE"`

**Source:** Found via octocode search for "QuickbooksProductCode" in wix-private repositories.

### QuickBooks Purchase Flow

**Repository:** `wix-private/premium-quickbooks`

**Key Components:**

1. **Checkout Component**
   - **Location:** `packages/premium-quickbooks-library/src/components/Checkout/Checkout.tsx`
   - Uses `@wix/checkout-components/responsive` for checkout UI
   - Integrates with QuickBooks module for BI tracking
   - Handles product selection and checkout initialization

2. **Order Creation**
   - **Location:** `packages/premium-quickbooks-library/src/components/Checkout/createOrderPage.ts`
   - **Key Function:** `createOrderPage()`
   - **Flow:**
     ```typescript
     PremiumStoreApiClient.query.createOrderPage({
       cartItems: [{
         productId,
         quantity: 1,
         cycle: { interval: { unit: IntervalUnit.MONTH, count: 1 } },
         additionalData: customEmail ? { customEmail } : undefined,
         ...subscriptionInfo, // Either newSubscription or switchContract
       }]
     })
     ```

3. **Contract Switch Support**
   - The `createOrderPage` function already supports contract switching:
     ```typescript
     if (subscriptionId) {
       subscriptionInfo = {
         switchContract: {
           existingSubscriptionId: subscriptionId,
           contractSwitchType: ContractSwitchType.CREDIT_UNUSED_PERIOD,
           msid: metaSiteId,
         },
       };
     }
     ```
   - This suggests the purchase flow already has infrastructure for product changes!

**Purchase Flow Summary:**
```
User selects QuickBooks product
    ↓
Checkout component initialized
    ↓
createOrderPage() called with productId
    ↓
premium-store.CreateOrderPage() (via PremiumStoreApiClient)
    ↓
order-session-service.CreateOrderSession()
    ↓
Checkout UI (checkout-components)
    ↓
Payment processing
    ↓
Subscription created in SBS
```

**Source:** 
- `wix-private/premium-quickbooks/packages/premium-quickbooks-library/src/components/Checkout/Checkout.tsx`
- `wix-private/premium-quickbooks/packages/premium-quickbooks-library/src/components/Checkout/createOrderPage.ts`

---

## Finding 2: Similar Downgrade/Change Plan Flows

### Product Change Service

**Service:** `premium-subscriptions-product-change`  
**Repository:** `wix-private/premium/premium-server/premium-subscriptions-product-change`

**Purpose:** Handles product migrations and changes (including downgrades)

**Key Files:**
- Proto definitions: `proto/wix/premium/product/change/v1/segment.proto`
- Service implementation: `src/com/wixpress/premium/product/change/v1/`

**API Endpoint:**
- `https://www.wixapis.com/premium-product-change/v1/premium-product-change-entity`

**Note:** The introduction.md file is a template and doesn't contain actual implementation details. Need to explore the proto files and service implementation for actual flow.

**Source:** Found via octocode search for "premium-product-change" in wix-private repositories.

### Contract Switch Pattern (Already in QuickBooks!)

**Key Discovery:** The QuickBooks `createOrderPage` function already supports contract switching with:
- `ContractSwitchType.CREDIT_UNUSED_PERIOD` - Credits unused period when switching
- `existingSubscriptionId` - Reference to current subscription

This is the same pattern used for upgrades/downgrades in other verticals!

**Source:** `wix-private/premium-quickbooks/packages/premium-quickbooks-library/src/components/Checkout/createOrderPage.ts`

### Plans Vertical - Change Plan Flow

**Reference:** Plans vertical uses similar patterns for plan changes:
- Package picker shows upgrade/downgrade options
- `premium-store.CreateOrderPage()` with `switchContract` parameter
- Proration calculations handled by platform layer

**Source:** `pm-skill-cursor/premium-research/references/plans-architecture.md`

### Google Workspace - Seat Reduction Flow

**Reference:** GWS has `reduce-seats` package that handles downgrades:
- **Location:** `wix-private/premium-mailboxes/packages/reduce-seats`
- Similar pattern: calls platform services with subscription change context

**Source:** `pm-skill-cursor/premium-research/references/verticals-architecture.md`

---

## Finding 3: Platform Layer Support

### Premium Store - Contract Switching

The platform layer (`premium-store`) supports contract switching through:
- `CreateOrderPage` API accepts `switchContract` parameter
- `ContractSwitchType` enum with options like `CREDIT_UNUSED_PERIOD`
- Handles proration and billing adjustments automatically

**Source:** Architecture docs + QuickBooks implementation already using this pattern.

### Subscription Manager

**Service:** `premium-manage-subscription`  
**Purpose:** Handles subscription lifecycle operations

**Key Operations:**
- `Cancel` - Immediate cancellation
- `AutoRenewOff/On` - Auto-renewal management
- `Assign/Unassign` - Subscription assignment

**Note:** For downgrades, typically use `CreateOrderPage` with `switchContract` rather than direct subscription manager calls.

**Source:** `pm-skill-cursor/premium-research/references/caller-callee.md`

---

## Architecture Context

### QuickBooks Vertical Status

Based on findings:
- ✅ QuickBooks uses platform layer (`premium-store`)
- ✅ Purchase flow already supports contract switching
- ✅ Uses standard checkout components
- ❓ Need to verify: Is downgrade UI implemented?

### Platform Integration

QuickBooks appears to be a **new vertical** that:
- ✅ Fully on platform (like Plans, not like Domains)
- ✅ Uses `premium-store` for offerings and order creation
- ✅ Uses standard checkout flow
- ✅ Has infrastructure for contract switching

---

## Gaps & Next Steps

### What We Found:
1. ✅ QuickBooks product type: `"QBO"` (and `"PAYROLL"`)
2. ✅ Purchase flow implementation
3. ✅ Contract switching infrastructure already exists
4. ✅ Reference patterns from other verticals

### What We Need to Verify:
1. ❓ Is there a downgrade UI/flow in QuickBooks frontend?
2. ❓ What products can users downgrade to?
3. ❓ Are there any QuickBooks-specific constraints for downgrades?
4. ❓ How does proration work for QuickBooks subscriptions?

### Recommended Next Steps:

1. **Explore QuickBooks Frontend:**
   - Search for downgrade/change plan UI components
   - Check if there's a subscription management page for QuickBooks

2. **Verify Product Catalog:**
   - Find QuickBooks product definitions
   - Understand product hierarchy (can QBO downgrade to lower tier?)

3. **Check Platform Integration:**
   - Verify `premium-store` supports QuickBooks product changes
   - Check if there are any QuickBooks-specific handlers

4. **Review Similar Implementations:**
   - Look at GWS `reduce-seats` implementation
   - Review Plans change plan flow details

---

## Code References

### QuickBooks Purchase Flow
- **Checkout Component:** `wix-private/premium-quickbooks/packages/premium-quickbooks-library/src/components/Checkout/Checkout.tsx`
- **Order Creation:** `wix-private/premium-quickbooks/packages/premium-quickbooks-library/src/components/Checkout/createOrderPage.ts`
- **Order Handler:** `wix-private/premium/premium-server/premium-quickbook/src/com/wixpress/premium/quickbook/subscriptions/v1/handlers/QuickbookOrderHandler.scala`

### Product Change Service
- **Service:** `wix-private/premium/premium-server/premium-subscriptions-product-change/`
- **Proto:** `proto/wix/premium/product/change/v1/segment.proto`

### Reference Architectures
- **Plans:** `pm-skill-cursor/premium-research/references/plans-architecture.md`
- **Verticals:** `pm-skill-cursor/premium-research/references/verticals-architecture.md`
- **Caller-Callee:** `pm-skill-cursor/premium-research/references/caller-callee.md`

---

## Questions for PM

1. **Scope:** Should downgrade allow switching to any lower-tier QuickBooks product, or specific downgrade paths?
2. **Timing:** Should downgrade be immediate or at end of billing period?
3. **Proration:** How should unused period be handled (credit vs. refund)?
4. **UI Location:** Where should users access the downgrade option (subscriptions page, QuickBooks app, etc.)?
5. **Constraints:** Are there any QuickBooks-specific business rules for downgrades?

---

## Session Status

**Completed:**
- ✅ Found QuickBooks product type and purchase flow
- ✅ Found contract switching infrastructure
- ✅ Found reference patterns from other verticals

**In Progress:**
- ⏳ Need to explore QuickBooks frontend for existing downgrade UI
- ⏳ Need to verify product catalog and downgrade paths

**Next Session:**
- Explore QuickBooks frontend components
- Review product catalog structure
- Create detailed downgrade flow plan




