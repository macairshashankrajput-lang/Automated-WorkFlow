const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1IUhKLwiXsDqdQEsML9zu4kcYXE1taQsRcVeG8-T1inc',
  APP_WEBHOOK_URL: 'https://us-central1-gen-lang-client-0833693805.cloudfunctions.net/workspaceSyncWebhook',
  API_INVENTORY_SHEET: 'API Inventory',
  LOG_SHEET: 'Application Logs',
  QUEUE_SHEET: 'Sync Queue',
  HEADER_ROW: 1,
  MANAGED_SHEETS: ['Employees', 'Departments', 'Positions', 'Projects', 'Tasks', 'Attendance', 'Leaves', 'Claims', 'Mail', 'Messenger', 'CRM', 'Billing', 'Payroll', 'Documents', 'Notifications', 'AUX Logs', 'Clients', 'Meetings', 'Activity Logs', 'Application Logs', 'Sync Queue', 'API Inventory'],
});

/** Run once from the bound spreadsheet to install the least-privilege triggers. */
function setupVernikaBridge() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  ensureManagedSheets(spreadsheet);
  ScriptApp.getProjectTriggers().forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('onVernikaEdit').forSpreadsheet(spreadsheet).onEdit().create();
  ScriptApp.newTrigger('reconcileVernikaWorkbook').timeBased().everyMinutes(15).create();
  professionalFormatAllSheets();
  appendAudit('bridge_setup', 'success', { spreadsheetId: CONFIG.SPREADSHEET_ID });
}

function onVernikaEdit(event) {
  if (!event || !event.range) return;
  const sheet = event.range.getSheet();
  const sheetName = sheet.getName();
  if ([CONFIG.LOG_SHEET, CONFIG.QUEUE_SHEET].includes(sheetName) || event.range.getRow() <= CONFIG.HEADER_ROW) return;
  const payload = {
    direction: 'sheets_to_application',
    sheetName,
    rowNumber: event.range.getRow(),
    columnNumber: event.range.getColumn(),
    headers: sheet.getRange(CONFIG.HEADER_ROW, 1, 1, sheet.getLastColumn()).getValues()[0],
    rowValues: sheet.getRange(event.range.getRow(), 1, 1, sheet.getLastColumn()).getValues()[0],
    editedAt: new Date().toISOString(),
  };
  enqueue(payload);
  postToApplication(payload);
  professionalFormatSheet(sheet);
}

function reconcileVernikaWorkbook() {
  professionalFormatAllSheets();
  const queue = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.QUEUE_SHEET);
  if (!queue) return;
  const values = queue.getDataRange().getValues();
  if (values.length <= 1) return;
  values.slice(1).filter(row => row[4] === 'pending').forEach((row, index) => {
    let stored = {};
    try { stored = JSON.parse(row[3] || '{}'); } catch (error) { stored = {}; }
    const payload = { ...stored, queueId: row[0], sheetName: row[1], rowNumber: row[2], queuedAt: row[5], retry: true };
    const ok = Array.isArray(payload.headers) && Array.isArray(payload.rowValues) && postToApplication(payload);
    queue.getRange(index + 2, 5).setValue(ok ? 'sent' : 'retry');
    queue.getRange(index + 2, 6).setValue(new Date().toISOString());
  });
}

function enqueue(payload) {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.QUEUE_SHEET);
  if (!sheet) return;
  sheet.appendRow([Utilities.getUuid(), payload.sheetName, payload.rowNumber || '', JSON.stringify(payload), 'pending', new Date().toISOString()]);
}

function postToApplication(payload) {
  try {
    const response = UrlFetchApp.fetch(CONFIG.APP_WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'X-Vernika-Signature': signPayload(payload) },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    const status = response.getResponseCode();
    appendAudit('sheet_edit_webhook', status >= 200 && status < 300 ? 'success' : 'failed', { sheetName: payload.sheetName, status });
    return status >= 200 && status < 300;
  } catch (error) {
    appendAudit('sheet_edit_webhook', 'failed', { sheetName: payload.sheetName, error: String(error).slice(0, 240) });
    return false;
  }
}

function signPayload(payload) {
  const secret = PropertiesService.getScriptProperties().getProperty('VERNIKA_SYNC_SECRET');
  if (!secret) throw new Error('VERNIKA_SYNC_SECRET is not configured in Script Properties.');
  const bytes = Utilities.computeHmacSha256Signature(JSON.stringify(payload), secret);
  return bytes.map(byte => (`0${(byte < 0 ? byte + 256 : byte).toString(16)}`).slice(-2)).join('');
}

function appendAudit(action, result, metadata) {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.LOG_SHEET);
  if (sheet) sheet.appendRow([new Date().toISOString(), 'google_apps_script', action, result, JSON.stringify(metadata || {})]);
}

function ensureManagedSheets(spreadsheet) {
  CONFIG.MANAGED_SHEETS.forEach(name => {
    if (!spreadsheet.getSheetByName(name)) spreadsheet.insertSheet(name);
  });
}

function professionalFormatAllSheets() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  spreadsheet.getSheets().forEach(professionalFormatSheet);
}

function professionalFormatSheet(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const lastRow = Math.max(sheet.getLastRow(), 1);
  sheet.setFrozenRows(CONFIG.HEADER_ROW);
  sheet.getRange(1, 1, 1, lastColumn).setFontFamily('Arial').setFontWeight('bold').setFontColor('#ffffff').setBackground('#047857').setVerticalAlignment('middle');
  sheet.getRange(1, 1, lastRow, lastColumn).setFontFamily('Arial').setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  sheet.setRowHeight(1, 30);
  for (let col = 1; col <= lastColumn; col++) sheet.autoResizeColumn(col);
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, lastColumn).applyRowBanding(SpreadsheetApp.BandingTheme.GREEN, true, false);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'Vernika Workbook Sync Bridge', spreadsheetId: CONFIG.SPREADSHEET_ID })).setMimeType(ContentService.MimeType.JSON);
}
