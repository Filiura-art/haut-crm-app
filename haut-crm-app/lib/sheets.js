import { google } from "googleapis";

// All secrets come from environment variables (set in Vercel dashboard),
// never hardcoded in this file or committed to the repo.
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || "Sheet1";

function getAuth() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  // Vercel env vars store literal \n as two characters; convert back to real newlines.
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!email || !key || !SHEET_ID) {
    throw new Error(
      "Missing Google Sheets credentials. Check GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID env vars."
    );
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

const HEADERS = [
  "id", "name", "email", "phone", "company", "contactType", "industry",
  "leadSource", "stage", "clientHistory", "productInterest", "occasion",
  "linkedinUrl", "linkedinStatus", "notes", "tags", "dateReceived",
];

function rowToContact(row) {
  const c = {};
  HEADERS.forEach((h, i) => (c[h] = row[i] || ""));
  return c;
}

function contactToRow(c) {
  return HEADERS.map((h) => c[h] ?? "");
}

async function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

// Ensures header row exists; creates it if the sheet is empty.
export async function ensureHeaders() {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A1:Q1`,
  });
  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADERS] },
    });
  }
}

export async function getAllContacts() {
  const sheets = await getSheetsClient();
  await ensureHeaders();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A2:Q10000`,
  });
  const rows = res.data.values || [];
  return rows
    .filter((r) => r.some((cell) => cell))
    .map(rowToContact);
}

export async function appendContact(contact) {
  const sheets = await getSheetsClient();
  await ensureHeaders();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [contactToRow(contact)] },
  });
}

async function findRowIndexById(sheets, id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A2:A10000`,
  });
  const rows = res.data.values || [];
  const idx = rows.findIndex((r) => r[0] === id);
  return idx === -1 ? -1 : idx + 2; // +2: 1-indexed, plus header row
}

export async function updateContact(contact) {
  const sheets = await getSheetsClient();
  const rowNum = await findRowIndexById(sheets, contact.id);
  if (rowNum === -1) throw new Error("Contact not found: " + contact.id);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A${rowNum}:Q${rowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [contactToRow(contact)] },
  });
}

export async function deleteContact(id) {
  const sheets = await getSheetsClient();
  const rowNum = await findRowIndexById(sheets, id);
  if (rowNum === -1) return;
  // Clear the row's contents. (Simplest approach; leaves a blank row rather than
  // shifting all subsequent rows, which keeps this fast and avoids race conditions.)
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A${rowNum}:Q${rowNum}`,
  });
}
