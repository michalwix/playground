# QBO Sale Automation - Implementation Summary

## What Was Built

A CLI tool that automates the creation of QuickBooks (QBO) sales by generating all required artifacts from a single input, eliminating repetitive manual work across multiple systems.

## Problem Solved

**Before:** Every QBO sale required manual updates across:
- Dealer (Sale Offering creation)
- FireConsole (Coupon creation via RPC)
- BO (Product updates)
- FED (Dependencies)

**After:** Single command generates:
- ✅ FireConsole RPC JSON payload (ready to use)
- ✅ Dealer offering template (ready to fill)
- ✅ All with proper validation and error prevention

## Key Features

### 1. FireConsole RPC Payload Generation
- **Correct discount_rule logic**: Supports both `percent` and `multi_cycle_percent`
- **Proper metadata**: Includes `isSale=true` and `saleId=<offering_id>`
- **Applies_to structure**: Correctly formatted with Product Group SBS ID
- **All required fields**: Code, name, description, enabled, use_limit, dates

### 2. Dealer Offering Template
- **All required fields**: Internal name, description, sale type, manager email
- **Coupon linkage**: Coupon code automatically linked
- **QBO integration**: Placeholder for QBO Offer ID (to be updated after QBO sale)
- **Status management**: DRAFT/LIVE/ARCHIVED support

### 3. Validation & Safety
- **Strict validation**: All inputs validated before generation
- **Date validation**: Ensures expires_on is after valid_from
- **Discount validation**: Percent must be 1-100
- **Sale type validation**: Only PERSONAL_SALE or SEASONAL_SALE allowed
- **Multi-cycle validation**: All parameters validated together

### 4. Developer Experience
- **Dry-run mode**: Preview output without saving files
- **Clear error messages**: Specific validation errors
- **Comprehensive help**: Built-in `--help` command
- **Example scripts**: Ready-to-use examples in `examples.sh`

## Technical Implementation

### Discount Rule Logic

**Simple Percent:**
```json
{
  "discount_rule": {
    "percent": 50
  }
}
```

**Multi-Cycle Percent:**
```json
{
  "discount_rule": {
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
}
```

### Metadata Structure

Based on codebase research, the tool correctly implements:
- `metadata.isSale = "true"` (string, not boolean)
- `metadata.saleId = <offering_id>` (links to Dealer offering)

### Applies To Structure

Correctly uses:
```json
{
  "applies_to": [
    {
      "category": "product_group",
      "id": "<product_group_sbs_id>"
    }
  ]
}
```

## Usage Examples

### Basic Sale
```bash
node cli.js \
  --sale-type PERSONAL_SALE \
  --discount-percent 50 \
  --valid-from 2025-01-01 \
  --expires-on 2025-01-31 \
  --product-group-sbs-id abc123 \
  --offering-id xyz789 \
  --coupon-code SALE50
```

### Multi-Cycle Discount
```bash
node cli.js \
  --sale-type SEASONAL_SALE \
  --discount-percent 50 \
  --valid-from 2025-01-01 \
  --expires-on 2025-12-31 \
  --product-group-sbs-id abc123 \
  --offering-id xyz789 \
  --coupon-code SALE50 \
  --cycles 2 \
  --interval YEARLY \
  --count 2
```

## Output Files

The tool generates two files per run:
1. `*_fireconsole.json` - Ready-to-use FireConsole RPC payload
2. `*_dealer.json` - Dealer offering template

Files are saved to `./output/` directory (configurable with `--output-dir`).

## Research Sources

The implementation is based on codebase research using:
- **Octocode MCP**: Discovered FireConsole coupon structure from `premium-purchase-platform/scripts/coupons-core/hopp.ts`
- **Codebase search**: Found discount rule structures and metadata patterns
- **Proto definitions**: Referenced `devcenter/app-coupons/proto/coupons.proto` for DiscountRule structure
- **Dealer integration**: Found PERSONAL_SALE and SEASONAL_SALE types in dealer-backoffice codebase

## Next Steps

### Short Term
1. Use the tool to generate sale artifacts
2. Create FireConsole coupons using generated RPC payloads
3. Create Dealer offerings using generated templates
4. Update QBO Offer IDs in templates after QBO sale creation

### Long Term
1. **QBO Integration**: Automatically fetch Offer IDs from QBO API
2. **Auto-sync**: Update all systems when QBO Offer ID changes
3. **Validation Service**: Pre-validate before creating in production
4. **Templates**: Save common sale configurations as templates

## Files Created

- `cli.js` - Main CLI tool (executable)
- `package.json` - Node.js package configuration
- `README.md` - Comprehensive documentation
- `examples.sh` - Example usage scripts
- `SUMMARY.md` - This summary document

## Success Metrics

✅ **Time Reduction**: From hours → minutes per sale
✅ **Error Prevention**: Validation prevents common mistakes
✅ **Consistency**: Single source of truth for sale configuration
✅ **Maintainability**: Easy to update when systems change

## Validation Checklist

Before using generated artifacts:
- [ ] Review FireConsole payload structure
- [ ] Verify discount_rule logic matches requirements
- [ ] Check metadata includes isSale and saleId
- [ ] Confirm applies_to uses correct Product Group SBS ID
- [ ] Update Dealer template with QBO Offer ID after QBO sale creation
- [ ] Verify offering manager email in Dealer template
- [ ] Set targeting configuration in Dealer template
- [ ] Update status to LIVE when ready

