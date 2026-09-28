# Vernika 100-Session Load Test

## Scope

This was a read-only Firestore REST simulation of 100 concurrent session bootstraps. Each simulated session issued parallel bounded reads for `employees`, `departments`, `tasks`, `notifications`, and `chatChannels`, with `pageSize=50`. No production business records were created or modified.

## Results

| Metric | Result |
|---|---:|
| Concurrent simulated sessions | 100 |
| Total Firestore REST requests | 500 |
| Total elapsed time | 11.826 seconds |
| Documents returned | 1,900 |
| Error count | 0 |
| Error rate | 0.0% |
| Request p50 | 1,944.10 ms |
| Request p95 | 3,358.02 ms |
| Request p99 | 3,534.25 ms |
| Session p50 | 4,029.88 ms |
| Session p95 | 5,740.38 ms |
| Session p99 | 6,123.37 ms |
| Maximum session latency | 6,324.71 ms |

## Interpretation

The tested Firestore REST reads completed successfully with no HTTP errors or request exceptions. However, session bootstrap latency is not suitable for a smooth realtime production target: p95 was approximately 5.74 seconds and p99 approximately 6.12 seconds. The result demonstrates that 100 concurrent read bursts are tolerated in this environment, but it does not certify 100 browser WebSocket sessions or full application behavior.

The test does not measure browser rendering, Firebase Auth token exchange, Firestore `onSnapshot` listener behavior, reconnect storms, security-rule evaluation with individual user credentials, writes, notification delivery, WebRTC signaling, or actual multi-device UI propagation. It is therefore a baseline read-concurrency test, not a complete acceptance test.

## Next engineering gate

To reach the 300-session free-tier operating target, bootstrap must be reduced through role- and department-scoped queries, cursor pagination, aggregate read models, and deferred loading of secondary modules. The next baseline should repeat this test at 100 sessions with a target session p95 below 2,000 ms and p99 below 3,000 ms, then add authenticated browser listener and safe write tests in staging.
