import json, os, requests
from pathlib import Path
cfg=json.loads(Path('firebase-applet-config.json').read_text())
key=os.environ['VITE_FIREBASE_API_KEY']; r=requests.post(f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={key}',json={'email':'rajputsg@vernika.io','password':'8268#Shibu','returnSecureToken':True}); r.raise_for_status(); token=r.json()['idToken']
rules=Path('firestore.rules').read_text(); r=requests.post('https://tbofjzzufxqbwfmfapxh.supabase.co/functions/v1/deploy-rules',headers={'Authorization':f'Bearer {token}','apikey':os.environ['SUPABASE_KEY'],'Content-Type':'application/json'},json={'rules':rules},timeout=120); print(r.status_code,r.text[:1200]); r.raise_for_status()
