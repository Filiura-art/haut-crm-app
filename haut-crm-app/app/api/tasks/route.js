import { NextResponse } from "next/server";
import { createTaskEvent, deleteTaskEvent } from "../../../lib/calendar";

export async function POST(request) {
  try {
    const { title, dateTime, leads, timeZone } = await request.json();
    if (!title || !dateTime || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "Missing title, dateTime, or leads." }, { status: 400 });
    }
    const eventId = await createTaskEvent({ title, dateTime, leads, timeZone });
    return NextResponse.json({ eventId });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { eventId } = await request.json();
    if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    await deleteTaskEvent(eventId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
