#!/usr/bin/env python3
import json
import os
import pathlib
import requests

api_key = os.environ.get('VITE_FIREBASE_API_KEY')
if not api_key:
    for line in pathlib.Path('.env').read_text().splitlines():
        if line.startswith('VITE_FIREBASE_API_KEY='):
            api_key = line.split('=', 1)[1].strip()
            break
if not api_key:
    raise SystemExit('VITE_FIREBASE_API_KEY is unavailable')

url = f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}'
email = os.environ.get('RADHE_EMAIL', 'radhe@vernika.io')
password = os.environ.get('RADHE_PASSWORD')
if not password:
    raise SystemExit('RADHE_PASSWORD is required; pass it through the environment')
response = requests.post(url, json={'email': email, 'password': password, 'returnSecureToken': True}, timeout=30)
payload = response.json()
print(json.dumps({'status': response.status_code, 'localId': payload.get('localId'), 'email': payload.get('email') or email, 'error': payload.get('error', {}).get('message') if response.status_code >= 400 else None}, indent=2))
