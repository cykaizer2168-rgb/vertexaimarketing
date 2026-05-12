import { randomUUID } from 'crypto';
import { google } from 'googleapis';
import type { ErpUser, AccessLevel } from '@/types';

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

export async function listUsers(): Promise<ErpUser[]> {
  const [userRows, roleRows] = await Promise.all([
    getSheetData('erp_users'),
    getSheetData('erp_roles'),
  ]);

  const roleMap: Record<string, string> = {};
  for (const role of roleRows) {
    roleMap[role.id] = role.role_name;
  }

  return userRows.map(row => ({
    id:        row.id,
    email:     row.email,
    fullName:  row.full_name  || null,
    avatarUrl: row.avatar_url || null,
    roleId:    row.role_id,
    roleName:  roleMap[row.role_id] ?? 'Unknown',
    status:    (row.status === 'disabled' ? 'disabled' : 'active') as 'active' | 'disabled',
    lastLogin: row.last_login || null,
    createdAt: row.created_at,
  }));
}

export async function addUser(
  email: string,
  fullName: string,
  roleId: string,
): Promise<ErpUser> {
  // NOTE: duplicate check is best-effort — Sheets has no atomic operations,
  // so concurrent inserts can race past this guard.
  const rows = await getSheetData('erp_users');
  if (rows.some(r => r.email === email)) {
    throw new Error('EMAIL_EXISTS');
  }

  const id        = 'usr-' + randomUUID().slice(0, 8);
  const createdAt = new Date().toISOString();

  await appendRow('erp_users', [id, email, fullName, '', roleId, 'active', '', createdAt]);

  const role = await findRoleById(roleId);

  return {
    id,
    email,
    fullName,
    avatarUrl: null,
    roleId,
    roleName:  role?.role_name ?? 'Unknown',
    status:    'active',
    lastLogin: null,
    createdAt,
  };
}

export async function updateUserById(
  id: string,
  fields: { fullName?: string; roleId?: string; status?: 'active' | 'disabled' },
): Promise<void> {
  const rows = await getSheetData('erp_users');
  const idx  = rows.findIndex(r => r.id === id);
  if (idx === -1) throw new Error('USER_NOT_FOUND');

  const rowIndex = idx + 2;

  if (fields.fullName !== undefined) {
    await updateRange(`erp_users!C${rowIndex}`, [[fields.fullName]]);
  }
  if (fields.roleId !== undefined) {
    await updateRange(`erp_users!E${rowIndex}`, [[fields.roleId]]);
  }
  if (fields.status !== undefined) {
    await updateRange(`erp_users!F${rowIndex}`, [[fields.status]]);
  }
}

export async function listRolePermissions(): Promise<Record<string, Record<string, AccessLevel>>> {
  const rows = await getSheetData('erp_role_permissions');
  const result: Record<string, Record<string, AccessLevel>> = {};
  for (const row of rows) {
    if (!row.role_id || !row.category_id || !row.access_level) continue;
    if (!result[row.role_id]) result[row.role_id] = {};
    result[row.role_id][row.category_id] = row.access_level as AccessLevel;
  }
  return result;
}

export async function setRolePermissions(
  roleId: string,
  perms: Record<string, AccessLevel>,
): Promise<void> {
  // NOTE: clear-and-rewrite is not atomic — concurrent saves to the same
  // role can interleave. Acceptable at SME scale.
  const sheetsClient = getSheetsClient();

  // 1. Read all current rows
  const allRows = await getSheetData('erp_role_permissions');

  // 2. Keep rows for other roles
  const otherRows = allRows
    .filter(r => r.role_id !== roleId)
    .map(r => [r.role_id, r.category_id, r.access_level]);

  // 3. Build new rows for this role (skip 'none' — absence means no access)
  const newRows = Object.entries(perms)
    .filter(([, level]) => level !== 'none')
    .map(([categoryId, level]) => [roleId, categoryId, level]);

  const allNewRows = [...otherRows, ...newRows];

  // 4. Clear data range (A2:C), preserving the header row
  await sheetsClient.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: 'erp_role_permissions!A2:C',
  });

  // 5. Write all rows back (if any)
  if (allNewRows.length > 0) {
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'erp_role_permissions!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: allNewRows },
    });
  }
}
