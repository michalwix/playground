# Trino MCP Workflows

Query Wix data using Trino via MCP tools.

## MCP Tools

### omd-mcp
Operational/transactional data.
- Real-time or near-real-time
- Individual transactions, events
- Use for: "What happened to order X?"

### trino-mcp
Analytics warehouse data.
- Aggregated, historical
- Pre-computed metrics
- Use for: "What's the trend over time?"

---

## Query Workflow

### Step 1: Understand the Question
What is the PM actually trying to learn?

### Step 2: Generate Query
AI generates appropriate SQL based on question.

### Step 3: Adapt to Skill Level

**Technical PM:**
```
"Here's the query I'll run:

SELECT reason_code, COUNT(*) as cancellations
FROM premium.cancellations
WHERE cancelled_at >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY 1
ORDER BY 2 DESC;

Want to modify it before I run?"
```

**Guided PM:**
```
"I'll check the cancellation data from the last 30 days,
grouped by reason. Running now..."

[Run query]

"Here's what I found:
- 45% cancelled due to 'too expensive'
- 30% cancelled due to 'not using features'
- 25% other reasons"
```

**Hybrid PM:**
```
"Running a query to get cancellation reasons (last 30 days, grouped).
Here's what I found: [results]

Want to see the actual query or dig deeper?"
```

### Step 4: Explain Results
Always translate numbers into insights.

---

## Common Query Patterns

### Cancellation Analysis
```sql
SELECT
    reason_code,
    COUNT(*) as cancellations,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM premium.cancellations
WHERE cancelled_at >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY 1
ORDER BY 2 DESC;
```
**Explains:** Why are users cancelling?

### Upgrade Path Analysis
```sql
SELECT
    from_plan,
    to_plan,
    COUNT(*) as upgrades
FROM premium.upgrades
WHERE upgraded_at >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY 1, 2
ORDER BY 3 DESC;
```
**Explains:** Which upgrade paths are most common?

### Conversion Funnel
```sql
SELECT
    event_type,
    COUNT(DISTINCT session_id) as sessions
FROM checkout.conversion_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '7' DAY
GROUP BY 1
ORDER BY 2 DESC;
```
**Explains:** Where do users drop off in checkout?

### Subscription Trends
```sql
SELECT
    DATE_TRUNC('month', start_date) as month,
    COUNT(*) as new_subscriptions,
    COUNT(DISTINCT user_id) as unique_users
FROM billing.subscriptions
WHERE start_date >= DATE '2024-01-01'
GROUP BY 1
ORDER BY 1;
```
**Explains:** How are subscriptions trending over time?

---

## Query Best Practices

1. **Always use date filters** - Tables are huge, filter first
2. **Start with LIMIT** - Sample before full query
3. **Use DATE_TRUNC** - For time-based aggregations
4. **Check for NULLs** - Many columns are nullable
5. **Mind the timezone** - Dates are usually UTC

---

## Adapting to PM Skill Level

| PM Says | Skill Level | Response Style |
|---------|-------------|----------------|
| "Show me the query" | Technical | Show SQL, explain briefly |
| "Just tell me the answer" | Guided | Hide SQL, explain insights |
| "What does this mean?" | Guided | More context needed |
| "Can I modify the date range?" | Technical | Show query, let them edit |
| "Run it" | Hybrid | Run, show summary, offer details |

---

## When Query Fails

**Guided PM:**
```
"I couldn't get that data - looks like [reason].
Let me try a different approach..."
```

**Technical PM:**
```
"Query failed with: [error message]
Table might be: [suggestion]
Want me to check available tables?"
```

---

## Connecting Queries to Code

When PM asks "why is this number what it is?":

1. Show the data pattern
2. Offer to explore the code:
   ```
   "Want me to find where this logic lives in the codebase?"
   ```
3. Use octocode to find implementation
4. Connect data → code → explanation
