export type SpreadsheetShortcut = {
  action: string;
  windows: string;
  mac: string;
  description: string;
};

export const SPREADSHEET_SHORTCUTS: SpreadsheetShortcut[] = [
  { action: 'Copy', windows: 'Ctrl+C', mac: '⌘ C', description: 'Copy the selected cell or range' },
  { action: 'Cut', windows: 'Ctrl+X', mac: '⌘ X', description: 'Cut the selected cell or range' },
  { action: 'Paste', windows: 'Ctrl+V', mac: '⌘ V', description: 'Paste copied cells' },
  { action: 'Undo', windows: 'Ctrl+Z', mac: '⌘ Z', description: 'Undo the last edit' },
  { action: 'Redo', windows: 'Ctrl+Y / Ctrl+Shift+Z', mac: '⌘ Shift+Z', description: 'Redo the last edit' },
  { action: 'Select all', windows: 'Ctrl+A', mac: '⌘ A', description: 'Select the current sheet range' },
  { action: 'Find', windows: 'Ctrl+F', mac: '⌘ F', description: 'Focus workbook search' },
  { action: 'Save', windows: 'Ctrl+S', mac: '⌘ S', description: 'Persist the current workbook' },
  { action: 'Bold', windows: 'Ctrl+B', mac: '⌘ B', description: 'Toggle bold formatting' },
  { action: 'Italic', windows: 'Ctrl+I', mac: '⌘ I', description: 'Toggle italic formatting' },
  { action: 'Underline', windows: 'Ctrl+U', mac: '⌘ U', description: 'Toggle underline formatting' },
  { action: 'Edit cell', windows: 'F2 / Enter', mac: 'F2 / Return', description: 'Edit the active cell' },
  { action: 'Cancel edit', windows: 'Esc', mac: 'Esc', description: 'Cancel the current edit' },
  { action: 'Commit edit', windows: 'Enter / Tab', mac: 'Return / Tab', description: 'Commit and move to the next cell' },
  { action: 'Move', windows: 'Arrow keys', mac: 'Arrow keys', description: 'Move the active cell' },
  { action: 'Extend selection', windows: 'Shift+Arrow', mac: 'Shift+Arrow', description: 'Extend the selected range' },
  { action: 'Jump to edge', windows: 'Ctrl+Arrow', mac: '⌘ Arrow', description: 'Jump to the edge of the used range' },
  { action: 'Select row', windows: 'Shift+Space', mac: 'Shift+Space', description: 'Select the active row' },
  { action: 'Select column', windows: 'Ctrl+Space', mac: 'Control+Space', description: 'Select the active column' },
  { action: 'Delete contents', windows: 'Delete / Backspace', mac: 'Delete', description: 'Clear selected cells' },
  { action: 'Insert line break', windows: 'Alt+Enter', mac: 'Option+Return', description: 'Insert a line break inside a cell' },
  { action: 'Open shortcuts', windows: 'Ctrl+/', mac: '⌘ /', description: 'Open the shortcut reference' },
  { action: 'Generate image', windows: 'Ctrl+Shift+G', mac: '⌘ Shift+G', description: 'Create an image snapshot from the selection' },
  { action: 'Selected-column snapshot', windows: 'Ctrl+Shift+P', mac: '⌘ Shift+P', description: 'Download the selected column as an image' },
];

export const isMacPlatform = (): boolean => /Mac|iPhone|iPad|iPod/i.test(navigator.platform);

export const isPrimaryModifier = (event: KeyboardEvent): boolean => isMacPlatform() ? event.metaKey : event.ctrlKey;

export const displayShortcut = (windows: string, mac: string): string => isMacPlatform() ? mac : windows;

export const normalizeClipboardText = (text: string): string[][] => text
  .replace(/\r\n/g, '\n')
  .replace(/\r/g, '\n')
  .split('\n')
  .filter((row, index, rows) => !(index === rows.length - 1 && row === ''))
  .map(row => row.split('\t'));

export const cellRange = (start: string, end?: string): string[] => {
  const startMatch = start.toUpperCase().match(/^([A-Z]+)(\d+)$/);
  const endMatch = (end || start).toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!startMatch || !endMatch) return [start];
  const colToIndex = (letters: string) => letters.split('').reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
  const indexToCol = (index: number) => {
    let value = index;
    let result = '';
    while (value >= 0) {
      result = String.fromCharCode((value % 26) + 65) + result;
      value = Math.floor(value / 26) - 1;
    }
    return result;
  };
  const startCol = colToIndex(startMatch[1]);
  const endCol = colToIndex(endMatch[1]);
  const startRow = Number(startMatch[2]);
  const endRow = Number(endMatch[2]);
  const cells: string[] = [];
  for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row += 1) {
    for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col += 1) cells.push(`${indexToCol(col)}${row}`);
  }
  return cells;
};

export const selectionBounds = (selection: string): { start: string; end: string } => {
  const parts = selection.split(':').map(value => value.trim().toUpperCase()).filter(Boolean);
  return { start: parts[0] || 'A1', end: parts[1] || parts[0] || 'A1' };
};

export const selectionLabel = (selection: string): string => selection.includes(':') ? selection.toUpperCase() : selection.toUpperCase();
