#!/usr/bin/env python3
"""Read-only Firestore REST simulation for Vernika's refactored dashboard profile.

This script sends no writes. It models one dashboard bootstrap as lightweight bounded
collection pages plus Firestore aggregation queries, not browser WebSocket listeners.
"""
from __future__ import annotations

import concurrent.futures
import json
import os
import time
from pathlib import Path
from typing import Any

import requests

PROJECT = os.environ.get("FIREBASE_PROJECT_ID", "gen-lang-client-0833693805")
DATABASE = os.environ.get("FIREBASE_DATABASE_ID", "ai-studio-vernikaapp-8707d070-17aa-4c19-ac02-f2098c36884f")
SESSIONS = int(os.environ.get("LOAD_TEST_SESSIONS", "100"))
TOKEN_FILE = Path.home() / ".config/configstore/firebase-tools.json"

# The dashboard keeps small configuration/notification listeners, a one-document
# background heartbeat for inactive context collections, and dedicated page queries.
CORE_PAGES: list[tuple[str, int]] = [
    ("departments", 100),
    ("positions", 100),
    ("notifications", 50),
]
# Inactive workspace histories are intentionally not subscribed on the dashboard.
BACKGROUND_COLLECTIONS: list[str] = []
DASHBOARD_PAGES: list[tuple[str, int]] = [
    ("announcements", 6),
    ("invoices", 12),
    ("auxLogs", 64),
]
AGGREGATES: list[tuple[str, list[dict[str, Any]], list[str]]] = [
    ("employees", [], []),
    ("attendance", [{"field": "date", "value": {"stringValue": time.strftime("%Y-%m-%d")}}], []),
    ("projects", [{"field": "status", "value": {"stringValue": "Active"}}], []),
    ("leads", [], ["value"]),
    ("invoices", [], ["total"]),
    ("leaves", [{"field": "status", "value": {"stringValue": "Pending"}}], []),
    ("announcements", [], []),
]


def percentile(values: list[float], fraction: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, int((len(ordered) - 1) * fraction)))
    return ordered[index]


def request_collection(token: str, collection: str, page_size: int, category: str) -> dict[str, Any]:
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/{DATABASE}/documents/{collection}"
    started = time.perf_counter()
    status = 0
    error = ""
    docs = 0
    try:
        response = requests.get(url, headers={"Authorization": f"Bearer {token}"}, params={"pageSize": page_size}, timeout=(10, 20))
        status = response.status_code
        payload = response.json()
        docs = len(payload.get("documents", [])) if isinstance(payload, dict) else 0
        if status >= 400:
            error = str(payload)[:200]
    except Exception as exc:
        error = repr(exc)
    return {"kind": category, "collection": collection, "status": status, "latency_ms": (time.perf_counter() - started) * 1000, "docs": docs, "error": error}


def request_aggregate(token: str, collection: str, filters: list[dict[str, Any]], sum_fields: list[str]) -> dict[str, Any]:
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/{DATABASE}/documents:runAggregationQuery"
    where_clause: dict[str, Any] | None = None
    if len(filters) == 1:
        item = filters[0]
        where_clause = {"fieldFilter": {"field": {"fieldPath": item["field"]}, "op": "EQUAL", "value": item["value"]}}
    elif filters:
        where_clause = {"compositeFilter": {"op": "AND", "filters": [
            {"fieldFilter": {"field": {"fieldPath": item["field"]}, "op": "EQUAL", "value": item["value"]}}
            for item in filters
        ]}}
    structured_query: dict[str, Any] = {"from": [{"collectionId": collection}]}
    if where_clause:
        structured_query["where"] = where_clause
    aggregations: list[dict[str, Any]] = [{"alias": "count", "count": {}}]
    aggregations.extend({"alias": f"sum_{field}", "sum": {"field": {"fieldPath": field}}} for field in sum_fields)
    payload = {"structuredAggregationQuery": {"structuredQuery": structured_query, "aggregations": aggregations}}
    started = time.perf_counter()
    status = 0
    error = ""
    try:
        response = requests.post(url, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, json=payload, timeout=(10, 20))
        status = response.status_code
        if status >= 400:
            error = response.text[:200]
    except Exception as exc:
        error = repr(exc)
    return {"kind": "aggregate", "collection": collection, "status": status, "latency_ms": (time.perf_counter() - started) * 1000, "docs": 0, "error": error}


def run_session(session_no: int, token: str) -> dict[str, Any]:
    started = time.perf_counter()
    jobs: list[tuple[str, tuple[Any, ...]]] = []
    jobs.extend(("collection", (token, name, size, "core")) for name, size in CORE_PAGES)
    jobs.extend(("collection", (token, name, 1, "background")) for name in BACKGROUND_COLLECTIONS)
    jobs.extend(("collection", (token, name, size, "dashboard-page")) for name, size in DASHBOARD_PAGES)
    jobs.extend(("aggregate", (token, name, filters, sum_fields)) for name, filters, sum_fields in AGGREGATES)

    def execute(job: tuple[str, tuple[Any, ...]]) -> dict[str, Any]:
        kind, args = job
        return request_collection(*args) if kind == "collection" else request_aggregate(*args)

    with concurrent.futures.ThreadPoolExecutor(max_workers=len(jobs)) as pool:
        results = list(pool.map(execute, jobs))
    return {"session": session_no, "latency_ms": (time.perf_counter() - started) * 1000, "requests": results}


def main() -> None:
    config = json.loads(TOKEN_FILE.read_text())
    token = config["tokens"]["access_token"]
    started = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=SESSIONS) as pool:
        sessions = list(pool.map(lambda number: run_session(number, token), range(1, SESSIONS + 1)))
    all_requests = [request for item in sessions for request in item["requests"]]
    session_latencies = [item["latency_ms"] for item in sessions]
    request_latencies = [item["latency_ms"] for item in all_requests]
    errors = [request for request in all_requests if request["status"] >= 400 or request["error"]]
    by_kind: dict[str, int] = {}
    for request in all_requests:
        by_kind[request["kind"]] = by_kind.get(request["kind"], 0) + 1
    report = {
        "test": "Vernika refactored dashboard read-model simulation",
        "project": PROJECT,
        "database": DATABASE,
        "sessions": SESSIONS,
        "requests_per_session": len(all_requests) // SESSIONS if SESSIONS else 0,
        "request_breakdown": by_kind,
        "total_requests": len(all_requests),
        "elapsed_seconds": round(time.perf_counter() - started, 3),
        "session_latency_ms": {"p50": round(percentile(session_latencies, .50), 2), "p95": round(percentile(session_latencies, .95), 2), "p99": round(percentile(session_latencies, .99), 2), "max": round(max(session_latencies or [0]), 2)},
        "request_latency_ms": {"p50": round(percentile(request_latencies, .50), 2), "p95": round(percentile(request_latencies, .95), 2), "p99": round(percentile(request_latencies, .99), 2), "max": round(max(request_latencies or [0]), 2)},
        "error_count": len(errors),
        "error_rate_percent": round((len(errors) / len(all_requests) * 100) if all_requests else 0, 3),
        "documents_returned": sum(request["docs"] for request in all_requests),
        "estimated_document_reads": sum(request["docs"] for request in all_requests),
        "quota_note": "Read-only REST model. Aggregate operations use Firestore aggregation endpoints; browser WebSocket listeners, Firebase Auth, security rules per end-user, and writes are outside this simulation.",
        "sample_errors": errors[:10],
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
