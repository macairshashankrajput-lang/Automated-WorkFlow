#!/usr/bin/env python3
import json
import pathlib
import requests

PROJECT = 'gen-lang-client-0833693805'
DATABASE = 'ai-studio-vernikaapp-8707d070-17aa-4c19-ac02-f2098c36884f'
TOKEN = json.loads((pathlib.Path.home() / '.config/configstore/firebase-tools.json').read_text())['tokens']['access_token']


def decode(value):
    if not isinstance(value, dict):
        return None
    return next(iter(value.values()), None)

for collection in ('clients', 'employees'):
    url = f'https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/{DATABASE}/documents/{collection}'
    response = requests.get(url, headers={'Authorization': f'Bearer {TOKEN}'}, params={'pageSize': 200}, timeout=30)
    print(f'{collection}: status={response.status_code}')
    payload = response.json()
    for document in payload.get('documents', []):
        fields = document.get('fields', {})
        values = {key: decode(fields.get(key)) for key in ('name', 'username', 'email', 'role', 'company', 'clientId', 'firebaseUid', 'loginEnabled')}
        text = ' '.join(str(value or '') for value in values.values()).lower()
        if any(term in text for term in ('radhe', 'foundation', 'rajnikant')):
            print(json.dumps({'document': document.get('name'), 'fields': values}, indent=2))
