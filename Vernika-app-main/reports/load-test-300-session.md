# Vernika 300-Session Load Test

## Scope

This was a read-only Firestore REST simulation of 300 concurrent session bootstraps. Each simulated session issued five parallel bounded reads for `employees`, `departments`, `tasks`, `notifications`, and `chatChannels` with `pageSize=50`. No production business records were created or modified.

## Results

| Metric | Result |
|---|---:|
| Concurrent simulated sessions | 300 |
| Total Firestore REST requests | 1,500 |
| Total elapsed time | 34.309 seconds |
| Documents returned | 5,700 |
| Errors | 0 |
| Error rate | **0.0%** |
| Request p50 | 1,856.09 ms |
| Request p95 | **2,328.08 ms** |
| Request p99 | **2,678.47 ms** |
| Maximum request latency | 2,802.41 ms |
| Session p50 | 6,864.75 ms |
| Session p95 | **14,453.31 ms** |
| Session p99 | **16,990.29 ms** |
| Maximum session latency | 27,856.50 ms |
| Estimated read operations | 1,500 |

## Interpretation

The bounded REST reads completed with zero HTTP errors at 300 concurrent simulated sessions. However, session bootstrap latency degraded substantially: p95 was approximately 14.45 seconds and p99 approximately 16.99 seconds. This fails a smooth realtime-session target even though the request-level error rate was 0%.

The session tail is inflated by launching five parallel REST requests per simulated session and measuring the full session completion time under 300-way concurrency. The test therefore demonstrates that Firestore accepted the concurrent read burst, but that the current bootstrap pattern is too slow for a polished 300-session experience.

This test does not measure browser rendering, Firebase Auth exchange, Firestore `onSnapshot` WebSocket behavior, reconnect storms, writes, notification delivery, security rules with 300 separate identities, WebRTC, or actual multi-device UI propagation. It is a concurrent bounded-read baseline, not a production-capacity certification.

## Capacity conclusion

The current 300-session free-tier target is not certified for smooth application use. Zero errors is positive, but p95/p99 session latency is too high. Before claiming 300 realtime users, Vernika should reduce initial reads through role- and department-scoped queries, defer secondary modules, paginate large collections, use aggregate read models, and test authenticated browser listeners separately. The next acceptance gate should target session p95 below 2,000 ms and p99 below 3,000 ms under the same workload, with a measured reconnect and write scenario.
