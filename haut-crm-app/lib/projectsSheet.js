import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const PROJECTS_TAB = process.env.GOOGLE_PROJECTS_TAB || "Projects";

function getAuth() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!email || !key || !SHEET_ID) {
    throw new Error("Missing Google Sheets credentials.");
  }
  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

const HEADERS = [
  "id", "projectName", "clientId", "clientName", "contactPerson", "projectType",
  "saleType", "projectPrice", "currency", "priceAED", "deadline", "projectStatus",
  "stage", "ballSide", "nextAction", "actionDate",
  "agreementStatus", "agreementDate",
  "lpoStatus", "lpoDate",
  "depositStatus", "depositDate", "depositAmount",
  "finalPaymentStatus", "finalPaymentDate", "finalPaymentAmount",
  "notes",
];
// 27 columns -> A..AA

function colLetter(n) {
  // 1-indexed column number to letter(s)
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
const LAST_COL = colLetter(HEADERS.length);

function rowToProject(row) {
  const p = {};
  HEADERS.forEach((h, i) => (p[h] = row[i] || ""));
  return p;
}
function projectToRow(p) {
  return HEADERS.map((h) => p[h] ?? "");
}

async function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

async function ensureHeaders(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${PROJECTS_TAB}!A1:${LAST_COL}1`,
  }).catch(() => null);

  if (!res || !res.data.values || res.data.values.length === 0) {
    // Tab might not exist yet — try to create it, then write headers.
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: PROJECTS_TAB } } }] },
      });
    } catch (e) {
      // tab likely already exists; ignore
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${PROJECTS_TAB}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADERS] },
    });
  }
}

export async function getAllProjects() {
  const sheets = await getSheetsClient();
  await ensureHeaders(sheets);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${PROJECTS_TAB}!A2:${LAST_COL}10000`,
  });
  const rows = res.data.values || [];
  return rows.filter((r) => r.some((cell) => cell)).map(rowToProject);
}

export async function appendProject(project) {
  const sheets = await getSheetsClient();
  await ensureHeaders(sheets);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${PROJECTS_TAB}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [projectToRow(project)] },
  });
}

async function findRowIndexById(sheets, id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${PROJECTS_TAB}!A2:A10000`,
  });
  const rows = res.data.values || [];
  const idx = rows.findIndex((r) => r[0] === id);
  return idx === -1 ? -1 : idx + 2;
}

export async function updateProject(project) {
  const sheets = await getSheetsClient();
  const rowNum = await findRowIndexById(sheets, project.id);
  if (rowNum === -1) throw new Error("Project not found: " + project.id);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${PROJECTS_TAB}!A${rowNum}:${LAST_COL}${rowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [projectToRow(project)] },
  });
}

export async function deleteProject(id) {
  const sheets = await getSheetsClient();
  const rowNum = await findRowIndexById(sheets, id);
  if (rowNum === -1) return;
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${PROJECTS_TAB}!A${rowNum}:${LAST_COL}${rowNum}`,
  });
}
