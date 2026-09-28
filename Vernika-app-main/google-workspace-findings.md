# Google Workspace integration findings

- Google Workspace connector UID: f8900a57-4bd7-46cc-83a3-5ebd2420a817. It was enabled after user confirmation. Authorized account: macair.shashankrajput@gmail.com.
- Read-only Google Drive access through `gws` works after enabling the connector. Available Drive files included existing spreadsheets such as Departments and Automation.
- `gws` supports Drive, Sheets, and Docs; generated docs guidance says create DOCX locally with python-docx and upload/convert with Drive. See /home/ubuntu/skills/gws-best-practices/SKILL.md and https://developers.google.com/workspace/docs/api/how-tos/move-text.
- Google Sheets API supports spreadsheets.create, spreadsheets.batchUpdate, and spreadsheets.values.batchUpdate. Official references: https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate and https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdate.
- Official Apps Script installable triggers reference: https://developers.google.com/apps-script/guides/triggers/installable.
- Existing Firebase project: gen-lang-client-0833693805. Production hosting: https://gen-lang-client-0833693805.web.app/.
- A new OAuth web client named Vernika 2.0 Workspace Sync was created in Google Auth Platform. Client ID is in local secret/config files only; do not expose OAuth secrets in output or commit them.
- The new client initially lacked a localhost callback. `http://localhost:40853` was added and saved as a redirect URI.
- Google Auth Platform audience is in Testing. macair.shashankrajput@gmail.com was added as an approved test user.
- A first OAuth attempt failed because the local file accidentally paired the new client ID with the old client secret. The CLI returned unauthorized_client. The matching new client secret still needs to be captured securely before retrying.
- Google OAuth consent for the requested Sheets/identity scopes was reached after adding the test user; the warning and consent screens were passed in the browser, but the local CLI token exchange failed due to the client-secret mismatch.
