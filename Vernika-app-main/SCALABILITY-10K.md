# Vernika 2.0 — Free-Tier Realtime Capacity Plan

## Updated capacity result

The previous 10,000-user target has been replaced with a measured free-tier operating target based on the current Vernika database and listener design.

A read-only measurement of the live Firestore database found **42 documents** across the active business collections. The application currently opens **35 realtime listeners** for each authenticated browser session. Firestore charges the initial documents returned by a listener and has a minimum charge of one document read for an empty query [2]. The client also performs approximately four profile/authentication reads during login or session restoration.

Therefore the measured initial read estimate is:

```text
42 existing documents
+ 35 minimum listener/query reads
+ 4 authentication/profile reads
= 81 initial document reads per session
```

For a realistic working day, this plan budgets **20 additional realtime document updates per active user** and reserves 20% of the free quota for retries, reconnects, administrative activity, and measurement uncertainty:

```text
50,000 daily read quota × 80% safety budget = 40,000 usable reads
40,000 ÷ (81 initial reads + 20 updates) = 396 daily-active users
```

### Revised target

> **Vernika’s conservative free-tier target is 396 daily-active authenticated users, with an engineering target of approximately 100 simultaneously connected sessions.**

The 100-session figure is an operating target, not a Firebase guarantee. It leaves room for reconnects and uneven traffic within the 396 daily-active-user budget. It must be validated with real traffic because simultaneous sessions and daily-active users are different measures.

## Write-quota cross-check

The Firestore free tier documents **20,000 writes per day** [1] [2]. The read budget is the limiting factor under the measured workload, but writes still constrain activity:

| Average writes per active user per day | Approximate users before 80% write budget |
|---:|---:|
| 5 | 3,200 |
| 20 | 800 |
| 50 | 320 |
| 100 | 160 |

At 50 writes per active user per day, writes would reduce the safe population below the read-derived 396-user target. Therefore the application should operate below the 396-user ceiling until real write telemetry is available.

## Safeguard implemented in the application

Global Firestore listeners now use bounded queries. The employee listener is capped at 2,000 records and other global listeners are capped at 500 records. This prevents an unbounded snapshot from exhausting a browser, but it is not a substitute for scoped queries: a capped query can omit older records from a user’s view.

## Required next architecture stage

The application should now be optimized specifically for the revised **396 daily-active / approximately 100 concurrent session** target. Every large collection should be migrated from company-wide listeners to role- and scope-specific listeners. Employees should receive only their profile, assigned tasks, current attendance period, own leave and claims, permitted channels, direct messages, relevant notifications, and department summaries. Department heads should receive only their department and delegated team scope. Administrators should use paginated management queries and aggregate documents rather than listening to all raw event collections.

Large screens must use cursor pagination and explicit limits. Chat, typing, presence, meeting signaling, notifications, audit records, and activity logs need short-lived scoped queries and retention policies. High-contention counters should be sharded or pre-aggregated. Writes need client-generated idempotency keys, server-side authorization, bounded exponential retry, and audit logging that does not block the user interface.

## What the free tier cannot guarantee

The free tier cannot guarantee 10,000 simultaneous realtime users. Firestore’s documented free quota is 50,000 document reads per day, 20,000 document writes per day, 1 GiB storage, and 10 GiB monthly outbound transfer [1] [2]. The Firebase Realtime Database Spark plan separately documents a 100 simultaneous-connection limit [3]. The application therefore must not claim 10,000-user production capacity while remaining entirely free.

The calculated 396-user number is a conservative daily-active estimate for the **measured current dataset and assumed 20 updates per user**. It is not a permanent platform limit. As the database grows, every initial listener read grows unless the listener is scoped. As usage becomes more interactive, the update and write assumptions must be remeasured.

## Load-test gates

| Gate | Free-tier acceptance target |
|---|---:|
| Daily-active users | 396 maximum planning envelope |
| Simultaneous connected sessions | Approximately 100 engineering target |
| Initial dashboard reads | Below 101 per active session after scoped-query migration |
| Realtime p95 update latency | Measure and set a target during staged testing; no unsupported guarantee |
| Realtime error rate | Less than 1% in the test workload |
| Listener scope | No ordinary user listens to an unfiltered company-wide high-volume collection |
| Large result sets | Cursor pagination and explicit limits required |
| Write retries | Idempotent and bounded; no duplicate business records |
| Load stages | 25, 100, 250, and 396 daily-active/session-equivalent tests |

## References

1. [Cloud Firestore quotas and limits](https://firebase.google.com/docs/firestore/quotas)
2. [Cloud Firestore pricing and listener billing](https://firebase.google.com/docs/firestore/pricing)
3. [Firebase Realtime Database usage limits](https://firebase.google.com/docs/database/usage/limits)
4. [Firebase Authentication limits](https://firebase.google.com/docs/auth/limits)
