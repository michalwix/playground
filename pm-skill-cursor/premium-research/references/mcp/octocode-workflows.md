# Octocode MCP Workflows

Navigate Wix codebases using GitHub API via octocode MCP.

## Wix GitHub Organizations

### wix-private (Main Wix Codebase)
- Premium repos, Wix infra, all Wix systems
- Frontend AND backend code
- **Use for:** Plans funnels, offering service, catalog, features manager, platform services

### wix-p (Billing Core)
- Main billing repo: `wix-p/premium-billing`
- **SBS (wix-billing)** - Core billing system, the major/legacy system
- **BASS** - New billing system (replacing SBS)
- **Use for:** Checkout, payments, invoices, orders, subscriptions

### Quick Reference

| Need to find... | Search in |
|-----------------|-----------|
| Funnel/frontend code | `wix-private` |
| Platform services (offering, catalog, features) | `wix-private` |
| Billing/payments | `wix-p/premium-billing` |
| SBS core logic | `wix-p/premium-billing` |
| BASS new system | `wix-p/premium-billing` |

---

## Tool Chain

### 1. githubSearchCode
Find code by keywords.

```
Search for: "checkout" in wix-p/premium-billing
→ Returns file paths matching the keyword
```

### 2. githubViewRepoStructure
Understand directory layout.

```
Explore: wix-p/premium-billing, path: "src/"
→ Returns folder structure, helps orient
```

### 3. githubGetFileContent
Read specific files.

```
Read: wix-p/premium-billing, path: "src/checkout/service.ts"
→ Returns file content
```

---

## Local vs Remote Decision

```
Is the code in YOUR CURRENT REPO (where skill runs)?
    ↓
YES → Use local tools (Grep, Glob, Read) - FASTER
    ↓
NO  → Use octocode MCP
```

**Local tools are 10x faster** - always prefer when possible.

---

## Smart Clone Suggestion

Track which remote repos PM queries frequently.

**After 3+ searches in same remote repo, suggest:**

```
"I notice you're frequently exploring [repo-name].
Want to clone it locally for faster research?

To clone:
git clone git@github.com:[org]/[repo-name].git ~/repos/[repo-name]

Then tell me the path and I'll search it directly next time."
```

**Save clone locations in session:**
```yaml
local_repos:
  - name: premium-billing
    path: ~/repos/premium-billing
  - name: offering-service
    path: ~/repos/offering-service
```

---

## Common Workflows

### "Where does X happen?"

1. Search for keyword: `githubSearchCode(keywords: ["X"])`
2. Review file paths returned
3. Read promising files: `githubGetFileContent(path: "...")`
4. Explain to PM in plain terms

### "How does Service A call Service B?"

1. Search Service A for Service B references
2. Look for: imports, API calls, client instantiation
3. Follow the call chain
4. Draw flow diagram for PM

### "What changed recently in X?"

1. Use `githubSearchPullRequests` to find recent PRs
2. Filter by: merged, keywords in title/body
3. Review PR descriptions and diffs
4. Summarize changes for PM

---

## Example: "How does checkout call SBS?"

```
1. githubSearchCode(
     owner: "wix-p",
     repo: "premium-billing",
     keywords: ["checkout", "sbs"]
   )
   → Found: src/checkout/sbs-client.ts

2. githubGetFileContent(
     owner: "wix-p",
     repo: "premium-billing",
     path: "src/checkout/sbs-client.ts"
   )
   → Read the integration code

3. Explain to PM:
   "Checkout calls SBS through an internal client at src/checkout/sbs-client.ts.
    It sends order data via gRPC and waits for billing confirmation."
```

---

## Tips

- **Start broad, narrow down** - Search first, then read specific files
- **Follow imports** - When reading code, trace where dependencies come from
- **Check tests** - Test files often explain expected behavior
- **Look at PRs** - Recent PRs show what's actively changing
