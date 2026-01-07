# Quick Start - Testing in Non-Production

## 🚀 Quick Test (5 minutes)

### 1. Set Test Environment Variables

```bash
cd qbo-sale-automation

# Set your test data (update these!)
export TEST_PRODUCT_GROUP_SBS_ID="your-test-product-group-sbs-id"
export TEST_OFFERING_ID="your-test-offering-id"
export TEST_MANAGER_EMAIL="your-email@example.com"
```

### 2. Generate Test Sale

```bash
# Generate a simple 50% sale
node cli.js \
  --sale-type PERSONAL_SALE \
  --discount-percent 50 \
  --valid-from 2025-01-01 \
  --expires-on 2025-12-31 \
  --product-group-sbs-id "$TEST_PRODUCT_GROUP_SBS_ID" \
  --offering-id "$TEST_OFFERING_ID" \
  --coupon-code "TEST_SALE_$(date +%s)" \
  --offering-manager-email "$TEST_MANAGER_EMAIL" \
  --status DRAFT
```

### 3. Review Generated Files

```bash
# View FireConsole payload
cat output/*_fireconsole.json | jq

# View Dealer template
cat output/*_dealer.json | jq
```

### 4. Test FireConsole Integration (Optional)

If you have FireConsole access:

```bash
# Set FireConsole credentials
export FIRE_CONSOLE_HOST="your-fireconsole-host:8080"
export FIRE_CONSOLE_TOKEN="your-admin-signed-token"

# Send to FireConsole
FIRE_FILE=$(ls -t output/*_fireconsole.json | head -1)
curl -X POST \
  "http://${FIRE_CONSOLE_HOST}/api/v1/coupons" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${FIRE_CONSOLE_TOKEN}" \
  -H "X-Wix-Request-Id: $(uuidgen)" \
  -H "User-Agent: FireConsole/1.0" \
  -d @"$FIRE_FILE"
```

## 🧪 Run Automated Test Suite

```bash
# Run all tests
./test-helper.sh
```

This will:
- ✅ Generate simple percent discount
- ✅ Generate multi-cycle discount
- ✅ Test validation
- ✅ Test dry-run mode
- ✅ Verify file structures
- ✅ Optionally send to FireConsole (if token provided)

## 📋 What to Check

### FireConsole Payload
- [ ] `coupon.code` matches your input
- [ ] `discount_rule` structure is correct
- [ ] `metadata.isSale` = `"true"`
- [ ] `metadata.saleId` = your offering ID
- [ ] `applies_to[0].id` = your Product Group SBS ID

### Dealer Template
- [ ] `sale_type` matches (PERSONAL_SALE or SEASONAL_SALE)
- [ ] `coupon_code` matches FireConsole coupon code
- [ ] `offering_manager_email` is set
- [ ] `status` is DRAFT (for testing)

## 🔍 Common Test Scenarios

### Scenario 1: Simple 50% Sale
```bash
node cli.js \
  --sale-type PERSONAL_SALE \
  --discount-percent 50 \
  --valid-from 2025-01-01 \
  --expires-on 2025-01-31 \
  --product-group-sbs-id "$TEST_PRODUCT_GROUP_SBS_ID" \
  --offering-id "$TEST_OFFERING_ID" \
  --coupon-code "TEST50_$(date +%s)"
```

### Scenario 2: 70% Multi-Cycle (First 2 Years)
```bash
node cli.js \
  --sale-type SEASONAL_SALE \
  --discount-percent 70 \
  --valid-from 2025-01-01 \
  --expires-on 2025-12-31 \
  --product-group-sbs-id "$TEST_PRODUCT_GROUP_SBS_ID" \
  --offering-id "$TEST_OFFERING_ID" \
  --coupon-code "TEST70_MULTI_$(date +%s)" \
  --cycles 2 \
  --interval YEARLY \
  --count 2
```

## 🐛 Troubleshooting

### Issue: "Validation errors"
**Solution:** Check all required parameters are provided:
- `--sale-type` (PERSONAL_SALE or SEASONAL_SALE)
- `--discount-percent` (1-100)
- `--valid-from` and `--expires-on` (dates)
- `--product-group-sbs-id`
- `--offering-id`
- `--coupon-code`

### Issue: "Invalid Product Group SBS ID"
**Solution:** Verify the SBS ID exists in your non-prod environment

### Issue: "Coupon code already exists"
**Solution:** Use unique codes:
```bash
--coupon-code "TEST_$(date +%s)_$$"
```

### Issue: "FireConsole API error"
**Solution:** 
- Verify `FIRE_CONSOLE_HOST` and `FIRE_CONSOLE_TOKEN`
- Check token has admin permissions
- Verify endpoint URL is correct

## 📚 Next Steps

1. **Review generated files** - Check structure matches requirements
2. **Test FireConsole** - Create coupon using generated payload
3. **Test Dealer** - Create offering using generated template
4. **Verify linkage** - Ensure coupon and offering are linked correctly
5. **Document findings** - Note any issues or manual steps needed

## 📖 Full Documentation

- `README.md` - Complete documentation
- `TESTING_GUIDE.md` - Detailed testing guide
- `SUMMARY.md` - Implementation details




