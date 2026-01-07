# Bundle Apps Mapping Guide

## Overview

This guide helps you query the bundle-apps API to map which apps use which bundle implementation:
- **VOUCHER** - Apps bundled via vouchers (allocated when plan is purchased)
- **SILENT_PROVISION** - Apps bundled via site plan features/TPAs (provisioned automatically)
- **COUPON** - Apps bundled via coupons

---

## Method 1: Query Bundle-Apps API

### API Endpoint

**HTTP Endpoint:**
```
GET /_api/marketplace-api/v1/bundle-apps
```

**Service:** `com.wixpress.apps.bundleapps.bundle-apps`

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | Language code (e.g., `en`, `he`) |
| `include_deleted` | boolean | No | Include deleted apps (default: `false`) |
| `number_of_days` | integer | No | Filter by number of days (e.g., `30`) |
| `geo` | string | No | Geographic filter |

### Example Requests

#### cURL
```bash
# Basic request
curl -X GET "https://www.wix.com/_api/marketplace-api/v1/bundle-apps?lang=en" \
  -H "Authorization: <your-auth-token>" \
  -H "Cookie: <your-cookies>"

# With all parameters
curl -X GET "https://www.wix.com/_api/marketplace-api/v1/bundle-apps?lang=en&include_deleted=true&number_of_days=30" \
  -H "Authorization: <your-auth-token>" \
  -H "Cookie: <your-cookies>"
```

#### JavaScript/TypeScript (using Ambassador)
```typescript
import { BundleAppsService } from '@wix/app-market-services';

const bundleAppsService = new BundleAppsService();
const response = await bundleAppsService.request({
  methodName: 'bundleApps',
  payload: {
    lang: { value: 'en' },
    include_deleted: true,
    number_of_days: { value: 30 }
  }
});

const bundleApps = response.bundleApps?.bundleWebSolutions ?? [];
```

#### Direct HTTP (from code examples)
```typescript
const url = `/_api/marketplace-api/v1/bundle-apps?lang=${locale}&number_of_days=30`;
const res = await httpClient.get(url, { withCredentials: true });
const bundleApps = res?.data?.bundleWebSolutions ?? [];
```

### Response Structure

```typescript
{
  bundleApps: {
    bundleWebSolutions: [
      {
        appId: string,                    // App UUID
        appSavedPrice: number,            // Price saved by bundling
        group: AppGroup,                  // INSTALLED, PENDING, BUNDLE, etc.
        externalPackagePicker?: string,   // Optional external picker URL
        upgradeSuggestion: boolean,       // Whether to suggest upgrade
        publishedVersion?: string,        // Published version
        appOrigin: BundleAppOrigin,       // VOUCHER | SILENT_PROVISION | COUPON | UNKNOWN
        discountPercent?: number,         // Discount percentage
        webSolutionBase: {
          id: string,
          name: string,
          // ... other app details
        }
      }
    ]
  }
}
```

### BundleAppOrigin Values

From the proto definition:
```protobuf
enum BundleAppOrigin {
  UNKNOWN = 0;
  VOUCHER = 1;              // Voucher-based bundles
  SILENT_PROVISION = 2;     // Site plan features/TPAs
  COUPON = 3;               // Coupon-based bundles
}
```

### Mapping Logic

**To identify which apps use which method:**

```typescript
const bundleApps = response.bundleApps?.bundleWebSolutions ?? [];

const voucherApps = bundleApps.filter(
  app => app.appOrigin === BundleAppOrigin.VOUCHER
);

const silentProvisionApps = bundleApps.filter(
  app => app.appOrigin === BundleAppOrigin.SILENT_PROVISION
);

const couponApps = bundleApps.filter(
  app => app.appOrigin === BundleAppOrigin.COUPON
);
```

---

## Method 2: Query Data Tables (Trino)

### Available Tables

1. **`prod.appmarket.users_bundles_funnel`**
   - User-level bundle app data
   - Created by: `apps_benefits_dag.py`

2. **`prod.appmarket.sites_benefits_funnel`**
   - Site-level benefits data
   - Created by: `apps_benefits_dag.py`

### Example Queries

```sql
-- Explore table structure
DESCRIBE prod.appmarket.users_bundles_funnel;
DESCRIBE prod.appmarket.sites_benefits_funnel;

-- Sample data
SELECT * 
FROM prod.appmarket.users_bundles_funnel 
LIMIT 10;

-- Get bundle apps by origin type
SELECT 
  app_id,
  app_origin,  -- Check if this column exists
  COUNT(*) as user_count
FROM prod.appmarket.users_bundles_funnel
WHERE date >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY app_id, app_origin
ORDER BY user_count DESC;
```

**Note:** You'll need to explore these tables first to see what columns are available, as the exact schema may vary.

---

## Method 3: Code-Based Mapping

### VOUCHER Apps (from PlansFeatures.scala)

These apps are bundled via vouchers allocated when plan features are purchased:

- **Visitor Analytics** (`visitor_analytics_app_60_value`, `visitor_analytics_60_value`)
- **Site Booster** (`site_booster_app_60_value`)
- **Events Calendar** (`events_calender_app_50_value`)
- **Form Builder** (`form_builder_app_48_value`)
- **Professional Logo** (`professional_logo_50_value`)
- **Easy Team** (`easy_team`)

**Location:** `wix-private/premium/premium-server/premium-plans-modules/premium-plans-core/src/main/scala/com/wixpress/premium/plans/features/PlansFeatures.scala`

**Mapping:** `featureToVouchersMapping` map

### SILENT_PROVISION Apps (from PlansFeatures.scala)

These apps are bundled via TPAs (Third Party Apps) provisioned as part of plan features:

- **Online Payments apps** (Restaurants, Hotels, Bookings)
- **Video apps** (various tiers: `video_half_hr`, `video_1hr`, `video_2hr`, `video_5hr`, `video_10hr`, `video_30hr`)
- **Ascend apps** (`ascend_basic`, `ascend_pro`, `ascend_unlimited`)
- **Shoutout apps** (`so_basic`, `so_business`, `so_vip`)
- **Video Maker apps** (`video_maker_2`, `video_maker_4`, `video_maker_6`, `video_maker_8`)
- **Stores apps** (`stores_basic`, `stores_bronze`, `stores_silver`, `stores_gold`)
- **Other TPAs**: Kudobuzz, Modalyst, Shippo, Smile.io, Contributors, Legal Texts, Trusted Shops, Hotel Runner, etc.

**Location:** Same `PlansFeatures.scala` file

**Mapping:** `featureToTpasMapping` map

---

## Mapping Template

Use this template to document your findings:

```markdown
## Bundle Apps Mapping

| App Name | App ID | Bundle Type | Implementation | Notes |
|----------|--------|-------------|----------------|-------|
| Visitor Analytics | <uuid> | VOUCHER | Voucher allocator | From `visitor_analytics_app_60_value` feature |
| Site Booster | <uuid> | VOUCHER | Voucher allocator | From `site_booster_app_60_value` feature |
| Events Calendar | <uuid> | VOUCHER | Voucher allocator | From `events_calender_app_50_value` feature |
| Restaurants | <uuid> | SILENT_PROVISION | TPA provision | From `online_payments` feature |
| Video (Basic) | <uuid> | SILENT_PROVISION | TPA provision | From `video_2hr` feature |
| ... | ... | ... | ... | ... |
```

---

## Implementation Details

### How VOUCHER Bundles Work

1. User purchases a plan with a feature (e.g., `visitor_analytics_app_60_value`)
2. `PlansFeatures.scala` maps the feature to a voucher allocator
3. Voucher is allocated during plan purchase
4. `ManagedAppsService.getVoucherApps()` retrieves apps eligible for vouchers
5. Apps are marked with `BundleAppOrigin.VOUCHER`

**Code Location:** `wix-private/devcenter/marketplace/src/main/scala/com/wixpress/devcenter/market/managedApps/service/ManagedAppsService.scala`

### How SILENT_PROVISION Bundles Work

1. User purchases a plan with a feature (e.g., `online_payments`)
2. `PlansFeatures.scala` maps the feature to TPAs (Third Party Apps)
3. TPAs are automatically provisioned when plan is purchased
4. `ManagedAppsService.getPlanBundleApps()` retrieves TPAs from user's plan
5. Apps are marked with `BundleAppOrigin.SILENT_PROVISION`

**Code Location:** Same `ManagedAppsService.scala` file

---

## Package Picker Hiding

**Status:** Still investigating where premium hides apps from package picker.

**Likely locations:**
- `wix-private/premium-purchase-plan` (package picker components)
- `wix-private/premium` (offering service)
- `wix-private/premium-store` (store service)

**Next steps:**
1. Search for "hide" or "exclude" in package picker code
2. Check offering service for filtering logic
3. Review premium-store for app visibility rules

---

## Benefits vs Bundles

**Benefits** (`AppBenefitsService`) combines:
- "Real benefits" from market sections
- "Bundle apps benefits" from bundle apps service

**Code Location:** `wix-private/app-market-client/packages/app-market-services/src/services/app-benefits/app-benefits.service.ts`

---

## Next Steps

1. **Query the API** using one of the methods above
2. **Map each app** to its bundle type (VOUCHER vs SILENT_PROVISION)
3. **Document findings** using the mapping template
4. **Investigate package picker hiding** logic separately
5. **Cross-reference** with `PlansFeatures.scala` to verify mappings

---

## References

- **Bundle Apps Service:** `wix-private/devcenter/dev-center/bundle-apps/`
- **Managed Apps Service:** `wix-private/devcenter/marketplace/src/main/scala/com/wixpress/devcenter/market/managedApps/service/ManagedAppsService.scala`
- **Plans Features:** `wix-private/premium/premium-server/premium-plans-modules/premium-plans-core/src/main/scala/com/wixpress/premium/plans/features/PlansFeatures.scala`
- **Data Pipeline:** `wix-private/wix-data-dev-secure/appmarket/subscriptions/apps_benefits/dags/apps_benefits_dag.py`


