# Helpful Links & Resources

> **Rule:** Only provide links from this reference. NEVER guess or construct URLs.

---

## Monitoring & Traces

### Getting a Trace

1. Open browser DevTools → Network tab
2. Perform the action (upgrade, purchase, etc.)
3. Find the API request
4. Go to Response Headers → copy `x-wix-request-id`

### Viewing Trace Logs

**Grafana Error Analytics:**
```
https://grafana.wixpress.com/d/38cCoLymz/error-analytics-traceid
```

**Steps:**
1. Paste the `x-wix-request-id` in the search
2. Find the trace in access logs
3. Click 3 dots → Inspect → Data
4. Download CSV for analysis

---

## Production Flows (for Testing/Observing)

### Plans Package Picker
```
https://manage.wix.com/wix/api/premiumStart?siteGuid={msid}&referralAdditionalInfo=bizMgrHeader
```
Replace `{msid}` with the site's metaSiteId.

### Domains Settings
```
https://manage.wix.com/dashboard/{msid}/domain-settings?referralInfo=site-details-subscriptions-widget
```
Replace `{msid}` with the site's metaSiteId.

### How to Get a metaSiteId
- From URL: Look for GUID in `manage.wix.com/dashboard/{msid}/...`
- From trace: Check `meta_site_id` column in logs
- Ask PM: "What site are you testing on?"

---

## Code Repos

**DO NOT provide direct GitHub links to PMs.**

Instead, use octocode to find code and provide:
- File path
- Line numbers
- Code snippets

The skill's architecture docs (`references/*.md`) contain repo names for octocode searches.

---

## When PM Needs a Link You Don't Have

Say:
```
I don't have a documented link for that.
Can you share where you usually access this,
and I'll add it to my reference for next time?
```
