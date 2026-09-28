#!/usr/bin/env python3
"""Execute the reviewed, backup-first Vernika production cleanup.

Only exact Firestore document names listed in a tagged-record backup are deleted.
No employee/profile documents are deleted by this script.
"""
from __future__ import annotations

import argparse
import json
import os
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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tagged-backup", required=True, type=Path)
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    tagged: list[dict[str, Any]] = json.loads(args.tagged_backup.read_text(encoding="utf-8"))
    names = sorted({item.get("name") for item in tagged if isinstance(item.get("name"), str)})
    if not names:
        raise SystemExit("Refusing cleanup: backup contains no exact document names")
    if not args.execute:
        print(json.dumps({"dryRun": True, "count": len(names), "documents": names}, indent=2))
        return

    credentials, _ = google.auth.load_credentials_from_file(
        CREDENTIALS,
        scopes=["https://www.googleapis.com/auth/datastore"],
    )
    session = AuthorizedSession(credentials)
    deleted: list[str] = []
    failures: list[dict[str, str]] = []
    for name in names:
        response = session.delete(f"https://firestore.googleapis.com/v1/{name}")
        if response.status_code in (200, 204):
            deleted.append(name)
        elif response.status_code == 404:
            deleted.append(name + " [already absent]")
        else:
            failures.append({"name": name, "status": str(response.status_code), "body": response.text[:500]})
    result = {"dryRun": False, "requested": len(names), "deleted": len(deleted), "failures": failures, "documents": deleted}
    print(json.dumps(result, indent=2))
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
