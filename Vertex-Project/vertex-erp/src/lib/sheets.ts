import { google } from 'googleapis';

function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

const SHEET_ID = process.env.GOOGLE_SHEETS_ID!;

export async function getSheetData(sheetName: string): Promise<Record<string, string>[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: sheetName,
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) return [];

  const [headers, ...data] = rows;
  return data.map(row =>
    Object.fromEntries(headers.map((h: string, i: number) => [h, row[i] ?? '']))
  );
}

export async function appendRow(sheetName: string, row: (string | number)[]): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: sheetName,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

export async function updateRow(
  sheetName: string,
  rowIndex: number,
  row: (string | number)[]
): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

export async function updateRange(
  range: string,
  values: (string | number)[][],
): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
}

export async function findUserByEmail(
  email: string,
): Promise<{ rowIndex: number; user: Record<string, string> } | null> {
  const rows = await getSheetData('erp_users');
  const idx = rows.findIndex(r => r.email === email);
  if (idx === -1) return null;
  return { rowIndex: idx + 2, user: rows[idx] };
}

export async function findRoleById(
  roleId: string,
): Promise<Record<string, string> | null> {
  const rows = await getSheetData('erp_roles');
  return rows.find(r => r.id === roleId) ?? null;
}

export async function updateUserLastLogin(
  rowIndex: number,
  isoTimestamp: string,
): Promise<void> {
  await updateRange(`erp_users!G${rowIndex}`, [[isoTimestamp]]);
}

export async function updateUserProfile(
  rowIndex: number,
  fullName: string,
  avatarUrl: string,
): Promise<void> {
  await updateRange(`erp_users!C${rowIndex}:D${rowIndex}`, [[fullName, avatarUrl]]);
}
