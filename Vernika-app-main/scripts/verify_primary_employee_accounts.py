#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import requests

PROJECT = 'gen-lang-client-0833693805'
DATABASE = 'ai-studio-vernikaapp-8707d070-17aa-4c19-ac02-f2098c36884f'
API_KEY = os.environ.get('VITE_FIREBASE_API_KEY')
if not API_KEY:
    raise SystemExit('VITE_FIREBASE_API_KEY is required')

accounts = [
    ('nistha@vernika.io', os.environ.get('NISTHA_PASSWORD', '')),
    ('aditya@vernika.io', os.environ.get('ADITYA_PASSWORD', '')),
]

for email, password in accounts:
    auth = requests.post(
        f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}',
        json={'email': email, 'password': password, 'returnSecureToken': True},
        timeout=30,
    )
    payload = auth.json()
    result = {'email': email, 'authStatus': auth.status_code, 'authError': payload.get('error', {}).get('message')}
    if auth.ok:
        uid = payload['localId']
        result['uid'] = uid
        profile = requests.get(
            f'https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/{DATABASE}/documents/employees/{uid}',
            headers={'Authorization': f"Bearer {payload['idToken']}"}, timeout=30,
        )
        result['profileStatus'] = profile.status_code
        result['profileExists'] = profile.status_code == 200
    print(json.dumps(result))
