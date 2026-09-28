import json
import os
import sys
from pathlib import Path

import requests

PROJECT = os.environ.get('FIREBASE_PROJECT_ID', 'gen-lang-client-0833693805')
DATABASE = os.environ.get('FIREBASE_DATABASE_ID', '(default)')
TOKEN_FILE = Path.home() / '.config/configstore/firebase-tools.json'
COLLECTIONS = sys.argv[1:] or [
    'employees', 'departments', 'positions', 'auxLogs', 'tasks', 'announcements',
    'projects', 'chatMessages', 'chatChannels', 'chatTyping', 'emails', 'meetings',
    'clients', 'sheets', 'attendance', 'leaves', 'invoices', 'leads', 'contacts',
    'vendors', 'contracts', 'calendarEvents', 'payrolls', 'expenses', 'activityLogs',
    'performanceRecords', 'notifications', 'punchRequests', 'workflowProfiles',
    'employeeDocuments', 'globalFiles', 'inventory', 'okrs', 'auditLogs'
]

def main():
    config = json.loads(TOKEN_FILE.read_text())
    token = config['tokens']['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    total = 0
    rows = []
    for name in COLLECTIONS:
        url = f'https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/{DATABASE}/documents/{name}'
        response = requests.get(url, headers=headers, params={'pageSize': 1000}, timeout=30)
        if response.status_code != 200:
            rows.append((name, f'ERROR {response.status_code}', response.text[:120]))
            continue
        payload = response.json()
        docs = payload.get('documents', [])
        count = len(docs)
        total += count
        rows.append((name, count, 'capped' if 'nextPageToken' in payload else 'complete'))
    print(json.dumps({'project': PROJECT, 'database': DATABASE, 'collections': rows, 'total_documents_in_sample': total}, indent=2))

if __name__ == '__main__':
    main()
