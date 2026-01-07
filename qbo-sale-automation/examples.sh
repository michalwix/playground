#!/bin/bash

# Example usage scripts for QBO Sale Automation CLI

# Example 1: Simple 50% Personal Sale
echo "=== Example 1: Simple 50% Personal Sale ==="
node cli.js \
  --sale-type PERSONAL_SALE \
  --discount-percent 50 \
  --valid-from 2025-01-01 \
  --expires-on 2025-01-31 \
  --product-group-sbs-id abc123def456 \
  --offering-id xyz789uvw012 \
  --coupon-code SALE50

echo -e "\n"

# Example 2: 70% Seasonal Sale with custom names
echo "=== Example 2: 70% Seasonal Sale with Custom Names ==="
node cli.js \
  --sale-type SEASONAL_SALE \
  --discount-percent 70 \
  --valid-from 2025-01-01 \
  --expires-on 2025-01-31 \
  --product-group-sbs-id abc123def456 \
  --offering-id xyz789uvw012 \
  --coupon-code SALE70 \
  --coupon-name "Holiday Sale 70% Off" \
  --coupon-description "Special holiday promotion - 70% discount" \
  --offering-name "Holiday Sale Offering" \
  --offering-description "Seasonal sale offering for holiday promotion" \
  --offering-manager-email manager@example.com

echo -e "\n"

# Example 3: Multi-Cycle Discount (50% off for first 2 yearly cycles)
echo "=== Example 3: Multi-Cycle Discount ==="
node cli.js \
  --sale-type SEASONAL_SALE \
  --discount-percent 50 \
  --valid-from 2025-01-01 \
  --expires-on 2025-12-31 \
  --product-group-sbs-id abc123def456 \
  --offering-id xyz789uvw012 \
  --coupon-code SALE50_MULTI \
  --cycles 2 \
  --interval YEARLY \
  --count 2

echo -e "\n"

# Example 4: Dry Run (Preview Only)
echo "=== Example 4: Dry Run (Preview Only) ==="
node cli.js \
  --sale-type PERSONAL_SALE \
  --discount-percent 50 \
  --valid-from 2025-01-01 \
  --expires-on 2025-01-31 \
  --product-group-sbs-id abc123def456 \
  --offering-id xyz789uvw012 \
  --coupon-code SALE50 \
  --dry-run

echo -e "\n"

# Example 5: Complete Sale with All Optional Fields
echo "=== Example 5: Complete Sale with All Optional Fields ==="
node cli.js \
  --sale-type PERSONAL_SALE \
  --discount-percent 50 \
  --valid-from 2025-01-01 \
  --expires-on 2025-01-31 \
  --product-group-sbs-id abc123def456 \
  --offering-id xyz789uvw012 \
  --coupon-code SALE50_COMPLETE \
  --coupon-name "Complete Sale Example" \
  --coupon-description "Example with all optional fields" \
  --offering-name "Complete Offering Example" \
  --offering-description "Example offering with all fields" \
  --offering-manager-email manager@example.com \
  --max-time-hours 24 \
  --bulk-id bulk123 \
  --created-by-category user \
  --created-by-id c7cacf20-6f79-4418-aaef-840d39312cd4 \
  --targeting "geo:US,language:en" \
  --status DRAFT \
  --qbo-offer-id qbo-offer-123 \
  --notes "This is a complete example with all fields"

