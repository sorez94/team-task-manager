import { NextResponse } from "next/server";
import { getDistinctAssignees } from "@/lib/tasks-query";

// GET /api/tasks/assignees — every distinct assignee name currently in use,
// alphabetically sorted. Used to power autocomplete suggestions in the task
// form's assignees field (see components/ui/AssigneesInput.tsx).
export async function GET() {
  try {
    const assignees = await getDistinctAssignees();
    return NextResponse.json({ assignees });
  } catch {
    return NextResponse.json({ error: "Failed to load assignees" }, { status: 500 });
  }
}
