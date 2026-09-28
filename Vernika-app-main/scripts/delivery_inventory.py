from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

API_KEY = os.environ["VITE_FIREBASE_API_KEY"]
PROJECT = "gen-lang-client-0833693805"
DATABASE = "ai-studio-vernikaapp-8707d070-17aa-4c19-ac02-f2098c36884f"
ADMIN_EMAIL = os.environ.get("DELIVERY_ADMIN_EMAIL", "rajputsg@vernika.io")
ADMIN_PASSWORD = os.environ["DELIVERY_ADMIN_PASSWORD"]
OUT = Path(os.environ.get("DELIVERY_INVENTORY_DIR", "delivery-inventory"))
BASE = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/{DATABASE}/documents"
E2E_RE = re.compile(r"E2E[-_A-Z0-9]+", re.IGNORECASE)
DELIVERY_UIDS = set(json.loads(os.environ.get("DELIVERY_UIDS_JSON", "[]")))


def decode(value: dict[str, Any]) -> Any:
    if "nullValue" in value: return None
    if "booleanValue" in value: return value["booleanValue"]
    if "integerValue" in value: return int(value["integerValue"])
    if "doubleValue" in value: return value["doubleValue"]
    if "timestampValue" in value: return value["timestampValue"]
    if "stringValue" in value: return value["stringValue"]
    if "referenceValue" in value: return value["referenceValue"]
    if "arrayValue" in value: return [decode(v) for v in value["arrayValue"].get("values", [])]
    if "mapValue" in value: return {k: decode(v) for k, v in value["mapValue"].get("fields", {}).items()}
    return value


def document(doc: dict[str, Any]) -> dict[str, Any]:
    name = doc.get("name", "")
    return {"name": name, "id": name.rsplit("/", 1)[-1], "fields": {k: decode(v) for k, v in doc.get("fields", {}).items()}, "createTime": doc.get("createTime"), "updateTime": doc.get("updateTime")}


def sign_in() -> str:
    response = requests.post(f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "returnSecureToken": True}, timeout=30)
    response.raise_for_status()
    return response.json()["idToken"]


def get(session: requests.Session, url: str, **kwargs: Any) -> requests.Response:
    response = session.get(url, timeout=30, **kwargs)
    response.raise_for_status()
    return response


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    token = sign_in()
    session = requests.Session()
    session.headers.update({"Authorization": f"Bearer {token}"})
    collections = sorted({
        "activityLogs", "announcements", "attendance", "auditLogs", "auxLogs",
        "calendarEvents", "chatChannels", "chatMessages", "chatTyping", "clients",
        "contacts", "contracts", "departments", "emails", "employeeDocuments",
        "employees", "expenses", "globalFiles", "inventory", "invoices", "leads",
        "leaves", "meetings", "notifications", "okrs", "payrolls",
        "performanceRecords", "positions", "projects", "punchRequests", "sheets",
        "tasks", "vendors", "workflowProfiles", "admins",
    })
    snapshot: dict[str, list[dict[str, Any]]] = {}
    tagged: list[dict[str, Any]] = []
    for collection in collections:
        response = get(session, f"{BASE}/{collection}", params={"pageSize": 300})
        docs = [document(item) for item in response.json().get("documents", [])]
        snapshot[collection] = docs
        tagged.extend({"collection": collection, **item} for item in docs if E2E_RE.search(json.dumps(item, default=str)))
    profile_collections = {"employees", "clients", "admins"}
    non_delivery_profiles = []
    for collection in profile_collections:
        for item in snapshot.get(collection, []):
            if collection == "admins" and item["id"] in DELIVERY_UIDS:
                continue
            if collection in {"employees", "clients"} and item["id"] in DELIVERY_UIDS:
                continue
            non_delivery_profiles.append({"collection": collection, "id": item["id"], "fields": item["fields"]})
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    (OUT / f"firestore-snapshot-{stamp}.json").write_text(json.dumps({"project": PROJECT, "database": DATABASE, "collections": snapshot}, indent=2, default=str), encoding="utf-8")
    (OUT / f"tagged-e2e-records-{stamp}.json").write_text(json.dumps(tagged, indent=2, default=str), encoding="utf-8")
    (OUT / f"non-delivery-profiles-{stamp}.json").write_text(json.dumps(non_delivery_profiles, indent=2, default=str), encoding="utf-8")
    summary = {"project": PROJECT, "database": DATABASE, "collections": collections, "documentCount": sum(len(v) for v in snapshot.values()), "taggedE2ECount": len(tagged), "taggedE2EByCollection": {c: sum(1 for d in tagged if d["collection"] == c) for c in collections}, "nonDeliveryProfileCount": len(non_delivery_profiles), "deliveryUids": sorted(DELIVERY_UIDS), "outputDirectory": str(OUT), "timestamp": stamp}
    (OUT / "inventory-summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
