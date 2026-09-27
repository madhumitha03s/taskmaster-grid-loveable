import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TaskGrid — PGDM assignment & deadline tracker" },
      {
        name: "description",
        content:
          "Track PGDM assignments, deadlines and estimated workload across all your courses in one place.",
      },
      { property: "og:title", content: "TaskGrid — PGDM assignment & deadline tracker" },
      {
        property: "og:description",
        content:
          "Track PGDM assignments, deadlines and estimated workload across all your courses in one place.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/assignments", replace: true });
      else setChecked(true);
    });
  }, [navigate]);

  if (!checked) return null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-xl">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          TaskGrid
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          Every assignment, every deadline, one grid.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Log assignments per course with due dates, estimated hours, status and priority — then
          sort by what is due next.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link to="/auth">Sign in or create an account</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
