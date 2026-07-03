import { NextResponse } from "next/server";
import { getAllContacts, appendContact, updateContact, deleteContact } from "../../../lib/sheets";

export async function GET() {
  try {
    const contacts = await getAllContacts();
    return NextResponse.json({ contacts });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const contact = await request.json();
    if (!contact.id) {
      contact.id = Math.random().toString(36).slice(2, 10);
    }
    await appendContact(contact);
    return NextResponse.json({ contact });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const contact = await request.json();
    await updateContact(contact);
    return NextResponse.json({ contact });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    await deleteContact(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
