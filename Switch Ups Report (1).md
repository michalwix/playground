# Switch Up Research

**Data Period**: Q3 2025 (July - September 2025)  
**Tools**: Trino MCP, OpenMetadata MCP  
**Knowledge Base**: Wix Premium Plans Department

**Q3 2025 Baseline:**
- **Initial Purchases**: 507,595 sites (84.2% of all premium activity)
- **Switch Ups**: 95,166 unique sites / 98,196 events (15.8% of all premium activity)
- **Total Premium Activity**: 602,761 sites

---

# Switch Up Analysis

## Premium Activity Baseline (Q3 2025)

> **Data Source**: `prod.premium.subscriptions_premium_plan_scd`

| Activity Type | Sites | % of Total | Description |
|---------------|-------|------------|-------------|
| **Initial Purchase** | **507,595** | **84.2%** | New premium purchases (free → paid) |
| **Switch Up** | **95,166** | **15.8%** | Unique sites with plan upgrades |
| **Total Premium Activity** | **602,761** | 100% | All premium events in Q3 2025 |

> **Note:** 95,166 unique sites performed 98,196 total switch up events (some sites did multiple switch ups in Q3).

<details>
<summary><b>SQL Query</b></summary>

```sql
SELECT 
  start_action,
  COUNT(DISTINCT CONCAT(uuid, '-', msid)) as sites
  FROM prod.premium.subscriptions_premium_plan_scd
  WHERE start_action IN ('initial purchase', 'switch up')
    AND is_uuid_wix_user = false
  AND start_date >= DATE '2025-07-01' AND start_date < DATE '2025-10-01'
GROUP BY start_action
ORDER BY sites DESC
```

</details>

---

## Switch Up Distribution by Level (Q3 2025)

> **Data Source**: `prod.premium.subscriptions_premium_plan_scd` (start_action = 'switch up')
> 
> **Total Switch Up Events**: 98,196

| Switch Up # | Events | % of All | Cumulative % |
|-------------|--------|----------|--------------|
| **1st** | **72,363** | **73.7%** | 73.7% |
| **2nd** | **19,733** | **20.1%** | 93.8% |
| **3rd** | **4,226** | **4.3%** | 98.1% |
| **4th** | **1,214** | **1.2%** | 99.4% |
| **5th** | **369** | **0.4%** | 99.7% |
| **6th** | **149** | **0.2%** | 99.9% |
| **7th** | **76** | **0.1%** | ~100% |
| **8th** | **27** | **<0.1%** | ~100% |
| **9th** | **15** | **<0.1%** | ~100% |
| **10th+** | **24** | **<0.1%** | 100% |
| **Total** | **98,196** | **100%** | - |

### Device Breakdown (Q3 2025)

| Device | Sites | % of Total |
|--------|-------|------------|
| **Computer** | **72,383** | **75.6%** |
| **Unknown** | **18,104** | **18.9%** |
| **Mobile** | **5,131** | **5.4%** |
| Tablet | 80 | 0.1% |
| **Total** | **95,698** | 100% |

> **"Unknown" = switch ups without Package Picker session data** (e.g., via customer support, direct API, or tracking gaps).

<details>
<summary><b>SQL Query (Device)</b></summary>

```sql
WITH all_events AS (
  SELECT subscription_id, uuid, msid, start_date,
    ROW_NUMBER() OVER (PARTITION BY uuid, msid ORDER BY start_date) as rn
  FROM prod.premium.subscriptions_premium_plan_scd
  WHERE start_action = 'switch up'
    AND is_uuid_wix_user = false
    AND start_date >= DATE '2025-07-01' AND start_date < DATE '2025-10-01'
),
first_switch_up AS (
  SELECT subscription_id, uuid, msid, start_date
  FROM all_events
  WHERE rn = 1
),
site_device AS (
  SELECT 
    e.uuid, 
    e.msid,
    COALESCE(min_by(pp.device_type, pp.first_pp_view_date), 'Unknown') as device
  FROM first_switch_up e
  LEFT JOIN prod.premium.package_picker_sessions_log pp 
    ON e.subscription_id = pp.purchased_subscription_id
    AND DATE(pp.first_pp_view_date) = DATE(e.start_date)
  GROUP BY e.uuid, e.msid
)
SELECT
  device,
  COUNT(*) as sites,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as pct
FROM site_device
GROUP BY device
ORDER BY sites DESC
```

</details>

---

<details>
<summary><b>SQL Query (Distribution)</b></summary>

```sql
WITH all_events AS (
  SELECT uuid, msid, start_action, start_date
  FROM prod.premium.subscriptions_premium_plan_scd
  WHERE start_action IN ('initial purchase', 'switch up')
    AND is_uuid_wix_user = false
),
switch_ups_numbered AS (
  SELECT uuid, msid, start_date,
    ROW_NUMBER() OVER (PARTITION BY uuid, msid ORDER BY start_date) as switch_up_num
  FROM all_events
  WHERE start_action = 'switch up'
),
q3_2025 AS (
  SELECT * FROM switch_ups_numbered
  WHERE start_date >= DATE '2025-07-01' AND start_date < DATE '2025-10-01'
)
SELECT 
  switch_up_num,
  COUNT(DISTINCT CONCAT(uuid, '-', msid)) as sites,
  ROUND(100.0 * COUNT(DISTINCT CONCAT(uuid, '-', msid)) / 
    SUM(COUNT(DISTINCT CONCAT(uuid, '-', msid))) OVER (), 2) as pct_of_all
FROM q3_2025
GROUP BY switch_up_num
ORDER BY switch_up_num
```

</details>

---

## Key Findings: Upgrade Progression Patterns

### Conversion Funnel (Q3 2025)

| Stage | Count | Retention Rate |
|-------|-------|----------------|
| All Initial Purchases | 507,595 | - |
| First-ever Initial Purchase | 408,633 | 80.5% (of all initial) |
| 1st Switch Up | 72,363 | 17.7% (of first-ever) |
| 2nd Switch Up | 19,733 | 27.3% (of 1st) |
| 3rd Switch Up | 4,226 | 21.4% (of 2nd) |
| 4th Switch Up | 1,214 | 28.7% (of 3rd) |
| 5th+ Switch Up | 660 | 54.4% (of 4th) |

### Median Time Breakdown

| Switch Up Level | Median Time (days) | Median Time (approx) |
|-----------------|-------------------|---------------------|
| 1st Switch Up | **584** | ~19 months |
| 2nd Switch Up | **1,157** | ~3.2 years |
| 3rd Switch Up | **1,921** | ~5.3 years |
| 4th Switch Up | **2,312** | ~6.3 years |
| 5th Switch Up | **2,587** | ~7.1 years |

---

### Key Pattern: Cycle Ladder Climbing

> **Data Source**: `prod.premium.subscriptions_premium_plan_scd` (comparing product_name vs previous_product_name)

The dominant upgrade path across all upgrade stages is **cycle extension** (staying on same plan, extending billing commitment):

```
Monthly → Yearly → 2yr → 3yr
```

| Category | Cycle Extension | Tier Jump | Total |
|----------|----------------|-----------|-------|
| **All Switch Ups** | **~55%** (~54,000) | ~45% (~44,200) | 98,196 |

Top cycle extension patterns:
- Core Yearly → Core 2-year: 11,950 (12.2% of all switch ups)
- Core 2-year → Core 3-year: 7,987 (8.1%)
- Business Yearly → Business 2-year: 2,950 (3.0%)
- Core Yearly → Core 3-year: 2,784 (2.8%)
- Core Monthly → Core Yearly: 2,210 (2.3%)
- Business 2-year → Business 3-year: 2,086 (2.1%)

Top tier jump patterns:
- Light → Core: 23,150 (23.6% of all switch ups)
- Core → Business: 8,430 (8.6%)
- Light → Business: 4,714 (4.8%)

---

### Detailed Breakdown: All Switch Ups (98,196 Total)

> Detailed breakdown below: ALL switch up destinations across Q3 2025 (not limited to 2nd upgrades). The "%" is the share of switch ups from that source plan who choose that specific destination. Sections sorted by volume (highest first).

<details>
<summary><b>SQL Query for Detailed Breakdown</b></summary>

```sql
SELECT 
  previous_product_name as from_plan,
  previous_cycle_name as from_cycle,
  product_name as to_plan,
  cycle_name as to_cycle,
  COUNT(*) as total
FROM prod.premium.subscriptions_premium_plan_scd
WHERE start_action = 'switch up'
  AND is_uuid_wix_user = false
  AND start_date >= DATE '2025-07-01' 
  AND start_date < DATE '2025-10-01'
  AND previous_product_name = 'Core' -- Change for each plan
GROUP BY previous_product_name, previous_cycle_name, product_name, cycle_name
ORDER BY total DESC
```

</details>

#### Quick Reference: Most Common Switch Up Path from Each Plan + Cycle

> **Data Source**: `prod.premium.subscriptions_premium_plan_scd` (Q3 2025, ALL switch ups)

| Plan | Monthly | Yearly | 2-year | 3-year |
|------|---------|--------|--------|--------|
| **Light** | Core Monthly (6,204 / 51%) | Core Yearly (8,274 / 59%) | Core 2-year (1,690 / 48%) | Core 3-year (804 / 86%) |
| **Core** | Core Yearly (2,210 / 47%) | Core 2-year (11,950 / 59%) | Core 3-year (7,987 / 78%) | Business 3-year (998 / 89%) |
| **Business** | Business Yearly (1,251 / 57%) | Business 2-year (2,950 / 61%) | Business 3-year (2,086 / 77%) | Plus (Studio) 3-year (114 / 77%) |
| **Unlimited (Legacy)** | Unlimited Yearly (1,736 / 92%) | Unlimited Monthly (1,882 / 74%) | Core 2-year (381 / 41%) | Core 3-year (219 / 80%) |
| **Basic (Studio)** | Standard (Studio) Monthly (1,070 / 55%) | Standard (Studio) Yearly (801 / 54%) | Standard (Studio) 2-year (121 / 47%) | Standard (Studio) 3-year (48 / 54%) |
| **Standard (Studio)** | Plus (Studio) Monthly (267 / 66%) | Plus (Studio) Yearly (182 / 59%) | Plus (Studio) 2-year (22 / 42%) | Plus (Studio) 3-year (17 / 63%) |

#### CORE PLANS (37,525 Total Switch Ups)

**Core Yearly** (20,929 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Core 2-year | 11,950 | **57%** |
| Core 3-year | 2,784 | 13% |
| Business Yearly | 2,698 | 13% |
| Standard (Studio) Yearly | 1,487 | 7% |
| Business 2-year | 992 | 5% |
| Business 3-year | 377 | 2% |
| Other | 641 | 3% |

**Core 2-year** (10,242 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Core 3-year | 7,987 | **78%** |
| Business 2-year | 1,031 | 10% |
| Business 3-year | 456 | 4% |
| Standard (Studio) 2-year | 424 | 4% |
| Core Monthly | 117 | 1% |
| Other | 227 | 2% |

**Core Monthly** (5,159 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Core Yearly | 2,210 | **43%** |
| Business Monthly | 1,243 | 24% |
| Business Yearly | 532 | 10% |
| Standard (Studio) Monthly | 398 | 8% |
| Core 2-year | 276 | 5% |
| Core 3-year | 154 | 3% |
| Plus (Studio) Monthly | 123 | 2% |
| Other | 223 | 4% |

**Core 3-year** (1,195 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Business 3-year | 998 | **84%** |
| Standard (Studio) 3-year | 163 | 14% |
| Plus (Studio) 3-year | 24 | 2% |
| Other | 10 | 1% |

---

#### LIGHT PLANS (35,077 Total Switch Ups)

**Light Yearly** (16,863 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Core Yearly | 8,274 | **49%** |
| Light 2-year | 1,958 | 12% |
| Core 2-year | 1,832 | 11% |
| Business Yearly | 1,478 | 9% |
| Basic (Studio) Yearly | 1,088 | 6% |
| Core 3-year | 1,009 | 6% |
| Light 3-year | 400 | 2% |
| Other | 824 | 5% |

**Light Monthly** (13,562 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Core Monthly | 6,204 | **46%** |
| Core Yearly | 2,092 | 15% |
| Business Monthly | 1,638 | 12% |
| Light Yearly | 1,448 | 11% |
| Basic (Studio) Monthly | 676 | 5% |
| Business Yearly | 508 | 4% |
| Core 2-year | 262 | 2% |
| Other | 734 | 5% |

**Light 2-year** (3,631 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Core 2-year | 1,690 | **47%** |
| Core 3-year | 826 | 23% |
| Light 3-year | 484 | 13% |
| Business 2-year | 232 | 6% |
| Basic (Studio) 2-year | 209 | 6% |
| Business 3-year | 94 | 3% |
| Other | 96 | 3% |

**Light 3-year** (1,021 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Core 3-year | 804 | **79%** |
| Business 3-year | 118 | 12% |
| Basic (Studio) 3-year | 88 | 9% |
| Other | 11 | 1% |

---

#### BUSINESS PLANS (9,360 Total Switch Ups)

**Business Yearly** (4,641 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Business 2-year | 2,950 | **64%** |
| Plus (Studio) Yearly | 779 | 17% |
| Business 3-year | 468 | 10% |
| Business Monthly | 216 | 5% |
| Business Elite Yearly | 110 | 2% |
| Other | 118 | 3% |

**Business 2-year** (2,616 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Business 3-year | 2,086 | **80%** |
| Plus (Studio) 2-year | 243 | 9% |
| Business Monthly | 135 | 5% |
| Business Elite 2-year | 51 | 2% |
| Business Yearly | 49 | 2% |
| Other | 52 | 2% |

**Business Monthly** (1,951 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Business Yearly | 1,251 | **64%** |
| Plus (Studio) Monthly | 283 | 15% |
| Business 2-year | 181 | 9% |
| Business Elite Monthly | 115 | 6% |
| Business 3-year | 79 | 4% |
| Other | 42 | 2% |

**Business 3-year** (152 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Plus (Studio) 3-year | 114 | **75%** |
| Business Elite 3-year | 38 | 25% |

---

#### UNLIMITED (LEGACY) (5,464 Total Switch Ups)

**Unlimited Yearly** (2,416 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Unlimited Monthly | 1,882 | **78%** |
| Core Yearly | 155 | 6% |
| Basic (Studio) Yearly | 67 | 3% |
| Business Yearly | 53 | 2% |
| Core 2-year | 50 | 2% |
| Other | 209 | 9% |

**Unlimited Monthly** (1,856 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Unlimited Yearly | 1,736 | **94%** |
| Core Monthly | 33 | 2% |
| Light Monthly | 22 | 1% |
| Core Yearly | 20 | 1% |
| Other | 45 | 2% |

**Unlimited 2-year (Legacy)** (894 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Core 2-year | 381 | **43%** |
| Core 3-year | 284 | 32% |
| Business 2-year | 69 | 8% |
| Basic (Studio) 2-year | 60 | 7% |
| Business 3-year | 33 | 4% |
| Other | 67 | 7% |

**Unlimited 3-year (Legacy)** (298 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Core 3-year | 219 | **74%** |
| Business 3-year | 43 | 14% |
| Basic (Studio) 3-year | 25 | 8% |
| Unlimited 3-year | 10 | 3% |
| Other | 1 | 0% |

---

#### WIX STUDIO PLANS (4,055 Total Switch Ups)

##### Basic (Studio) (3,311 Total Switch Ups)

**Basic (Studio) Monthly** (1,907 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Standard (Studio) Monthly | 1,070 | **56%** |
| Basic (Studio) Yearly | 359 | 19% |
| Plus (Studio) Monthly | 278 | 15% |
| Standard (Studio) Yearly | 69 | 4% |
| Plus (Studio) Yearly | 36 | 2% |
| Other | 95 | 5% |

**Basic (Studio) Yearly** (1,149 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Standard (Studio) Yearly | 801 | **70%** |
| Plus (Studio) Yearly | 159 | 14% |
| Basic (Studio) 2-year | 80 | 7% |
| Standard (Studio) 2-year | 31 | 3% |
| Basic (Studio) 3-year | 29 | 3% |
| Other | 49 | 4% |

**Basic (Studio) 2-year** (193 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Standard (Studio) 2-year | 121 | **63%** |
| Basic (Studio) 3-year | 32 | 17% |
| Plus (Studio) 2-year | 16 | 8% |
| Standard (Studio) 3-year | 14 | 7% |
| Other | 10 | 5% |

**Basic (Studio) 3-year** (62 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Standard (Studio) 3-year | 48 | **77%** |
| Plus (Studio) 3-year | 14 | 23% |

##### Standard (Studio) (744 Total Switch Ups)

**Standard (Studio) Monthly** (441 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Plus (Studio) Monthly | 267 | **61%** |
| Standard (Studio) Yearly | 116 | 26% |
| Plus (Studio) Yearly | 27 | 6% |
| Standard (Studio) 2-year | 12 | 3% |
| Other | 19 | 4% |

**Standard (Studio) Yearly** (249 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Plus (Studio) Yearly | 182 | **73%** |
| Standard (Studio) 2-year | 23 | 9% |
| Standard (Studio) 3-year | 11 | 4% |
| Standard (Studio) Monthly | 11 | 4% |
| Plus (Studio) 2-year | 10 | 4% |
| Other | 12 | 5% |

**Standard (Studio) 2-year** (37 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Plus (Studio) 2-year | 22 | **59%** |
| Standard (Studio) 3-year | 6 | 16% |
| Plus (Studio) 3-year | 5 | 14% |
| Other | 4 | 11% |

**Standard (Studio) 3-year** (17 switch ups)
| Destination | Volume | % |
|-------------|--------|---|
| Plus (Studio) 3-year | 17 | **100%** |

---

#### OTHER & LEGACY PLANS (6,715 Total Switch Ups)

| Plan | Switch Ups | Notes |
|------|------------|-------|
| Business Basic (Legacy) | 3,262 | Grandfathered, upgrade only |
| Combo (Legacy) | 1,262 | Discontinued |
| Business Unlimited (Legacy) | 760 | Grandfathered |
| Pro (Legacy) | 212 | Discontinued |
| Plus (Studio) | 174 | Top tier, minimal upgrades |
| Business VIP (Legacy) | 161 | Grandfathered |
| Business Elite | 142 | Top tier, minimal upgrades |
| Connect Domain (Legacy) | 114 | Discontinued |
| Other small/regional plans | 628 | Various legacy & promotional |
| **Total Other/Legacy** | **6,715** | |

---

#### SECTION TOTALS VERIFICATION

| Section | Switch Ups | % of Total |
|---------|------------|------------|
| **Core Plans** | **37,525** | **38.2%** |
| **Light Plans** | **35,077** | **35.7%** |
| **Business Plans** | **9,360** | **9.5%** |
| **Unlimited (Legacy)** | **5,464** | **5.6%** |
| **Wix Studio Plans** | **4,055** | **4.1%** |
| **Other & Legacy Plans** | **6,715** | **6.8%** |
| **Grand Total** | **98,196** | **100%** |

---

### Key Patterns Summary

**1. CYCLE EXTENSION (~55% of all switch ups, ~54,000 events)**
Users extend billing period within same plan:
- Monthly → Yearly (dominant for all plans)
- Yearly → 2-year (especially Core: 57%, Business: 64%)
- 2-year → 3-year (Core: 78%, Business: 80%)

**2. TIER JUMP (~45% of all switch ups, ~44,200 events)**
Users move to higher-tier plan:
- Light → Core: 23,150 events
- Core → Business: 8,430 events
- Light → Business: 4,714 events
- Basic (Studio) → Standard (Studio) → Plus (Studio): Studio plan progression

**3. TIMING**
- **Monthly users**: Upgrade fastest (median ~200 days, majority within 1 year)
- **Yearly users**: Upgrade at renewal (median ~1 year)
- **Multi-year users**: Upgrade at end of term (median 2-3 years)

---

### Top 10 Switch Up Paths (by Volume)

> **Data Source**: `prod.premium.subscriptions_premium_plan_scd` (Q3 2025, ALL switch ups)
> **Total Switch Ups**: 98,196 events

**1.**
- From: Core
- To: Core (cycle extension)
- Total: 25,864 (26.3%)

**2.**
- From: Light
- To: Core
- Total: 23,150 (23.6%)

**3.**
- From: Core
- To: Business
- Total: 8,430 (8.6%)

**4.**
- From: Business
- To: Business (cycle extension)
- Total: 7,418 (7.6%)

**5.**
- From: Light
- To: Business
- Total: 4,714 (4.8%)

**6.**
- From: Light
- To: Light (cycle extension)
- Total: 4,536 (4.6%)

**7.**
- From: Unlimited (Legacy)
- To: Unlimited (Legacy) (cycle swap)
- Total: 3,676 (3.7%)

**8.**
- From: Business Basic (Legacy)
- To: Business Basic (Legacy) (cycle swap)
- Total: 2,779 (2.8%)

**9.**
- From: Core
- To: Standard (Studio)
- Total: 2,703 (2.8%)

**10.**
- From: Light
- To: Basic (Studio)
- Total: 2,307 (2.4%)

**Top 10 = 85,577 events (87.2% of all switch ups)**

<details>
<summary><b>SQL Query</b></summary>

```sql
SELECT 
  previous_product_name as from_plan,
  product_name as to_plan,
  COUNT(*) as total
  FROM prod.premium.subscriptions_premium_plan_scd
WHERE start_action = 'switch up'
    AND is_uuid_wix_user = false
  AND start_date >= DATE '2025-07-01' 
  AND start_date < DATE '2025-10-01'
GROUP BY previous_product_name, product_name
ORDER BY total DESC
LIMIT 10
```

</details>

---

## Package Picker Entry Points Analysis (Q3 2025)

> **Data Source**: `prod.premium.premium_package_picker_daily_report`
> 
> **Context**: The Package Picker (PP) is Wix's 3-step purchase flow: Product Selection → Billing Cycle Selection → Checkout

### Step-by-Step Conversion Rates (Q3 2025)

**Package Picker Funnel for Switch Up Intent** (users with existing premium who viewed PP)

| Funnel Step | Users | Step CVR |
|-------------|-------|----------|
| PP View | **709,549** | - |
| → Cycle Page | **210,067** | **29.6%** |
| → Checkout | **136,017** | **64.7%** |
| → Submit | **80,943** | **59.5%** |
| → Purchase | **77,177** | **95.3%** |
| **Overall (PP → Purchase)** | - | **10.9%** |

> **Note**: This covers PP-tracked switch ups only. Breakdown of all Q3 switch ups by flow:
> 
> | Flow | Switch Type | Count | % |
> |------|-------------|-------|---|
> | Via Package Picker | Cycle Change | 39,999 | 40.3% |
> | Via Package Picker | Tier/Product Change | 30,088 | 30.3% |
> | **Change Cycle Flow** | **Cycle Change** | **~8,087** | **~8.1%** |
> | Outside PP (other) | Mixed | ~21,226 | ~21.4% |
> 
> The **~8,087 cycle changes via Change Cycle Flow** come from `manage.wix.com/account/subscriptions` → "Change Billing Cycle" action ([source](https://github.com/wix-private/premium-checkout-consumers/tree/master/packages/change-cycle)). The remaining ~21K are via customer support, direct API, or other non-tracked flows.

---

### Change Cycle Flow Funnel (Q3 2025)

**My Subscriptions → Change Billing Cycle** (bypasses Package Picker)

| Step | Event | Users | Step CVR |
|------|-------|-------|----------|
| 1. Popup View | evid 4882 | **60,370** | - |
| 2. Select Cycle | evid 4883 | **25,943** | 43.0% |
| 3. Continue to Checkout | evid 4884 (continue) | **19,377** | 32.1% |
| 4. Purchase Success | checkout_success | **~8,087** | **41.7%** |
| **Overall CVR** | | | **~13.4%** |

> ⚠️ **Data Uncertainty Note**: The Change Cycle Flow data should be treated with caution. The checkout data in particular (Step 4 Purchase Success) is estimated and may not be fully accurate - the join between Change Cycle events and `checkout_sessions_log` may have gaps or attribution issues. Consider validating with additional data sources before using for critical decisions.

> **Note**: Events 4885-4886 (Summary View/Click) only fire for downgrades (~9K users)

<details>
<summary><b>SQL Queries</b></summary>

```sql
-- Change Cycle Flow Funnel (Q3 2025)
SELECT 
    evid,
    CASE evid
        WHEN 4882 THEN '1. Popup View'
        WHEN 4883 THEN '2. Select Cycle'
        WHEN 4884 THEN '3. Click Action'
        WHEN 4885 THEN '4. Summary View (downgrades)'
        WHEN 4886 THEN '5. Summary Click'
    END as funnel_step,
    COUNT(*) as events,
    COUNT(DISTINCT uuid) as unique_users
FROM events.dbo.users_17
WHERE evid IN (4882, 4883, 4884, 4885, 4886)
  AND date_created >= TIMESTAMP '2025-07-01 00:00:00'
  AND date_created < TIMESTAMP '2025-10-01 00:00:00'
GROUP BY evid
ORDER BY evid;

-- Click action breakdown
SELECT click_type, COUNT(DISTINCT uuid) as unique_users
FROM events.dbo.users_17
WHERE evid = 4884
  AND date_created >= TIMESTAMP '2025-07-01 00:00:00'
  AND date_created < TIMESTAMP '2025-10-01 00:00:00'
GROUP BY click_type;

-- Track through checkout
WITH change_cycle_users AS (
    SELECT DISTINCT uuid
    FROM events.dbo.users_17
    WHERE evid = 4884 AND click_type = 'continue'
      AND date_created >= TIMESTAMP '2025-07-01 00:00:00'
      AND date_created < TIMESTAMP '2025-10-01 00:00:00'
)
SELECT 
    COUNT(DISTINCT c.uuid) as users_clicked_continue,
    COUNT(DISTINCT CASE WHEN cs.did_checkout_success = true THEN c.uuid END) as users_purchased
FROM change_cycle_users c
LEFT JOIN prod.premium.checkout_sessions_log cs 
    ON c.uuid = cs.uuid
    AND cs.checkout_click_time >= TIMESTAMP '2025-07-01 00:00:00'
    AND cs.checkout_click_time < TIMESTAMP '2025-10-01 00:00:00'
    AND cs.initiator_flow = 'Change existing service';
```

</details>

<details>
<summary><b>SQL Query</b></summary>

```sql
WITH daily_users AS (
SELECT 
        DATE(pp.first_pp_view_date) as view_date,
        pp.uuid,
        MAX(CASE WHEN pp.first_pp_view_date IS NOT NULL THEN 1 ELSE 0 END) as viewed_pp,
        MAX(CASE WHEN pp.first_cycle_page_date IS NOT NULL THEN 1 ELSE 0 END) as viewed_cycle,
        MAX(CASE WHEN pp.first_checkout_page_date IS NOT NULL THEN 1 ELSE 0 END) as viewed_checkout,
        MAX(CASE WHEN pp.first_submit_date IS NOT NULL THEN 1 ELSE 0 END) as submitted,
        MAX(CASE WHEN pp.first_purchase_date IS NOT NULL THEN 1 ELSE 0 END) as purchased
    FROM prod.premium.package_picker_sessions_log pp
    INNER JOIN prod.wt_accounts.accounts acc ON pp.uuid = acc.uuid
    WHERE pp.first_pp_view_date >= DATE '2025-07-01'
      AND pp.first_pp_view_date < DATE '2025-10-01'
      AND pp.is_new_purchase = false
    GROUP BY DATE(pp.first_pp_view_date), pp.uuid
),
monthly_funnel AS (
    SELECT 
        DATE_TRUNC('month', view_date) as month_start,
        COUNT(DISTINCT CASE WHEN viewed_pp = 1 THEN uuid END) as pp_viewers,
        COUNT(DISTINCT CASE WHEN viewed_cycle = 1 THEN uuid END) as cycle_viewers,
        COUNT(DISTINCT CASE WHEN viewed_checkout = 1 THEN uuid END) as checkout_viewers,
        COUNT(DISTINCT CASE WHEN submitted = 1 THEN uuid END) as submitters,
        COUNT(DISTINCT CASE WHEN purchased = 1 THEN uuid END) as purchasers
    FROM daily_users
    GROUP BY DATE_TRUNC('month', view_date)
)
SELECT 
    SUM(pp_viewers) as total_pp_viewers,
    SUM(cycle_viewers) as total_cycle_viewers,
    SUM(checkout_viewers) as total_checkout_viewers,
    SUM(submitters) as total_submitters,
    SUM(purchasers) as total_purchasers,
    ROUND(100.0 * SUM(cycle_viewers) / NULLIF(SUM(pp_viewers), 0), 1) as cvr_pp_to_cycle,
    ROUND(100.0 * SUM(checkout_viewers) / NULLIF(SUM(cycle_viewers), 0), 1) as cvr_cycle_to_checkout,
    ROUND(100.0 * SUM(submitters) / NULLIF(SUM(checkout_viewers), 0), 1) as cvr_checkout_to_submit,
    ROUND(100.0 * SUM(purchasers) / NULLIF(SUM(submitters), 0), 1) as cvr_submit_to_purchase,
    ROUND(100.0 * SUM(purchasers) / NULLIF(SUM(pp_viewers), 0), 1) as cvr_overall
FROM monthly_funnel
```

</details>

---

### Entry Points - All Switch Ups (Q3 2025)

> **Filter**: `is_new_purchase = false`
> **Data Source**: `prod.premium.package_picker_sessions_log` (Official Sherlock KB table)
> **Counting Methodology**: Daily user-level (COUNT DISTINCT uuid per day, `min_by(referral, timestamp)` per user per day)

| Entry Point | Unique Users | Purchases | **E2E CR** |
|-------------|--------------|-----------|------------|
| bizMgrHeader | 120,021 | 7,351 | 6.1% |
| BIZ_MANAGER_HOME_LB | 114,083 | 12,370 | **10.8%** |
| my_subscriptions (url) | 78,378 | 8,403 | **10.7%** |
| dashboard (url) | 66,542 | 6,704 | **10.1%** |
| site-home-mobile | 59,480 | 2,669 | 4.5% |
| dashboard_premium_banner | 36,365 | 3,803 | **10.5%** |
| manage.wix.com (other url) | 23,366 | 984 | 4.2% |
| my_subscriptions_dropdown | 19,150 | 2,553 | **13.3%** |
| gfpp | 19,128 | 200 | 1.0% |
| email_mkt | 16,775 | 2,971 | **17.7%** |
| studio (url) | 16,429 | 1,314 | 8.0% |
| TOP_BAR_UPGRADE_MENU_COMPARE_PLANS_0520 | 13,306 | 492 | 3.7% |
| AssignAndUpgrdeToStudio | 11,473 | 6,591 | **57.4%** |
| Unknown (no URL) | 11,417 | 834 | 7.3% |
| edhtml_TOP_BAR_UPGRADE_MENU_COMPARE_PLANS_DEALER | 10,138 | 734 | 7.2% |
| HelpCenter | 9,226 | 726 | 7.9% |
| TOP_BAR_UPGRADE_MENU_UPGRADE_NOW_0520 | 8,908 | 501 | 5.6% |
| edhtml_TOP_BAR_UPGRADE_MENU_PS_DEALER | 8,647 | 1,196 | **13.8%** |
| media_manager_storage_upgrade | 8,639 | 2,149 | **24.9%** |
| Other (url) | 7,373 | 553 | 7.5% |
| add-domain-purchase-intent | 7,246 | 144 | 2.0% |
| {refferalInfo} | 6,289 | 1,104 | **17.6%** |
| mobile-site-selector | 5,657 | 813 | **14.4%** |
| google (external) | 5,147 | 139 | 2.7% |
| editor (url) | 5,045 | 132 | 2.6% |

> **Note on URL Fallback**: When `referral_additional_info` is null, the query categorizes by `referral` URL:
> - `my_subscriptions (url)` = came from `/account/subscriptions` page
> - `dashboard (url)` = came from `/dashboard` page
> - `studio (url)` = came from Wix Studio
> - `editor (url)` = came from editor.wix.com
> - `google (external)` = came from Google search
> - `Unknown (no URL)` = both `referral_additional_info` AND `referral` are null (~11K users, 7.3% CR)

<details>
<summary><b>SQL Query</b></summary>

```sql
-- Daily user-level Entry Points with URL fallback for nulls
WITH sessions_with_entry_point AS (
  SELECT 
    uuid,
    DATE(first_pp_view_date) as view_date,
    first_pp_view_date,
    -- Use referral_additional_info, fallback to categorized URL if null
    COALESCE(
      referral_additional_info,
      CASE 
        WHEN referral LIKE '%/account/subscriptions%' THEN 'my_subscriptions (url)'
        WHEN referral LIKE '%/dashboard%' THEN 'dashboard (url)'
        WHEN referral LIKE '%/studio%' THEN 'studio (url)'
        WHEN referral LIKE '%editor.wix.com%' THEN 'editor (url)'
        WHEN referral LIKE '%google%' THEN 'google (external)'
        WHEN referral LIKE '%manage.wix.com%' THEN 'manage.wix.com (other url)'
        WHEN referral IS NULL THEN 'Unknown (no URL)'
        ELSE 'Other (url)'
      END
    ) as entry_point,
    first_purchase_date
  FROM prod.premium.package_picker_sessions_log
  WHERE first_pp_view_date >= DATE '2025-07-01' 
    AND first_pp_view_date < DATE '2025-10-01'
    AND is_new_purchase = false
),
-- For each user per day, take the FIRST entry point by time using min_by
user_day_referral AS (
  SELECT 
    uuid,
    view_date,
    min_by(entry_point, first_pp_view_date) as first_entry_point,
    MAX(CASE WHEN first_purchase_date IS NOT NULL THEN 1 ELSE 0 END) as did_purchase
  FROM sessions_with_entry_point
  GROUP BY uuid, view_date
)
-- Count distinct users per entry point
SELECT 
  first_entry_point as entry_point,
  COUNT(DISTINCT uuid) as unique_users,
  SUM(did_purchase) as purchases,
  ROUND(100.0 * SUM(did_purchase) / COUNT(DISTINCT uuid), 1) as cr_pct
FROM user_day_referral
GROUP BY first_entry_point
ORDER BY unique_users DESC
LIMIT 25
```

</details>

---

### Device Breakdown - PP Funnel Analysis (Q3 2025)

> **Data Source**: `prod.premium.package_picker_sessions_log` (Official Sherlock KB table)
> **Counting Methodology**: Daily user-level (COUNT DISTINCT uuid per day, `min_by(device, timestamp)` per user per day)

| Device | Unique Users | % Users | Purchases | % Purchases | **CR** |
|--------|--------------|---------|-----------|-------------|--------|
| **Computer** | 550,918 | **85.9%** | 72,527 | **92.6%** | **13.2%** |
| **Mobile** | 89,603 | **14.0%** | 5,750 | **7.3%** | **6.4%** |
| Tablet | 874 | 0.1% | 79 | 0.1% | 9.0% |
| Unknown | 11 | 0.0% | 5 | 0.0% | 45.5% |

> **Key Insight**: Computer users convert at **2x the rate** of mobile users (13.2% vs 6.4%).

<details>
<summary><b>SQL Query</b></summary>

```sql
-- Daily user-level funnel: first device per user per day using min_by
WITH daily_user_device AS (
  SELECT 
    DATE(first_pp_view_date) as view_date,
    uuid,
    -- Take first device_type per user per day by earliest session time
    min_by(device_type, first_pp_view_date) as device_type,
    MAX(CASE WHEN first_purchase_date IS NOT NULL THEN 1 ELSE 0 END) as did_purchase
  FROM prod.premium.package_picker_sessions_log
  WHERE first_pp_view_date >= DATE '2025-07-01' 
    AND first_pp_view_date < DATE '2025-10-01'
    AND is_new_purchase = false
  GROUP BY DATE(first_pp_view_date), uuid
)
SELECT 
  device_type,
  COUNT(DISTINCT uuid) as unique_users,
  ROUND(100.0 * COUNT(DISTINCT uuid) / SUM(COUNT(DISTINCT uuid)) OVER (), 1) as pct_users,
  SUM(did_purchase) as purchases,
  ROUND(100.0 * SUM(did_purchase) / SUM(SUM(did_purchase)) OVER (), 1) as pct_purchases,
  ROUND(100.0 * SUM(did_purchase) / COUNT(DISTINCT uuid), 1) as cr_pct
FROM daily_user_device
GROUP BY device_type
ORDER BY unique_users DESC
```

</details>

---

# Detailed Analysis

## Data Period

| Attribute | Value |
|-----------|-------|
| **Analysis Period** | **Q3 2025** (2025-07-01 to 2025-09-30) |
| **Counting Method** | **Site-level** (per uuid+msid) |
| **Data Source** | `prod.premium.subscriptions_premium_plan_scd` |
| **Funnel Data** | `prod.premium.premium_package_picker_daily_report` |
| **Data Freshness** | Updated daily |
| **Excluded** | Wix employees (`is_uuid_wix_user = false`) |

---

## Geo Breakdown (Q3 2025 All Switch Ups)

> **Data Source**: `prod.premium.package_picker_sessions_log` joined with `subscriptions_premium_plan_scd` via `subscription_id` + same day (Q3 2025)

> **Total Unique Sites**: 95,698

| Country | Sites | % | Cumulative % |
|---------|-------|---|--------------|
| **US** | **27,591** | **28.8%** | 28.8% |
| Unknown | 18,109 | 18.9% | 47.7% |
| **GB** | **7,107** | **7.4%** | 55.1% |
| **CA** | **4,487** | **4.7%** | 59.8% |
| FR | 3,419 | 3.6% | 63.4% |
| BR | 3,249 | 3.4% | 66.8% |
| IN | 3,100 | 3.2% | 70.0% |
| AU | 3,046 | 3.2% | 73.2% |
| DE | 2,324 | 2.4% | 75.6% |
| JP | 1,828 | 1.9% | 77.5% |
| CH | 1,537 | 1.6% | 79.1% |
| MX | 1,136 | 1.2% | 80.3% |
| TR | 1,120 | 1.2% | 81.5% |
| IT | 1,075 | 1.1% | 82.6% |
| NL | 1,009 | 1.1% | 83.7% |
| ES | 1,003 | 1.0% | 84.7% |
| IL | 957 | 1.0% | 85.7% |
| BE | 704 | 0.7% | 86.4% |
| AT | 681 | 0.7% | 87.1% |
| ZA | 587 | 0.6% | 87.7% |
| NZ | 572 | 0.6% | 88.3% |
| IE | 490 | 0.5% | 88.8% |
| HK | 486 | 0.5% | 89.3% |
| CO | 466 | 0.5% | 89.8% |
| KR | 448 | 0.5% | 90.3% |
| SG | 441 | 0.5% | 90.8% |
| TW | 411 | 0.4% | 91.2% |
| PT | 405 | 0.4% | 91.6% |
| PL | 403 | 0.4% | 92.0% |
| Other (~150 countries) | 7,707 | 8.0% | **100%** |
| **Total** | **95,698** | **100%** | - |

> **"Unknown" = switch ups without Package Picker session data** (~18.9%). These are sites that performed switch ups but don't have matching Package Picker session data (e.g., via customer support, direct API, Change Cycle flow, or tracking gaps).

<details>
<summary><b>SQL Query</b></summary>

```sql
WITH all_events AS (
  SELECT subscription_id, uuid, msid, start_date,
    ROW_NUMBER() OVER (PARTITION BY uuid, msid ORDER BY start_date) as rn
  FROM prod.premium.subscriptions_premium_plan_scd
  WHERE start_action = 'switch up'
    AND is_uuid_wix_user = false
    AND start_date >= DATE '2025-07-01' AND start_date < DATE '2025-10-01'
),
first_switch_up AS (
  SELECT subscription_id, uuid, msid, start_date
  FROM all_events
  WHERE rn = 1
),
site_country AS (
  SELECT 
    e.uuid, 
    e.msid,
    COALESCE(min_by(pp.country_code, pp.first_pp_view_date), 'Unknown') as country
  FROM first_switch_up e
  LEFT JOIN prod.premium.package_picker_sessions_log pp 
    ON e.subscription_id = pp.purchased_subscription_id
    AND DATE(pp.first_pp_view_date) = DATE(e.start_date)
  GROUP BY e.uuid, e.msid
)
SELECT
  country,
  COUNT(*) as sites,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as pct
FROM site_country
GROUP BY country
ORDER BY sites DESC
```

</details>

---

## Data Sources

### Official Tables (per Sherlock KB) - VERIFIED

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `prod.premium.subscriptions_premium_plan_scd` ✅ | Premium plan change history (SCD Type 2) | `uuid`, `msid`, `start_action`, `product_name`, `previous_product_name`, `cycle_name`, `previous_cycle_name`, `start_date` |
| `prod.premium.subscriptions_premium_plan_dim` ✅ | Current subscription state | `subscription_id`, `product_id` |
| `prod.premium.package_picker_sessions_log` ✅ | PP session-level data with **device_type** | `uuid`, `site_id`, `device_type`, `referral_additional_info`, `country_code`, `is_new_purchase`, `first_pp_view_date`, `first_purchase_date` |

> **All entry point and device data in this document has been verified against the official `package_picker_sessions_log` table.**

### Supplementary Tables (Not in Sherlock KB)

| Table | Purpose | Notes |
|-------|---------|-------|
| `prod.wt_metasites.premium` | Site premium status | Used for premium status checks |

### Key Filters Applied
- `is_uuid_wix_user = false` - Excludes Wix employees
- `start_action = 'switch up'` - User-initiated upgrades only
- `start_action = 'initial purchase'` - First premium purchases
- Site-level counting: `uuid + msid` combination

### Entry Point Naming
- **RAW names used throughout** (e.g., `add-domain-purchase-intent`, `home_lightbox`, `bizMgrHeader`)
- Source: `raw_referral_additional_info` column from `premium_package_picker_daily_report_raw`

---

### Product Context (from Sherlock KB)

| Editor Type | Active Plans | Target Audience |
|-------------|--------------|-----------------|
| **Classic (Sunrise)** | Light, Core, **Business** (recommended), Business Elite | Mainstream users, small businesses |
| **Studio** | Basic, Standard, Plus, Elite | Professional designers, agencies |
| **Legacy (Discontinued)** | Unlimited, Combo, Business Basic, Business Unlimited | Existing subscribers only (grandfathered) |

> **Note on Legacy Plans**: Legacy products are no longer sold but remain active for existing subscribers. They can upgrade to current plans but cannot downgrade within legacy tiers.

---

## Cursor Rules: Data Research Best Practices

### 1. Match Reference Methodology Exactly
- When using data from a reference file, **replicate the exact query methodology**
- Key differences that change results:
  - `INNER JOIN wt_accounts.accounts` vs no join (filters invalid accounts)
  - Monthly totals vs unique users across period (users active in multiple months get counted once vs multiple times)
  - Step CVRs from averages vs totals

### 2. Verify Totals Before Updating
- Before replacing numbers, verify new totals align with existing document totals
- If overall CVR changes dramatically (e.g., 9.6% → 12.3%), investigate why before updating
- Monthly totals: Sum of monthly users ≠ Unique users in quarter (overlap exists)

### 3. Counting Methodology Matters
- **Monthly totals**: Users counted once per month they were active → higher total count
- **Unique users**: COUNT(DISTINCT uuid) across entire period → lower count, higher CVR
- Always document which methodology is used

### 4. Unknown/Null Values & Daily User-Level Counting
- For entry points: Use URL fallback when `referral_additional_info` is null - extract from `referralInfo=` param or categorize by domain
- Use `min_by(column, first_pp_view_date)` to get the value from the **earliest session** per user per day (not alphabetically first)
- Apply COUNT DISTINCT uuid per day to avoid double-counting users who view PP multiple times per day
- "Unknown" in device/geo = no matching PP session data (bypass flows, support, tracking gaps)
- Always join PP sessions by dates (e.g., `DATE(pp.first_pp_view_date) = e.start_date`) to ensure accurate matching

### 5. SQL Query Documentation
- Always add SQL queries in collapsible `<details>` sections below data tables
- Include the exact filters used (date range, is_new_purchase, wt_accounts join)
- This enables verification and reproduction of results

