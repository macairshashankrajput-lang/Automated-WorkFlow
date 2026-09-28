# Vernika Refactored Dashboard Read-Model Simulation

## Scope

This read-only test simulated 100 concurrent executive-dashboard bootstraps after the cursor-pagination and aggregate-read-model refactor. Each session modeled the dashboard’s three bounded core pages (`departments`, `positions`, and `notifications`), three dedicated realtime dashboard pages (`announcements`, `invoices`, and `auxLogs`), and seven Firestore aggregate requests for the summary cards. Inactive historical AppContext collections are no longer subscribed while the dashboard is open.

No production business data was created, updated, or deleted.

## Result

| Metric | Result |
|---|---:|
| Concurrent simulated sessions | 100 |
| Requests per simulated dashboard | 13 |
| Total requests | 1,300 |
| Bounded core-page requests | 300 |
| Dashboard page requests | 300 |
| Aggregate-summary requests | 700 |
| Documents returned | 2,300 |
| Errors | 0 |
| Error rate | **0.0%** |
| Total elapsed time | 31.710 seconds |
| Request p50 | 2,008.52 ms |
| Request p95 | 2,505.02 ms |
| Request p99 | 2,880.90 ms |
| Session p50 | 18,395.00 ms |
| Session p95 | 29,913.68 ms |
| Session p99 | 30,431.59 ms |

## Interpretation

The new architecture reduced the dashboard’s initial data topology from **global historical listeners across approximately 35 collections** to **13 dashboard-specific read operations**. The dashboard now relies on paginated first pages for visible feeds and Firestore aggregation queries for counts and totals, while historical workspace listeners are deferred until their workspace is opened.

The test completed without request errors. However, the session p95 must not be treated as a browser load-time estimate: this simulator deliberately launched every REST operation independently and concurrently across 100 sessions, which creates a much harsher connection pattern than Firestore SDK listener multiplexing in a browser. It also does not measure authenticated user security rules, WebSocket listener reuse, cached local data, UI render time, writes, or cross-device propagation.

The result is therefore a successful **read-footprint and endpoint-resilience check**, not a certification of 100 concurrent browser dashboards. The next meaningful performance step is an authenticated browser/WebSocket scenario using the deployed application and representative user identities, followed by a staged 100-, 300-, and 1,000-session test after request batching or server-side dashboard materialization is available.

## Implementation Read-Footprint Changes

| Area | Previous behavior | Current behavior |
|---|---|---|
| Executive summary cards | Derived from full in-memory collections | Aggregate counts and sums queried directly from Firestore |
| Announcements, invoices, AUX matrix | Depended on AppContext-wide listeners | Small realtime first pages using cursor pagination primitives |
| Employee dashboard | Filtered global tasks, attendance, leaves, payroll, expenses, and mail arrays | User-scoped realtime first pages and aggregate counts/totals |
| Client dashboard | Filtered global projects and invoices arrays | Client-ID-scoped pages and financial aggregate totals |
| Dashboard bootstrap | Opened historical listeners for every AppContext collection | Opens only dashboard core listeners; workspace histories are deferred |
| Manual dashboard refresh | Recovered all collections | Refreshes only dashboard aggregate and paginated read models |

## Important Constraint

Firestore aggregate queries are lightweight summary reads but are not realtime listeners. Vernika refreshes them after local writes, when the tab becomes visible, on manual dashboard refresh, and on a 60-second reconciliation interval. The user’s own actionable list records remain realtime through scoped `onSnapshot` first pages.
