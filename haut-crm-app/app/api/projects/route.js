import { NextResponse } from "next/server";
import { getAllProjects, appendProject, updateProject, deleteProject } from "../../../lib/projectsSheet";

export async function GET() {
  try {
    const projects = await getAllProjects();
    return NextResponse.json({ projects });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const project = await request.json();
    if (!project.id) project.id = Math.random().toString(36).slice(2, 10);
    await appendProject(project);
    return NextResponse.json({ project });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const project = await request.json();
    await updateProject(project);
    return NextResponse.json({ project });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    await deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
