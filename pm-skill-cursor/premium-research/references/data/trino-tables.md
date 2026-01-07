# Trino Tables Reference

> **Investigation Principle:** Combine the power of Trino tables & column discovery with production code data structures to understand connections and know what to search.

---

## Table Discovery

### Schema Patterns

| Schema | Purpose | Example |
|--------|---------|---------|
| `prod.premium_secure.*` | Billing/BASS tables | `prod.premium_secure.wix_billing_*` |
| `prod.premium.*` | Platform & Business Unit | `prod.premium.subscriptions` |
| `mysql.coupons_core_bi.*` | Coupons data | `mysql.coupons_core_bi.coupon_vw` |
| `events.dbo.*` | BI event data | `events.dbo.users_17` |

### Discovery Commands

```sql
-- List all tables in a schema
SHOW TABLES IN prod.premium_secure;
SHOW TABLES IN prod.premium;

-- Check table structure
DESCRIBE prod.premium.subscriptions;

-- Sample data (always limit first!)
SELECT * FROM prod.premium.subscriptions LIMIT 10;
```

---

## Common Tables by Domain

### Premium Plans

| Table | Purpose | When to Use |
|-------|---------|-------------|
| `prod.premium.premium_plan_subscriptions` | Plan subscription data | General plans analysis |
| `prod.premium.premium_plan_full_log` | Plan event history | Tracking changes over time |
| `prod.premium.subscriptions_premium_plan_scd` | Slowly changing dimension | Historical state analysis |
| `prod.premium.subscriptions_premium_plan_dim` | Current dimension | Current state snapshots |

### Domains

| Table | Purpose | When to Use |
|-------|---------|-------------|
| `prod.premium.domain_registrations` | Purchased domains | New domain purchases only |
| `prod.premium.domain_first_propagation_date` | All domains (purchased + connected) | When you need both types |

**Domain Data Gotcha:**
> Never use `prod.premium_secure.financial_transactions` for new domains - it doesn't include $0 transactions (voucher purchases). Never use INNER JOIN for new domains analysis.

### Google Workspace / Mailboxes

| Table | Purpose | When to Use |
|-------|---------|-------------|
| `prod.premium.mailboxes_subscriptions_dim` | Mailbox dimension | Current mailbox state |
| `prod.premium.mailboxes_subscriptions_scd` | Mailbox SCD | Historical mailbox changes |

### Billing & Collections

| Table | Purpose | When to Use |
|-------|---------|-------------|
| `prod.premium_secure.financial_transactions` | All financial transactions | Revenue, payments analysis |
| `prod.premium_secure.billing_transaction_dim` | Transaction dimension | Transaction details |
| `prod.premium_secure.wix_billing_billing_accounts_replica` | Billing accounts | Account-level analysis |

### BASS (New Billing System)

| Table | Purpose | When to Use |
|-------|---------|-------------|
| `prod.premium_secure.bass_subscription_dim` | BASS subscriptions | UoU subscription data |
| `prod.premium_secure.bass_settings_dim` | BASS settings | Configuration analysis |
| `prod.premium_secure.bass_attempts_dim` | Payment attempts | Payment retry analysis |
| `prod.premium_secure.billing_invoices_bass_invoices_replica` | BASS invoices | Invoice data |

### Platform

| Table | Purpose | When to Use |
|-------|---------|-------------|
| `prod.premium.subscriptions` | Subscription manager | Cross-product subscriptions |
| `prod.premium.asset_v2_last_value` | Asset V2 (source of truth) | Current asset state |
| `prod.premium.asset` | Asset V1 (legacy) | Historical compatibility |
| `mysql.coupons_core_bi.coupon_vw` | Coupons | Discount analysis |
| `prod.premium.premium_reseller_packages_replica` | Reseller packages | Partner analysis |

### BI / Events

| Table | Purpose | When to Use |
|-------|---------|-------------|
| `events.dbo.users_17` | General BI events | Premium platform/billing events |

---

## Investigation Protocol (SHERLOCK Method)

### Before Writing ANY Query

1. **Explore the table structure:**
   ```sql
   DESCRIBE prod.premium.your_table;
   ```

2. **Sample the data:**
   ```sql
   SELECT * FROM prod.premium.your_table LIMIT 10;
   ```

3. **Discover dimensions:**
   ```sql
   SELECT
       column_name as dimension,
       COUNT(*) as record_count
   FROM prod.premium.your_table
   WHERE date >= CURRENT_DATE - INTERVAL '7' DAY
   GROUP BY column_name
   ORDER BY record_count DESC;
   ```

4. **Ask clarifying questions** about filters before full analysis

### Quality Gates

**Before presenting ANY metric:**
- Every number must come from an actual SQL query
- No estimation, interpolation, or assumptions
- Always verify filtering matches requirements
- Cross-check sample data against query results

**Forbidden phrases:** "approximately", "estimated", "roughly", "around"

**Required approach:** "Based on my query results...", "The exact value from the data is..."

---

## Connecting Data to Code

When you find something interesting in Trino, use **octocode** to find the code:

| Data Pattern Found | Code to Search |
|-------------------|----------------|
| Subscription status values | `subscription-manager` service enums |
| Domain registration codes | `domain-registrar` service |
| Payment failure codes | `Cashier` adapters, `billing-common` |
| BASS subscription states | `bass/billing-subscriptions` |

### Investigation Pattern

```
1. TRINO: Find the data anomaly/pattern
   → "These subscriptions have status='PAYMENT_FAILED'"

2. OCTOCODE: Find the code that sets this
   → Search: keywords=["PAYMENT_FAILED", "status"] in subscription-manager

3. ARCHITECTURE: Understand the flow
   → Check caller-callee.md: who calls subscription-manager?

4. CONNECT: Explain the full picture
   → "Cashier payment failure → SBS callback → subscription-manager updates status"
```

---

## Query Best Practices

1. **Always use date filters** — Tables are huge, filter first
2. **Start with LIMIT** — Sample before full query
3. **Use DATE_TRUNC** — For time-based aggregations
4. **Check for NULLs** — Many columns are nullable
5. **Mind the timezone** — Dates are usually UTC
6. **Validate volume** — If results seem off, check filters

---

## Common Gotchas

| Issue | Solution |
|-------|----------|
| `status` columns vary by table | Check `DISTINCT` values first |
| Tables partitioned by date | Query is faster with date filter |
| User IDs format varies | UUID vs internal ID - check column |
| Currency in cents vs dollars | Check column name for hints |
| Domain $0 transactions missing | Use `domain_registrations`, not `financial_transactions` |
| Rating columns unreliable | Calculate ratings yourself |

---

## Output Guidelines

When presenting analysis:
1. **Start with key findings** — Executive summary first
2. **Show the SQL** — Well-commented queries
3. **Explain in business terms** — Not just technical metrics
4. **Highlight anomalies** — Patterns that need attention
5. **Recommend next steps** — Actionable insights
