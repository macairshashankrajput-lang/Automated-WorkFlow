#!/usr/bin/env python3
"""Read-only Firestore REST load simulation; never writes production data."""
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
COLLECTIONS = ["employees", "departments", "tasks", "notifications", "chatChannels"]
TOKEN_FILE = Path.home() / ".config/configstore/firebase-tools.json"


def percentile(values: list[float], fraction: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, int((len(ordered) - 1) * fraction)))
    return ordered[index]


def request_collection(token: str, collection: str) -> dict[str, Any]:
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/{DATABASE}/documents/{collection}"
    started = time.perf_counter()
    status = 0
    error = ""
    docs = 0
    try:
        response = requests.get(url, headers={"Authorization": f"Bearer {token}"}, params={"pageSize": 50}, timeout=(10, 20))
        status = response.status_code
        payload = response.json()
        docs = len(payload.get("documents", [])) if isinstance(payload, dict) else 0
        if status >= 400:
            error = str(payload)[:200]
    except Exception as exc:  # network failures are part of the measurement
        error = repr(exc)
    return {"collection": collection, "status": status, "latency_ms": (time.perf_counter() - started) * 1000, "docs": docs, "error": error}


def run_session(session_no: int, token: str) -> dict[str, Any]:
    started = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(COLLECTIONS)) as pool:
        results = list(pool.map(lambda name: request_collection(token, name), COLLECTIONS))
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
    status_counts: dict[str, int] = {}
    for request in all_requests:
        key = str(request["status"])
        status_counts[key] = status_counts.get(key, 0) + 1
    report = {
        "test": "Vernika read-only 100 concurrent session simulation",
        "project": PROJECT,
        "database": DATABASE,
        "sessions": SESSIONS,
        "collections_per_session": COLLECTIONS,
        "total_requests": len(all_requests),
        "elapsed_seconds": round(time.perf_counter() - started, 3),
        "session_latency_ms": {"p50": round(percentile(session_latencies, .50), 2), "p95": round(percentile(session_latencies, .95), 2), "p99": round(percentile(session_latencies, .99), 2), "max": round(max(session_latencies or [0]), 2)},
        "request_latency_ms": {"p50": round(percentile(request_latencies, .50), 2), "p95": round(percentile(request_latencies, .95), 2), "p99": round(percentile(request_latencies, .99), 2), "max": round(max(request_latencies or [0]), 2)},
        "error_count": len(errors),
        "error_rate_percent": round((len(errors) / len(all_requests) * 100) if all_requests else 0, 3),
        "status_counts": status_counts,
        "documents_returned": sum(request["docs"] for request in all_requests),
        "estimated_read_operations": len(all_requests),
        "quota_note": "Read-only REST simulation. It measures request concurrency, not browser WebSocket listener behavior or authenticated per-user Firestore rules.",
        "sample_errors": errors[:10],
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
