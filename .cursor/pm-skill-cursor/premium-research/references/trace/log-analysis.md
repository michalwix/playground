# Log & Trace Analysis Guide

> **Key Principle:** Combine trace analysis with codebase exploration. Extract service names from logs, then use octocode to find the code, understand the logic, and connect the dots.

---

## Trace CSV Structure

When you paste trace logs from Wix monitoring tools, expect this CSV structure:

| Column | Description | Investigation Value |
|--------|-------------|---------------------|
| `timestamp` | When the log occurred | Timeline ordering |
| `artifact_id` | Service that logged this | **KEY:** Identifies the service |
| `transaction_name` | Method/operation called | **KEY:** Shows the code path |
| `level` | INFO, DEBUG, WARN, ERROR | Filter for errors |
| `dc` | Data center (e.g., `uw2-edt-1`) | Geographic routing |
| `message` | Log message content | **KEY:** Business logic details |
| `data` | Structured JSON data | Request/response details |
| `data_duration` | Duration in milliseconds | **KEY:** Performance issues |
| `segment` | Environment (prod, Editor) | Filter by context |
| `error_type` | Error classification | **KEY:** Error investigation |
| `meta_site_id` | Wix site ID | Track specific user |
| `caller` | **Who called this service** | **GOLD:** Caller-callee discovery |
| `logger_name` | Logger class | Code location hint |
| `stack_trace` | Error stack trace | **KEY:** Debug errors |
| `pod_name` | Kubernetes pod | Instance-specific issues |

---

## The Combined Investigation Power

```
┌─────────────────────────────────────────────────────────────────────┐
│ TRACE + CODEBASE COMBINED WORKFLOW                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. PARSE TRACE                                                     │
│     → Extract: artifact_id, caller, transaction_name                │
│     → Build: Timeline of service calls                              │
│     → Identify: Errors, slow calls, anomalies                       │
│                                                                     │
│  2. MAP SERVICES                                                    │
│     → artifact_id → Service name (e.g., com.wixpress.X → X)        │
│     → caller column → Who initiated this call                      │
│     → Build caller → callee chain                                  │
│                                                                     │
│  3. EXPLORE CODE (Octocode)                                         │
│     → Search for service name in wix-private                       │
│     → Find the transaction_name method                             │
│     → Understand what the code does                                │
│                                                                     │
│  4. CONNECT THE DOTS                                                │
│     → Why did this service call that one?                          │
│     → What condition triggers this code path?                      │
│     → Where does the error actually originate?                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Parse the Trace

### Extract Key Information

From each log line, extract:

```
artifact_id:        com.wixpress.identity.identification
                    ↓
Service name:       identification

transaction_name:   IdentificationServiceV2/extractIdentityWithServerSigner
                    ↓
Method:             extractIdentityWithServerSigner

caller:             premium-store
                    ↓
Called by:          premium-store service
```

### Build the Timeline

Sort by timestamp (descending = most recent first, ascending = flow order):

```
09:49:50.355 | identification    | extractIdentityWithServerSigner | caller: premium-store
09:49:50.382 | identification    | setIdentityContext              | caller: premium-store
09:49:50.426 | authorization     | AbacV2 comparison               | caller: unknown
09:49:50.486 | identification    | extractIdentityWithServerSigner | caller: premium-store
09:49:50.568 | meta-site-manager | MetaSiteReadApi/get             | caller: premium-store
```

### Identify the Flow

From the trace above:
```
premium-store
    → calls identification (for identity extraction)
    → calls authorization (for permission check)
    → calls meta-site-manager (for site data)
```

---

## Step 2: Map Services to Code

### Common Artifact → Repo Mapping

| artifact_id Pattern | Likely Repo |
|---------------------|-------------|
| `com.wixpress.premium-store` | wix-private/premium-store |
| `com.wixpress.identity.identification` | wix-private/identification |
| `com.wixpress.wix-meta-site-manager-webapp` | wix-private/wix-meta-site-manager |
| `com.wixpress.authorization-server` | wix-private/authorization-server |
| `com.wixpress.premium.*` | wix-private/premium/* |
| `com.wixpress.billing.*` | wix-p/premium-billing/* |

### Using the `caller` Column

The `caller` column is **gold** for understanding service relationships:

```
caller: premium-store
↓
This service was called BY premium-store

Combined with artifact_id:
premium-store → identification
```

---

## Step 3: Explore Code with Octocode

### Find the Service

```
# From artifact_id: com.wixpress.identity.identification
octocode search:
  owner=wix-private
  keywords=["identification", "IdentificationService"]
  match="path"
```

### Find the Specific Method

```
# From transaction_name: extractIdentityWithServerSigner
octocode search:
  owner=wix-private
  repo=identification
  keywords=["extractIdentityWithServerSigner"]
  match="file"
```

### Find Who Calls This Service

```
# From caller: premium-store → wants to find the calling code
octocode search:
  owner=wix-private
  repo=premium-store
  keywords=["identification", "IdentificationService"]
  match="file"
```

---

## Step 4: Connect the Dots

### Investigation Patterns

**Pattern A: "Why did this fail?"**
```
1. Find ERROR level logs in trace
2. Extract artifact_id and transaction_name
3. Octocode: Find the method that threw the error
4. Read the code: What conditions cause this error?
5. Check caller: What input did the caller send?
```

**Pattern B: "Why is this slow?"**
```
1. Sort by data_duration (descending)
2. Find the slowest calls
3. Octocode: Find the method implementation
4. Look for: DB calls, external service calls, loops
5. Check if this is normal or an anomaly
```

**Pattern C: "What's the full flow?"**
```
1. Build timeline from trace
2. Extract unique (caller → artifact_id) pairs
3. Build service call graph
4. Octocode: Explore each service to understand why it calls the next
5. Check architecture docs for expected flow
```

---

## Example Investigation

### Trace Shows:
```csv
timestamp,artifact_id,caller,message
09:49:50.568,meta-site-manager,premium-store,GetRequest for msId ec49df22...
09:49:50.426,authorization-server,unknown,Calling AbacV2 for viewSiteOffering
```

### Questions to Answer:
1. Why does premium-store call meta-site-manager?
2. What permission is being checked?

### Investigation:

**Step 1:** Search for the call in premium-store
```
octocode: keywords=["MetaSiteReadApi", "get"] in premium-store
```

**Step 2:** Find what triggers this
```
octocode: keywords=["viewSiteOffering"] in premium-store
→ Finds: authorization check before showing offerings
```

**Step 3:** Connect to architecture
```
→ Check caller-callee.md: premium-store → meta-site-manager (confirmed)
→ This is the "get site info before showing offerings" flow
```

---

## Supported Input Formats

### 1. CSV (Primary - from monitoring tools)

Header row + comma-separated values:
```csv
"timestamp","artifact_id","transaction_name","level",...
2025-12-08 09:49:50.726,com.wixpress.identity.identification,...
```

### 2. JSON Lines (from log exports)

One JSON object per line:
```json
{"timestamp":"2025-12-08T09:49:50","artifact_id":"com.wixpress.premium-store","message":"..."}
```

### 3. Raw Text (copy-pasted logs)

```
[2025-12-08 09:49:50] INFO com.wixpress.premium-store: GetCheckoutData called
```

---

## What to Look For

### Error Patterns

| Log Pattern | Meaning | Next Step |
|-------------|---------|-----------|
| `level=ERROR` | Something failed | Check stack_trace, find in code |
| `error_type` not empty | Classified error | Search error type in code |
| `data_duration` > 1000ms | Slow call | Find what's causing delay |
| `stack_trace` present | Exception thrown | Read stack, find root cause |

### Flow Patterns

| Pattern | What It Tells You |
|---------|-------------------|
| Same `caller` across multiple services | One request's journey |
| Same `meta_site_id` | Tracking one user's session |
| Sequential timestamps | Order of operations |
| Missing expected service | Failure before reaching it |

### Red Flags

| Flag | Investigation |
|------|---------------|
| Retries (same call repeated) | Find retry logic, check why first failed |
| Long gaps in timeline | Service took too long or call was dropped |
| authorization-server + deny | Permission issue, check ABAC rules |
| Unexpected caller | Service coupling changed? Check code |

---

## Output Format

After analyzing a trace, present:

### 1. Flow Summary
```
Request: createOrderPage for site ec49df22...
Flow: premium-store → identification → authorization → meta-site-manager
Duration: 371ms total
Status: Success
```

### 2. Service Map
```
premium-store (initiator)
├── identification (3 calls, 135ms)
├── authorization (1 call, 44ms)
└── meta-site-manager (1 call, 3ms)
```

### 3. Key Findings
- All calls succeeded (no ERROR level)
- Longest call: identification/extractIdentityWithServerSigner (97ms)
- Caller pattern: premium-store drives the flow

### 4. Code Locations (from Octocode)
- premium-store/createOrderPage: `wix-private/premium-store/src/...`
- identification calls: `wix-private/identification/src/...`

### 5. Next Steps
- Want to understand the identification logic? → Explore that code
- Want to see what happens after this? → Get downstream trace
