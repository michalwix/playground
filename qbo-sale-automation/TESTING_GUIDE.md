# Testing Guide - Non-Production

This guide walks you through testing the QBO Sale Automation CLI tool in non-production environments.

## Prerequisites

1. **Access to non-production environments:**
   - FireConsole (staging/QA)
   - Dealer (staging/QA)
   - Test Product Group SBS IDs

2. **Authentication tokens:**
   - FireConsole RPC admin-signed token
   - Dealer API access (if needed)

3. **Test data:**
   - Test Product Group SBS ID
   - Test Offering ID (or create one)
   - Test coupon codes (use unique codes for testing)

## Step 1: Generate Test Artifacts

### Generate with Test Data

```bash
cd qbo-sale-automation

# Generate test sale artifacts
node cli.js \
  --sale-type PERSONAL_SALE \
  --discount-percent 50 \
  --valid-from 2025-01-01 \
  --expires-on 2025-12-31 \
  --product-group-sbs-id <TEST_PRODUCT_GROUP_SBS_ID> \
  --offering-id <TEST_OFFERING_ID> \
  --coupon-code TEST_SALE50_$(date +%s) \
  --offering-manager-email your-email@example.com \
  --status DRAFT
```

**Tips:**
- Use unique coupon codes (append timestamp or random string)
- Use test Product Group SBS IDs from non-prod
- Set status to `DRAFT` initially
- Use future dates for validity

### Review Generated Files

Check the `output/` directory:
- `*_fireconsole.json` - FireConsole RPC payload
- `*_dealer.json` - Dealer offering template

**Verify:**
- ✅ All required fields are present
- ✅ Discount rule structure is correct
- ✅ Metadata includes `isSale: "true"` and `saleId`
- ✅ Dates are in ISO8601 format
- ✅ Product Group SBS ID matches test data

## Step 2: Test FireConsole Coupon Creation

### Option A: Using cURL

```bash
# Read the generated FireConsole payload
FIRE_CONSOLE_PAYLOAD=$(cat output/TEST_SALE50_*_fireconsole.json)

# Send to FireConsole (replace with actual non-prod endpoint)
curl -X POST \
  https://<FIRE_CONSOLE_NON_PROD_HOST>/api/v1/coupons \
  -H "Content-Type: application/json" \
  -H "Authorization: <ADMIN_SIGNED_TOKEN>" \
  -H "X-Wix-Request-Id: $(uuidgen)" \
  -H "User-Agent: FireConsole/1.0" \
  -d "$FIRE_CONSOLE_PAYLOAD"
```

### Option B: Using the hopp.ts Pattern

Based on the codebase research, FireConsole uses this structure:

```javascript
const response = await httpRequest({
  url: 'http://<FIRE_CONSOLE_HOST>:8080/api/v1/coupons',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'FireConsole/1.0',
    'X-Wix-Request-Id': '<REQUEST_ID>',
    'Authorization': '<ADMIN_SIGNED_TOKEN>',
  },
  body: JSON.stringify(fireConsolePayload),
});
```

### Validation Checklist

After creating the coupon:
- [ ] Coupon created successfully
- [ ] Coupon code matches input
- [ ] Discount rule applied correctly
- [ ] Metadata includes `isSale: "true"`
- [ ] `saleId` matches offering ID
- [ ] `applies_to` uses correct Product Group SBS ID
- [ ] Dates are correct (valid_from, expires_on)
- [ ] `enabled: true` and `use_limit: 1`

### Test Multi-Cycle Discount

```bash
# Generate multi-cycle discount
node cli.js \
  --sale-type SEASONAL_SALE \
  --discount-percent 50 \
  --valid-from 2025-01-01 \
  --expires-on 2025-12-31 \
  --product-group-sbs-id <TEST_PRODUCT_GROUP_SBS_ID> \
  --offering-id <TEST_OFFERING_ID> \
  --coupon-code TEST_MULTI_$(date +%s) \
  --cycles 2 \
  --interval YEARLY \
  --count 2

# Verify the discount_rule structure
cat output/TEST_MULTI_*_fireconsole.json | jq '.coupon.discount_rule'
```

**Expected structure:**
```json
{
  "multi_cycle_percent": {
    "percent": [
      {
        "percent": 50,
        "recurring_cycles_number": 2,
        "cycle_duration": "YEARLY",
        "number_of_cycles": 2,
        "cycle": {
          "unit": "YEAR",
          "count": 2
        }
      }
    ]
  }
}
```

## Step 3: Test Dealer Offering Creation

### Review Dealer Template

```bash
# View the generated template
cat output/*_dealer.json | jq
```

### Manual Steps in Dealer UI

1. **Navigate to Dealer** (non-prod environment)
2. **Create/Edit Offering:**
   - Use the `internal_name` from template
   - Set `sale_type` to PERSONAL_SALE or SEASONAL_SALE
   - Add `offering_manager_email`
   - Link `coupon_code` from FireConsole
   - Set `targeting` configuration
   - Set `status` to DRAFT initially

3. **After QBO Sale Creation:**
   - Update `qbo_offer_id` with actual QBO Offer ID
   - Change `status` to LIVE when ready

### Validation Checklist

- [ ] Offering created in Dealer
- [ ] Sale type matches (PERSONAL_SALE/SEASONAL_SALE)
- [ ] Coupon code linked correctly
- [ ] Manager email set
- [ ] Targeting configured (if applicable)
- [ ] Status set appropriately

## Step 4: End-to-End Testing

### Test Flow

1. **Generate artifacts** with test data
2. **Create FireConsole coupon** using RPC payload
3. **Create Dealer offering** using template
4. **Create QBO sale** (manual step)
5. **Update Dealer offering** with QBO Offer ID
6. **Verify linkage:**
   - Coupon metadata `saleId` → Dealer offering ID
   - Dealer offering `coupon_code` → FireConsole coupon code
   - Dealer offering `qbo_offer_id` → QBO Offer ID

### Test Scenarios

#### Scenario 1: Simple Percent Discount
```bash
node cli.js \
  --sale-type PERSONAL_SALE \
  --discount-percent 50 \
  --valid-from 2025-01-01 \
  --expires-on 2025-01-31 \
  --product-group-sbs-id <TEST_ID> \
  --offering-id <TEST_ID> \
  --coupon-code TEST_SIMPLE_$(date +%s)
```

#### Scenario 2: Multi-Cycle Discount
```bash
node cli.js \
  --sale-type SEASONAL_SALE \
  --discount-percent 70 \
  --valid-from 2025-01-01 \
  --expires-on 2025-12-31 \
  --product-group-sbs-id <TEST_ID> \
  --offering-id <TEST_ID> \
  --coupon-code TEST_MULTI_$(date +%s) \
  --cycles 3 \
  --interval YEARLY \
  --count 3
```

#### Scenario 3: With All Optional Fields
```bash
node cli.js \
  --sale-type PERSONAL_SALE \
  --discount-percent 50 \
  --valid-from 2025-01-01 \
  --expires-on 2025-01-31 \
  --product-group-sbs-id <TEST_ID> \
  --offering-id <TEST_ID> \
  --coupon-code TEST_COMPLETE_$(date +%s) \
  --coupon-name "Test Complete Sale" \
  --coupon-description "Testing all fields" \
  --offering-name "Test Offering" \
  --offering-description "Complete test offering" \
  --offering-manager-email test@example.com \
  --max-time-hours 24 \
  --targeting "geo:US,language:en" \
  --status DRAFT
```

## Step 5: Cleanup

### Delete Test Coupons

If you need to clean up test coupons:

```bash
# List generated coupon codes
ls output/*_fireconsole.json | xargs -I {} jq -r '.coupon.code' {}

# Delete via FireConsole API (if available)
curl -X DELETE \
  https://<FIRE_CONSOLE_HOST>/api/v1/coupons/<COUPON_CODE>?code=<COUPON_CODE> \
  -H "Authorization: <ADMIN_SIGNED_TOKEN>"
```

### Archive Test Offerings

- Set Dealer offering status to ARCHIVED
- Or delete if in non-prod environment

## Troubleshooting

### Common Issues

#### 1. Invalid Product Group SBS ID
**Error:** `applies_to` validation fails
**Solution:** Verify the SBS ID exists in non-prod environment

#### 2. Date Format Issues
**Error:** Invalid date format
**Solution:** Use YYYY-MM-DD or ISO8601 format (tool normalizes automatically)

#### 3. Coupon Code Already Exists
**Error:** Duplicate coupon code
**Solution:** Use unique codes (append timestamp: `SALE50_$(date +%s)`)

#### 4. Invalid Discount Rule
**Error:** FireConsole rejects discount_rule
**Solution:** 
- Verify percent is 1-100
- For multi-cycle: ensure cycles, interval, count are all provided
- Check cycle_duration matches interval (YEARLY → YEAR, MONTHLY → MONTH)

#### 5. Metadata Missing
**Error:** `isSale` or `saleId` not found
**Solution:** Verify generated payload includes metadata:
```bash
cat output/*_fireconsole.json | jq '.coupon.metadata'
```

## Testing Checklist

### Pre-Testing
- [ ] Non-prod environment access confirmed
- [ ] Authentication tokens obtained
- [ ] Test Product Group SBS IDs identified
- [ ] Test Offering IDs available (or plan to create)

### FireConsole Testing
- [ ] Simple percent discount created successfully
- [ ] Multi-cycle percent discount created successfully
- [ ] Metadata includes `isSale: "true"`
- [ ] Metadata includes correct `saleId`
- [ ] `applies_to` uses correct Product Group SBS ID
- [ ] Dates are correct
- [ ] Coupon can be retrieved/validated

### Dealer Testing
- [ ] Offering template fields are correct
- [ ] Sale type matches
- [ ] Coupon code linkage works
- [ ] Manager email set correctly
- [ ] Status management works (DRAFT → LIVE)

### Integration Testing
- [ ] Coupon and offering are linked correctly
- [ ] QBO Offer ID can be updated after QBO sale
- [ ] All systems stay in sync
- [ ] End-to-end flow works

## Next Steps After Testing

Once testing is successful:

1. **Document your findings:**
   - Note any issues encountered
   - Document any manual steps still needed
   - Record successful test scenarios

2. **Prepare for production:**
   - Identify production endpoints
   - Get production authentication tokens
   - Create production Product Group SBS IDs list
   - Set up production offering IDs

3. **Create runbook:**
   - Document exact steps for production use
   - Include validation steps
   - Add rollback procedures

4. **Automate further:**
   - Consider integrating with QBO API for Offer ID fetching
   - Add validation service integration
   - Create monitoring/alerting




