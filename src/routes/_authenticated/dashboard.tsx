import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, format, isWithinInterval, parseISO, startOfDay } from "date-fns";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courseColorMap, useAssignments } from "@/lib/assignments";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TaskGrid" },
      { name: "description", content: "Workload overview: hours by course and deadlines on a timeline." },
      { property: "og:title", content: "Dashboard — TaskGrid" },
      { property: "og:description", content: "Workload overview: hours by course and deadlines on a timeline." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const assignmentsQuery = useAssignments();
  const assignments = assignmentsQuery.data ?? [];

  const courses = useMemo(
    () => [...new Set(assignments.map((a) => a.course))].sort(),
    [assignments],
  );
  const colors = useMemo(() => courseColorMap(courses), [courses]);

  const hoursByCourse = useMemo(() => {
    const totals = new Map<string, number>();
    for (const a of assignments) {
      if (a.status === "done") continue;
      totals.set(a.course, (totals.get(a.course) ?? 0) + a.estimated_hours);
    }
    return [...totals.entries()]
      .map(([course, hours]) => ({ course, hours }))
      .sort((a, b) => b.hours - a.hours);
  }, [assignments]);

  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);

  const pendingThisWeek = useMemo(
    () =>
      assignments.filter(
        (a) =>
          a.status !== "done" &&
          isWithinInterval(parseISO(a.due_date), { start: today, end: weekEnd }),
      ),
    [assignments, today, weekEnd],
  );

  const pendingHoursThisWeek = pendingThisWeek.reduce((sum, a) => sum + a.estimated_hours, 0);
  const highPriorityDueSoon = pendingThisWeek.filter((a) => a.priority === "high").length;

  const timeline = useMemo(() => {
    const upcoming = assignments
      .filter((a) => a.status !== "done")
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
    const byDate = new Map<string, typeof upcoming>();
    for (const a of upcoming) {
      const list = byDate.get(a.due_date) ?? [];
      list.push(a);
      byDate.set(a.due_date, list);
    }
    return [...byDate.entries()];
  }, [assignments]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            TaskGrid
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/assignments">Assignments</Link>
          </Button>
        </div>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending hours this week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{pendingHoursThisWeek}h</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pendingThisWeek.length} assignment{pendingThisWeek.length === 1 ? "" : "s"} due by{" "}
              {format(weekEnd, "d MMM")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High-priority due within 7 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{highPriorityDueSoon}</p>
            <p className="mt-1 text-xs text-muted-foreground">unfinished and marked high priority</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Estimated hours by course</CardTitle>
        </CardHeader>
        <CardContent>
          {hoursByCourse.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              {assignmentsQuery.isLoading ? "Loading…" : "No pending assignments to chart."}
            </p>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursByCourse} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="course" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit="h" />
                  <Tooltip formatter={(value) => [`${value}h`, "Estimated hours"]} />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {hoursByCourse.map((entry) => (
                      <Cell key={entry.course} fill={colors.get(entry.course)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Deadline timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              {assignmentsQuery.isLoading ? "Loading…" : "No upcoming deadlines."}
            </p>
          ) : (
            <ol className="relative ml-3 space-y-6 border-l border-border pl-6">
              {timeline.map(([date, items]) => {
                const overdue = parseISO(date) < today;
                return (
                  <li key={date} className="relative">
                    <span
                      className={`absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full ${
                        overdue ? "bg-destructive" : "bg-primary"
                      }`}
                    />
                    <p className="text-sm font-semibold text-foreground">
                      {format(parseISO(date), "EEE, d MMM yyyy")}
                      {overdue && (
                        <span className="ml-2 text-xs font-medium text-destructive">overdue</span>
                      )}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {items.map((a) => (
                        <li key={a.id} className="flex items-center gap-2 text-sm">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: colors.get(a.course) }}
                          />
                          <span className="text-foreground">{a.title}</span>
                          <span className="text-muted-foreground">
                            · {a.course} · {a.estimated_hours}h
                          </span>
                          {a.priority === "high" && (
                            <span className="text-xs font-medium text-destructive">high</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      {courses.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {courses.map((course) => (
            <span key={course} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors.get(course) }}
              />
              {course}
            </span>
          ))}
        </div>
      )}
    </main>
  );
}
