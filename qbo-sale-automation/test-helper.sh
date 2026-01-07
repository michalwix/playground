#!/bin/bash

# Test Helper Script for QBO Sale Automation
# This script helps test the CLI tool with non-production data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration (update these for your non-prod environment)
TEST_PRODUCT_GROUP_SBS_ID="${TEST_PRODUCT_GROUP_SBS_ID:-test-product-group-sbs-id}"
TEST_OFFERING_ID="${TEST_OFFERING_ID:-test-offering-id}"
TEST_MANAGER_EMAIL="${TEST_MANAGER_EMAIL:-test@example.com}"
FIRE_CONSOLE_HOST="${FIRE_CONSOLE_HOST:-localhost:8080}"
FIRE_CONSOLE_TOKEN="${FIRE_CONSOLE_TOKEN:-}"

# Generate unique coupon code
generate_coupon_code() {
    local prefix="${1:-TEST}"
    echo "${prefix}_$(date +%s)_$$"
}

# Test 1: Simple percent discount
test_simple_percent() {
    echo -e "${GREEN}=== Test 1: Simple Percent Discount ===${NC}"
    
    local coupon_code=$(generate_coupon_code "TEST_SIMPLE")
    
    node cli.js \
        --sale-type PERSONAL_SALE \
        --discount-percent 50 \
        --valid-from 2025-01-01 \
        --expires-on 2025-12-31 \
        --product-group-sbs-id "$TEST_PRODUCT_GROUP_SBS_ID" \
        --offering-id "$TEST_OFFERING_ID" \
        --coupon-code "$coupon_code" \
        --offering-manager-email "$TEST_MANAGER_EMAIL" \
        --status DRAFT
    
    echo -e "${GREEN}✓ Generated files for: $coupon_code${NC}"
    echo ""
}

# Test 2: Multi-cycle discount
test_multi_cycle() {
    echo -e "${GREEN}=== Test 2: Multi-Cycle Discount ===${NC}"
    
    local coupon_code=$(generate_coupon_code "TEST_MULTI")
    
    node cli.js \
        --sale-type SEASONAL_SALE \
        --discount-percent 50 \
        --valid-from 2025-01-01 \
        --expires-on 2025-12-31 \
        --product-group-sbs-id "$TEST_PRODUCT_GROUP_SBS_ID" \
        --offering-id "$TEST_OFFERING_ID" \
        --coupon-code "$coupon_code" \
        --offering-manager-email "$TEST_MANAGER_EMAIL" \
        --cycles 2 \
        --interval YEARLY \
        --count 2 \
        --status DRAFT
    
    echo -e "${GREEN}✓ Generated files for: $coupon_code${NC}"
    echo ""
}

# Test 3: Validation errors
test_validation() {
    echo -e "${YELLOW}=== Test 3: Validation (should fail) ===${NC}"
    
    # Missing required field
    node cli.js \
        --sale-type PERSONAL_SALE \
        --discount-percent 50 \
        2>&1 | grep -q "required" && echo -e "${GREEN}✓ Validation working correctly${NC}" || echo -e "${RED}✗ Validation failed${NC}"
    
    echo ""
}

# Test 4: Dry run
test_dry_run() {
    echo -e "${GREEN}=== Test 4: Dry Run ===${NC}"
    
    local coupon_code=$(generate_coupon_code "TEST_DRY")
    
    node cli.js \
        --sale-type PERSONAL_SALE \
        --discount-percent 50 \
        --valid-from 2025-01-01 \
        --expires-on 2025-12-31 \
        --product-group-sbs-id "$TEST_PRODUCT_GROUP_SBS_ID" \
        --offering-id "$TEST_OFFERING_ID" \
        --coupon-code "$coupon_code" \
        --dry-run
    
    echo -e "${GREEN}✓ Dry run completed (no files saved)${NC}"
    echo ""
}

# Test 5: Verify generated files
test_file_verification() {
    echo -e "${GREEN}=== Test 5: File Verification ===${NC}"
    
    local fireconsole_file=$(ls -t output/*_fireconsole.json 2>/dev/null | head -1)
    local dealer_file=$(ls -t output/*_dealer.json 2>/dev/null | head -1)
    
    if [ -z "$fireconsole_file" ] || [ -z "$dealer_file" ]; then
        echo -e "${RED}✗ No generated files found${NC}"
        return 1
    fi
    
    # Check FireConsole payload structure
    if jq -e '.coupon.code' "$fireconsole_file" > /dev/null 2>&1 && \
       jq -e '.coupon.metadata.isSale' "$fireconsole_file" > /dev/null 2>&1 && \
       jq -e '.coupon.metadata.saleId' "$fireconsole_file" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ FireConsole payload structure valid${NC}"
    else
        echo -e "${RED}✗ FireConsole payload structure invalid${NC}"
        return 1
    fi
    
    # Check Dealer template structure
    if jq -e '.sale_type' "$dealer_file" > /dev/null 2>&1 && \
       jq -e '.coupon_code' "$dealer_file" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Dealer template structure valid${NC}"
    else
        echo -e "${RED}✗ Dealer template structure invalid${NC}"
        return 1
    fi
    
    echo ""
}

# Test 6: Send to FireConsole (if token provided)
test_fireconsole_send() {
    if [ -z "$FIRE_CONSOLE_TOKEN" ]; then
        echo -e "${YELLOW}=== Test 6: FireConsole Send (skipped - no token) ===${NC}"
        echo -e "${YELLOW}Set FIRE_CONSOLE_TOKEN to test FireConsole integration${NC}"
        echo ""
        return 0
    fi
    
    echo -e "${GREEN}=== Test 6: FireConsole Send ===${NC}"
    
    local fireconsole_file=$(ls -t output/*_fireconsole.json 2>/dev/null | head -1)
    
    if [ -z "$fireconsole_file" ]; then
        echo -e "${RED}✗ No FireConsole file found${NC}"
        return 1
    fi
    
    local coupon_code=$(jq -r '.coupon.code' "$fireconsole_file")
    
    echo -e "${YELLOW}Sending to FireConsole: $FIRE_CONSOLE_HOST${NC}"
    
    local response=$(curl -s -w "\n%{http_code}" -X POST \
        "http://${FIRE_CONSOLE_HOST}/api/v1/coupons" \
        -H "Content-Type: application/json" \
        -H "Authorization: $FIRE_CONSOLE_TOKEN" \
        -H "X-Wix-Request-Id: $(uuidgen 2>/dev/null || echo "test-$(date +%s)")" \
        -H "User-Agent: FireConsole/1.0" \
        -d @"$fireconsole_file")
    
    local http_code=$(echo "$response" | tail -1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✓ Coupon created successfully: $coupon_code${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ Failed to create coupon (HTTP $http_code)${NC}"
        echo "$body"
        return 1
    fi
    
    echo ""
}

# Main test runner
main() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}QBO Sale Automation - Test Suite${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    # Create output directory
    mkdir -p output
    
    # Run tests
    test_simple_percent
    test_multi_cycle
    test_validation
    test_dry_run
    test_file_verification
    test_fireconsole_send
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Test Suite Complete${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Generated files in: ./output/"
    echo ""
    echo "To test FireConsole integration, set:"
    echo "  export FIRE_CONSOLE_HOST=your-host:8080"
    echo "  export FIRE_CONSOLE_TOKEN=your-token"
    echo ""
}

# Run if called directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi




