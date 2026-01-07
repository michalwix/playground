# How to Get and Read Trace Logs

## What is a Trace?

A trace shows the journey of a single request through our systems:
- Which services were called
- In what order
- How long each step took
- Any errors that occurred

## How to Get a Trace ID

### Step 1: Open DevTools
- Chrome: `Cmd+Option+I` (Mac) or `F12` (Windows)
- Go to **Network** tab

### Step 2: Perform the Action
- Do the action you want to trace (click upgrade, submit payment, etc.)
- Watch for API requests appearing in the Network tab

### Step 3: Find the Request ID
- Click on the relevant API request
- Go to **Headers** tab
- Look in **Response Headers** for:
  - `x-request-id`
  - `x-trace-id`
  - `x-correlation-id`
- Copy this ID

### Step 4: Open Trace Tool
Go to: `https://[your-trace-tool-url]/{request-id}`

---

## How to Read a Trace

### Trace Structure
```
[Request Start]
    │
    ├── [Service A] ─── 50ms
    │       │
    │       ├── [Service B] ─── 20ms
    │       │
    │       └── [Database Call] ─── 10ms
    │
    ├── [Service C] ─── 30ms
    │
    └── [Response] ─── Total: 110ms
```

### What to Look For

**1. Service Flow**
- Which services are called?
- In what order?
- Are there unexpected services?

**2. Timing**
- Total request time
- Time per service
- Where is the bottleneck?

**3. Errors**
- Red indicators = errors
- Look at error messages
- Check status codes (4xx, 5xx)

**4. Parallel vs Sequential**
- Are calls happening in parallel?
- Could they be parallelized?

---

## Common Patterns in Premium Flows

### Checkout Flow Trace
```
checkout-web (frontend)
    → checkout-service (backend)
        → pricing-service (get prices)
        → catalog-service (product info)
        → payment-provider (process payment)
            → [external payment gateway]
        → subscription-manager (create subscription)
        → features-manager (enable features)
```

### Upgrade Flow Trace
```
plans-funnel (frontend)
    → offering-service (get recommendations)
    → checkout-service (create session)
        → pricing-service (calculate proration)
        → subscription-manager (check current plan)
    → [payment flow...]
```

### Cancellation Flow Trace
```
plans-funnel (frontend)
    → subscription-manager (get subscription)
    → [retention service] (show offers)
    → subscription-manager (cancel)
        → billing-service (stop billing)
        → features-manager (revoke features)
```

---

## Debugging with Traces

### Finding Errors
1. Look for red/error spans
2. Check the error message
3. Note which service failed
4. Check the request payload

### Finding Slow Requests
1. Sort by duration
2. Find the longest span
3. Check if it's expected (external call?) or unexpected
4. Look for N+1 query patterns (many small calls)

### Comparing Traces
- Get trace from working case
- Get trace from broken case
- Compare: What's different?

---

## Questions to Ask When Reading Traces

1. **What triggered this?** (user action, background job, etc.)
2. **What was the intended outcome?** (what should have happened)
3. **What actually happened?** (what the trace shows)
4. **Where did it go wrong?** (error location)
5. **Why?** (error message, status code)

---

## Trace Tips for PMs

- You don't need to understand every service
- Focus on the flow and timing
- Errors are usually highlighted
- Ask engineering if something looks wrong
- Use traces to validate your understanding of flows
