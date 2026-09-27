import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AssignmentForm,
  type Assignment,
  type AssignmentInput,
} from "@/components/AssignmentForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_COURSES = ["FADM", "Microeconomics", "OB", "IT for Managers"];

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

export const Route = createFileRoute("/_authenticated/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — TaskGrid" },
      { name: "description", content: "Your PGDM assignments sorted by due date." },
      { property: "og:title", content: "Assignments — TaskGrid" },
      { property: "og:description", content: "Your PGDM assignments sorted by due date." },
    ],
  }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sortAsc, setSortAsc] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const assignmentsQuery = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, title, course, due_date, estimated_hours, status, priority");
      if (error) throw error;
      return data;
    },
  });

  // Seed the starter course list once for a brand-new account.
  useEffect(() => {
    if (!coursesQuery.data || coursesQuery.data.length > 0) return;
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;
      await supabase
        .from("courses")
        .insert(DEFAULT_COURSES.map((name) => ({ name, user_id: userId })));
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
    })();
  }, [coursesQuery.data, queryClient]);

  const rows = useMemo(() => {
    const list = (assignmentsQuery.data ?? []) as Assignment[];
    return [...list].sort((a, b) =>
      sortAsc ? a.due_date.localeCompare(b.due_date) : b.due_date.localeCompare(a.due_date),
    );
  }, [assignmentsQuery.data, sortAsc]);

  async function addCourse(name: string) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    const { error } = await supabase.from("courses").insert({ name, user_id: userId });
    if (error && !error.message.includes("duplicate")) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["courses"] });
  }

  async function saveAssignment(values: AssignmentInput) {
    if (editing) {
      const { error } = await supabase.from("assignments").update(values).eq("id", editing.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Assignment updated");
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;
      const { error } = await supabase.from("assignments").insert({ ...values, user_id: userId });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Assignment added");
    }
    await queryClient.invalidateQueries({ queryKey: ["assignments"] });
  }

  async function deleteAssignment(id: string) {
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Assignment deleted");
    await queryClient.invalidateQueries({ queryKey: ["assignments"] });
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const courseNames = (coursesQuery.data ?? []).map((c) => c.name);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            TaskGrid
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Assignments
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            New assignment
          </Button>
          <Button variant="ghost" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </header>

      <div className="mt-8 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>
                <button
                  type="button"
                  className="font-medium underline-offset-4 hover:underline"
                  onClick={() => setSortAsc((v) => !v)}
                >
                  Due date {sortAsc ? "↑" : "↓"}
                </button>
              </TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {assignmentsQuery.isLoading ? "Loading…" : "No assignments yet."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell>{row.course}</TableCell>
                  <TableCell>{row.due_date}</TableCell>
                  <TableCell>{row.estimated_hours}</TableCell>
                  <TableCell>{STATUS_LABEL[row.status] ?? row.status}</TableCell>
                  <TableCell>
                    <Badge variant={row.priority === "high" ? "default" : "secondary"}>
                      {row.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(row);
                        setFormOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void deleteAssignment(row.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {formOpen && (
        <AssignmentForm
          key={editing?.id ?? "new"}
          open={formOpen}
          onOpenChange={setFormOpen}
          courses={courseNames}
          initial={editing}
          onSubmit={saveAssignment}
          onAddCourse={addCourse}
        />
      )}
    </main>
  );
}
