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
export async function createTaskEvent({ title, dateTime, leads, timeZone }) {
  const calendar = await getCalendarClient();

  const leadLines = leads
    .map((l) => `• ${l.name || "(no name)"} — ${l.email || l.phone || ""} ${l.company ? `(${l.company})` : ""}`)
    .join("\n");

  const description = `Task for ${leads.length} lead(s):\n\n${leadLines}`;
  const tz = timeZone || "Europe/Istanbul";

  // dateTime arrives as a plain "YYYY-MM-DDTHH:mm" wall-clock string from the
  // <input type="datetime-local">. We pass it straight through with an explicit
  // timeZone rather than converting via toISOString(), which avoids any
  // dependence on the server's or browser's own timezone guessing.
  const [datePart, timePart] = dateTime.split("T");
  const [h, m] = timePart.split(":").map(Number);
  const totalMinutes = h * 60 + m + 30;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMinute = totalMinutes % 60;
  const endDateTime = `${datePart}T${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;

  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary: `Follow-up: ${leads.length} lead(s) — ${title}`,
      description,
      start: { dateTime, timeZone: tz },
      end: { dateTime: endDateTime, timeZone: tz },
    },
  });

  return res.data.id;
}

export async function deleteTaskEvent(eventId) {
  const calendar = await getCalendarClient();
  await calendar.events.delete({ calendarId: CALENDAR_ID, eventId });
}
