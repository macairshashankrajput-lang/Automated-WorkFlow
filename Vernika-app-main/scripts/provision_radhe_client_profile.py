#!/usr/bin/env python3
"""Provision the canonical Radhe Foundation client profile. Safe to re-run via PATCH merge."""
from __future__ import annotations

import json
import pathlib
import requests

PROJECT = 'gen-lang-client-0833693805'
DATABASE = 'ai-studio-vernikaapp-8707d070-17aa-4c19-ac02-f2098c36884f'
UID = 'QUuuyYz6UJZbnklSP76vvNA1cNl2'
TOKEN = json.loads((pathlib.Path.home() / '.config/configstore/firebase-tools.json').read_text())['tokens']['access_token']
URL = f'https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/{DATABASE}/documents/clients/{UID}'

def string(value: str) -> dict[str, str]:
    return {'stringValue': value}

body = {
    'fields': {
        'name': string('Radhe Foundation'),
        'username': string('Radhe'),
        'email': string('radhe@vernika.io'),
        'role': string('client'),
        'company': string('Radhe Foundation'),
        'clientId': string(UID),
        'department': string('Executive Client'),
        'title': string('Client Lead'),
        'phone': string(''),
        'status': string('Active'),
        'accountManager': string('Vernika Account Team'),
        'joinedDate': string('2026-08-21'),
        'loginEnabled': {'booleanValue': True},
        'projects': {'arrayValue': {'values': []}},
        'allowedModules': {'arrayValue': {'values': [
            string('client_dashboard'), string('client_projects'), string('client_invoices'),
            string('client_deliverables'), string('client_support'), string('chat'), string('meetings')
        ]}},
    }
}
response = requests.patch(URL, headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'}, json=body, timeout=30)
print(json.dumps({'status': response.status_code, 'document': response.json().get('name'), 'error': response.json().get('error')}, indent=2))
response.raise_for_status()
