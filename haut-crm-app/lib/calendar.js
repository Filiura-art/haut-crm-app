import { google } from "googleapis";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

function getAuth() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error("Missing Google credentials for Calendar API.");
  }
  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

async function getCalendarClient() {
  const auth = getAuth();
  return google.calendar({ version: "v3", auth });
}

// Creates a single calendar event summarizing a batch of selected leads.
export async function createTaskEvent({ title, dateTime, leads }) {
  const calendar = await getCalendarClient();

  const leadLines = leads
    .map((l) => `• ${l.name || "(no name)"} — ${l.email || l.phone || ""} ${l.company ? `(${l.company})` : ""}`)
    .join("\n");

  const description = `Task for ${leads.length} lead(s):\n\n${leadLines}`;

  const start = new Date(dateTime);
  const end = new Date(start.getTime() + 30 * 60000); // 30-minute default duration

  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary: `Follow-up: ${leads.length} lead(s) — ${title}`,
      description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    },
  });

  return res.data.id;
}

export async function deleteTaskEvent(eventId) {
  const calendar = await getCalendarClient();
  await calendar.events.delete({ calendarId: CALENDAR_ID, eventId });
}
