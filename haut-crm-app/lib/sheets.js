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
  "linkedinUrl", "linkedinStatus", "notes", "tags", "dateReceived", "country",
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
    range: `${SHEET_TAB}!A1:R1`,
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
    range: `${SHEET_TAB}!A2:R10000`,
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
    range: `${SHEET_TAB}!A${rowNum}:R${rowNum}`,
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
    range: `${SHEET_TAB}!A${rowNum}:R${rowNum}`,
  });
}
// ==========================================
// PROJECTS MODULE EXTENSION (HAUT CGI)
// ==========================================

export async function getProjects() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: PROCESS_ENV_SPREADSHEET_ID,
      range: 'Projects!A2:X',
    });
    const rows = response.data.values || [];
    return rows.map((row) => {
      const price = Number(row[5]) || 0;
      const currency = row[6] || 'AED';
      const rate = currency === 'USD' ? 3.67 : currency === 'EUR' ? 4.0 : 1;
      
      const depositAmount = Number(row[19]) || 0;
      const finalAmount = Number(row[22]) || 0;

      const totalAED = price * rate;
      const paidAED = ((row[17] === 'Paid' ? depositAmount : 0) + (row[20] === 'Paid' ? finalAmount : 0)) * rate;
      
      return {
        id: row[0],
        name: row[1] || 'Untitled Project',
        clientId: row[2] || '',
        contactPerson: row[3] || '',
        type: row[4] || 'Mixed Reality',
        price,
        currency,
        deadline: row[7] || '',
        stage: row[8] || 'Pre-Production',
        status: row[9] || 'Active',
        ball: row[10] || 'Our Side',
        waitingFor: row[11] || '',
        actionDate: row[12] || '',
        financials: {
          agreement: { status: row[13] || 'Not Signed', date: row[14] || '' },
          lpo: { status: row[15] || 'Not Received', date: row[16] || '' },
          deposit: { status: row[17] || 'Not Paid', date: row[18] || '', amount: depositAmount },
          finalPayment: { status: row[20] || 'Not Paid', date: row[21] || '', amount: finalAmount },
        },
        calculated: {
          totalAED,
          paidAED,
          outstandingAED: totalAED - paidAED,
        },
        createdAt: row[23] || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Error in getProjects:', error);
    return [];
  }
}

export async function createProject(data) {
  const newId = `PRJ-${Date.now()}`;
  const values = [[
    newId,
    data.name || 'New Project',
    data.clientId || '',
    data.contactPerson || '',
    data.type || 'Mixed Reality',
    data.price || 0,
    data.currency || 'AED',
    data.deadline || '',
    'Pre-Production',
    'Active',
    'Our Side',
    data.waitingFor || '',
    data.actionDate || '',
    'Not Signed', '', // Agreement
    'Not Received', '', // LPO/PO
    'Not Paid', '', 0, // Deposit
    'Not Paid', '', 0, // Final Payment
    new Date().toISOString()
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: PROCESS_ENV_SPREADSHEET_ID,
    range: 'Projects!A:X',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });

  return { id: newId, ...data };
}

