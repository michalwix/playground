# Testing Checklist

Use this checklist to track your testing progress.

## Pre-Testing Setup

- [ ] Non-production environment access confirmed
- [ ] FireConsole non-prod endpoint identified
- [ ] FireConsole admin-signed token obtained
- [ ] Test Product Group SBS ID identified
- [ ] Test Offering ID available (or plan to create one)
- [ ] Test email address for offering manager

## Test Data

- [ ] Test Product Group SBS ID: `_________________`
- [ ] Test Offering ID: `_________________`
- [ ] Test Manager Email: `_________________`
- [ ] FireConsole Host: `_________________`
- [ ] FireConsole Token: `_________________` (stored securely)

## Test Execution

### 1. Generate Test Artifacts
- [ ] Simple percent discount generated
- [ ] Multi-cycle discount generated
- [ ] Files saved to `output/` directory
- [ ] File names are unique (timestamped)

### 2. Validate FireConsole Payload
- [ ] `coupon.code` present and correct
- [ ] `discount_rule` structure valid
  - [ ] Simple percent: `{ "percent": <number> }`
  - [ ] Multi-cycle: `{ "multi_cycle_percent": { ... } }`
- [ ] `metadata.isSale` = `"true"` (string)
- [ ] `metadata.saleId` = offering ID
- [ ] `applies_to[0].category` = `"product_group"`
- [ ] `applies_to[0].id` = Product Group SBS ID
- [ ] `valid_from` and `expires_on` in ISO8601 format
- [ ] `enabled` = `true`
- [ ] `use_limit` = `1`

### 3. Validate Dealer Template
- [ ] `sale_type` = PERSONAL_SALE or SEASONAL_SALE
- [ ] `coupon_code` matches FireConsole coupon code
- [ ] `offering_manager_email` set
- [ ] `status` = DRAFT (for testing)
- [ ] `qbo_offer_id` placeholder present

### 4. FireConsole Integration
- [ ] Coupon created successfully via API
- [ ] Coupon can be retrieved
- [ ] Discount rule applied correctly
- [ ] Metadata preserved
- [ ] Applies_to configuration correct

### 5. Dealer Integration
- [ ] Offering created in Dealer (manual or API)
- [ ] Sale type matches
- [ ] Coupon code linked correctly
- [ ] Manager email set
- [ ] Status management works

### 6. End-to-End Testing
- [ ] FireConsole coupon created
- [ ] Dealer offering created
- [ ] Coupon and offering linked (saleId matches)
- [ ] QBO Offer ID can be updated
- [ ] All systems stay in sync

## Test Scenarios Completed

- [ ] Simple 50% discount
- [ ] Simple 70% discount
- [ ] Multi-cycle discount (2 cycles, YEARLY)
- [ ] Multi-cycle discount (3 cycles, MONTHLY)
- [ ] With all optional fields
- [ ] Validation error handling
- [ ] Dry-run mode

## Issues Found

| Issue | Description | Resolution | Status |
|-------|-------------|------------|--------|
|       |             |            |        |
|       |             |            |        |
|       |             |            |        |

## Notes

- Date: `_________________`
- Tester: `_________________`
- Environment: `_________________`
- Additional notes:
  ```
  
  ```




