import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ClipboardList, Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AssignmentForm,
  type Assignment,
  type AssignmentInput,
} from "@/components/AssignmentForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { courseTagMap, useAssignments } from "@/lib/assignments";
import { format, parseISO } from "date-fns";

const DEFAULT_COURSES = ["FADM", "Microeconomics", "OB", "IT for Managers"];

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  not_started: "border-transparent bg-muted text-muted-foreground",
  in_progress: "border-transparent bg-status-progress text-status-progress-ink",
  done: "border-transparent bg-status-done text-status-done-ink",
};

const PRIORITY_BADGE_CLASS: Record<string, string> = {
  low: "border-transparent bg-priority-low text-priority-low-ink",
  medium: "border-transparent bg-status-progress text-status-progress-ink",
  high: "border-transparent bg-priority-high text-priority-high-ink",
};

export const Route = createFileRoute("/_authenticated/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — TaskGrid" },
      { name: "description", content: "Your PGDM assignments sorted by due date." },
      { property: "og:title", content: "Assignments — TaskGrid" },
      { property: "og:description", content: "Your PGDM assignments sorted by due date." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [sortAsc, setSortAsc] = useState(true);
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const assignmentsQuery = useAssignments();

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
    return list.filter((a) =>
      (courseFilter === "all" || a.course === courseFilter) &&
      (statusFilter === "all" || a.status === statusFilter)
    ).sort((a, b) =>
      sortAsc ? a.due_date.localeCompare(b.due_date) : b.due_date.localeCompare(a.due_date),
    );
  }, [assignmentsQuery.data, sortAsc, courseFilter, statusFilter]);

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

  const courseNames = (coursesQuery.data ?? []).map((c) => c.name);
  const availableCourses = [...new Set((assignmentsQuery.data ?? []).map((a) => a.course))].sort();
  const courseTags = courseTagMap(availableCourses);
  const renderCourse = (course: string) => <Badge className={`max-w-full break-words border-transparent shadow-none ${courseTags.get(course) ?? "bg-secondary text-secondary-foreground"}`}>{course}</Badge>;
  const hasAssignments = (assignmentsQuery.data?.length ?? 0) > 0;
  const hasFilters = courseFilter !== "all" || statusFilter !== "all";
  const isOverdue = (row: Assignment) => row.status !== "done" && row.due_date < new Date().toISOString().slice(0, 10);
  const openNew = () => { setEditing(null); setFormOpen(true); };
  const renderBadges = (row: Assignment) => (
    <div className="flex flex-wrap gap-1.5">
      <Badge className={STATUS_BADGE_CLASS[row.status] ?? ""}>{STATUS_LABEL[row.status] ?? row.status}</Badge>
      <Badge className={PRIORITY_BADGE_CLASS[row.priority] ?? ""}>{row.priority}</Badge>
    </div>
  );
  const renderActions = (row: Assignment) => (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={() => { setEditing(row); setFormOpen(true); }}>Edit</Button>
      <Button variant="ghost" size="sm" onClick={() => void deleteAssignment(row.id)}>Delete</Button>
    </div>
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0"><p className="text-xs font-medium uppercase text-muted-foreground">Your workspace</p><h1 className="mt-1 truncate text-2xl font-semibold text-foreground sm:text-3xl">Assignments</h1></div>
        <Button onClick={openNew} size="sm"><Plus /> <span className="hidden min-[420px]:inline">New assignment</span><span className="min-[420px]:hidden">Add</span></Button>
      </div>

      {hasAssignments && <div className="mt-8 grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
        <div className="min-w-0 sm:w-48"><label htmlFor="course-filter" className="mb-1.5 block text-xs font-medium text-muted-foreground">Course</label><Select value={courseFilter} onValueChange={setCourseFilter}><SelectTrigger id="course-filter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All courses</SelectItem>{availableCourses.map((course) => <SelectItem key={course} value={course}>{course}</SelectItem>)}</SelectContent></Select></div>
        <div className="min-w-0 sm:w-44"><label htmlFor="status-filter" className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger id="status-filter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="not_started">Not started</SelectItem><SelectItem value="in_progress">In progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent></Select></div>
        <Button className="col-span-2 sm:ml-auto" variant="outline" onClick={() => setSortAsc((v) => !v)} title="Sort by due date" aria-label={`Due date: ${sortAsc ? "earliest first" : "latest first"}`}>
          {sortAsc ? <ArrowUp /> : <ArrowDown />} Due date: {sortAsc ? "earliest first" : "latest first"}
        </Button>
      </div>}

      {assignmentsQuery.isPending ? (
        <div className="mt-8 space-y-3" role="status" aria-label="Loading assignments"><p className="text-sm text-muted-foreground">Loading assignments…</p>{[1, 2, 3].map((n) => <Skeleton key={n} className="h-16 w-full" />)}</div>
      ) : assignmentsQuery.isError ? (
        <div className="mt-8 border border-destructive/30 p-8 text-center"><p className="font-medium">Assignments couldn’t load.</p><Button className="mt-4" variant="outline" onClick={() => void assignmentsQuery.refetch()}><RotateCcw />Try again</Button></div>
      ) : !hasAssignments || rows.length === 0 ? (
        <div className="mt-8 flex min-h-64 flex-col items-center justify-center border border-dashed border-border px-6 py-12 text-center">
          <ClipboardList className="mb-4 size-9 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold">{hasFilters ? "No matching assignments" : "A fresh start"}</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{hasFilters ? "Try a different course or status to find what you need." : "Your assignments will appear here. Add your first one to start tracking deadlines."}</p>
          <Button className="mt-5" onClick={hasFilters ? () => { setCourseFilter("all"); setStatusFilter("all"); } : openNew}>{hasFilters ? "Clear filters" : "Add your first assignment"}</Button>
        </div>
      ) : <>
      <p className="mt-5 text-xs text-muted-foreground">Showing {rows.length} of {assignmentsQuery.data?.length ?? 0} assignments</p>
      <div className="mt-3 hidden overflow-x-auto rounded-md border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
                <TableRow key={row.id} className={isOverdue(row) ? "bg-destructive/5" : undefined}>
                  <TableCell className="max-w-64 break-words font-medium">{row.title}</TableCell>
                   <TableCell>{renderCourse(row.course)}</TableCell>
                  <TableCell className={isOverdue(row) ? "font-semibold text-destructive" : undefined}>{format(parseISO(row.due_date), "d MMM yyyy")}{isOverdue(row) && <span className="ml-1 block text-xs">Overdue</span>}</TableCell>
                  <TableCell>{row.estimated_hours}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_BADGE_CLASS[row.status] ?? ""}>{STATUS_LABEL[row.status] ?? row.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={PRIORITY_BADGE_CLASS[row.priority] ?? ""}>
                      {row.priority}
                    </Badge>
                  </TableCell>
                  <TableCell><div className="flex justify-end">{renderActions(row)}</div></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-3 space-y-3 md:hidden">
        {rows.map((row) => <article key={row.id} className={`rounded-md border p-4 ${isOverdue(row) ? "border-destructive/40 bg-destructive/5" : "border-border"}`}>
           <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><div className="min-w-0"><h2 className="break-words font-semibold text-foreground">{row.title}</h2><div className="mt-2">{renderCourse(row.course)}</div></div><p className={`shrink-0 text-right text-sm ${isOverdue(row) ? "font-semibold text-destructive" : "text-foreground"}`}>{format(parseISO(row.due_date), "d MMM")}{isOverdue(row) && <span className="block text-xs">Overdue</span>}</p></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{row.estimated_hours}h estimated</span>{renderBadges(row)}</div>
          <div className="mt-3 flex justify-end border-t border-border pt-2">{renderActions(row)}</div>
        </article>)}
      </div>
      </>}

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
