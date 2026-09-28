# Urgent Release Test Findings

## Local preview

- URL: http://localhost:3000/
- Admin login with provided delivery profile rendered the authenticated Admin portal.
- Admin browser smoke test clicked all 26 visible navigation routes; each returned non-empty rendered content.
- Admin session sign-out returned to the login screen.
- Employee login with provided Nistha profile succeeded and rendered the Employee Portal.
- Employee session showed 16 active workspace apps, live status timer, AUX status buttons, punch clock, leave request area, notifications, and route navigation limited to the employee profile's allowed modules.
- Employee portal remained rendered after waiting several minutes during the observed session.

## Known release limitations observed from source and prior probes

- Virtual Meeting Rooms use browser media APIs and local/simulated fallback; no production WebRTC signaling/media service is deployed.
- Google Workspace callable Functions remain unavailable on Spark/free plan and are not part of this browser certification.
- Existing Firestore operational records can still be old if previously stored; production no longer seeds demo records, but cleanup requires an explicit retention/deletion policy.
