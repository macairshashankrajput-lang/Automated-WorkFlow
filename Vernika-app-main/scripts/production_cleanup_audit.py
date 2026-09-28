#!/usr/bin/env python3
"""Backup-first Firestore audit for Vernika production.

This script is read-only. It exports all documents containing an E2E marker and
reports duplicate employee identities; a separate reviewed cleanup step is
required before deletion.
"""
from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import google.auth
from google.auth.transport.requests import AuthorizedSession

PROJECT = os.environ.get("FIREBASE_PROJECT_ID", "gen-lang-client-0833693805")
DATABASE = os.environ.get(
    "FIRESTORE_DATABASE_ID",
    "ai-studio-vernikaapp-8707d070-17aa-4c19-ac02-f2098c36884f",
)
CREDENTIALS = os.environ.get(
    "GOOGLE_APPLICATION_CREDENTIALS",
    "/home/ubuntu/upload/gen-lang-client-0833693805-d6ada0a1d3db.json",
)
OUT = Path(os.environ.get("CLEANUP_AUDIT_DIR", "/home/ubuntu/vernika-project/production-audit-2026-08-21"))
BASE = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/{DATABASE}/documents"
E2E_RE = re.compile(r"E2E[-_A-Z0-9]+", re.IGNORECASE)


def decode_value(value: dict[str, Any]) -> Any:
    if "nullValue" in value:
        return None
    if "booleanValue" in value:
        return value["booleanValue"]
    if "integerValue" in value:
        return int(value["integerValue"])
    if "doubleValue" in value:
        return value["doubleValue"]
    if "timestampValue" in value:
        return value["timestampValue"]
    if "stringValue" in value:
        return value["stringValue"]
    if "referenceValue" in value:
        return value["referenceValue"]
    if "bytesValue" in value:
        return value["bytesValue"]
    if "arrayValue" in value:
        return [decode_value(v) for v in value["arrayValue"].get("values", [])]
    if "mapValue" in value:
        return {k: decode_value(v) for k, v in value["mapValue"].get("fields", {}).items()}
    return value


def decode_document(doc: dict[str, Any]) -> dict[str, Any]:
    name = doc.get("name", "")
    return {
        "name": name,
        "id": name.rsplit("/", 1)[-1] if name else None,
        "fields": {k: decode_value(v) for k, v in doc.get("fields", {}).items()},
        "createTime": doc.get("createTime"),
        "updateTime": doc.get("updateTime"),
    }


def contains_e2e(value: Any) -> bool:
    if isinstance(value, str):
        return bool(E2E_RE.search(value))
    if isinstance(value, dict):
        return any(contains_e2e(v) for v in value.values())
    if isinstance(value, list):
        return any(contains_e2e(v) for v in value)
    return False


def list_collections(session: AuthorizedSession) -> list[str]:
    result: list[str] = []
    token = None
    while True:
        body = {"pageSize": 1000}
        if token:
            body["pageToken"] = token
        response = session.post(f"{BASE}:listCollectionIds", json=body)
        response.raise_for_status()
        data = response.json()
        result.extend(data.get("collectionIds", []))
        token = data.get("nextPageToken")
        if not token:
            return sorted(set(result))


def list_documents(session: AuthorizedSession, collection: str) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    url = f"{BASE}/{collection}"
    token = None
    while True:
        params = {"pageSize": "300"}
        if token:
            params["pageToken"] = token
        response = session.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        result.extend(decode_document(d) for d in data.get("documents", []))
        token = data.get("nextPageToken")
        if not token:
            return result


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    credentials, _ = google.auth.load_credentials_from_file(
        CREDENTIALS,
        scopes=["https://www.googleapis.com/auth/datastore"],
    )
    session = AuthorizedSession(credentials)
    collections = list_collections(session)
    snapshot: dict[str, list[dict[str, Any]]] = {}
    tagged: list[dict[str, Any]] = []
    for collection in collections:
        docs = list_documents(session, collection)
        snapshot[collection] = docs
        for doc in docs:
            if contains_e2e(doc):
                tagged.append({"collection": collection, **doc})

    employees = snapshot.get("employees", [])
    by_identity: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    for doc in employees:
        fields = doc["fields"]
        keys = [fields.get("firebaseUid"), fields.get("email"), fields.get("userId")]
        identities = {str(v).strip().lower() for v in keys if isinstance(v, str) and v.strip()}
        for identity in identities:
            by_identity[identity].append(doc)
    duplicates = {
        identity: docs
        for identity, docs in by_identity.items()
        if len({d["name"] for d in docs}) > 1
    }

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    (OUT / f"firestore-snapshot-{stamp}.json").write_text(
        json.dumps({"project": PROJECT, "database": DATABASE, "collections": snapshot}, indent=2, default=str),
        encoding="utf-8",
    )
    (OUT / f"tagged-e2e-records-{stamp}.json").write_text(
        json.dumps(tagged, indent=2, default=str), encoding="utf-8"
    )
    (OUT / f"employee-identity-duplicates-{stamp}.json").write_text(
        json.dumps(duplicates, indent=2, default=str), encoding="utf-8"
    )
    summary = {
        "project": PROJECT,
        "database": DATABASE,
        "collections": collections,
        "documentCount": sum(len(v) for v in snapshot.values()),
        "taggedE2ECount": len(tagged),
        "taggedE2EByCollection": {c: sum(1 for d in tagged if d["collection"] == c) for c in collections},
        "duplicateIdentityCount": len(duplicates),
        "duplicateIdentities": sorted(duplicates),
        "outputDirectory": str(OUT),
    }
    (OUT / "audit-summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

