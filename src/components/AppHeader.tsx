import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ListTodo, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex sm:justify-between sm:px-6">
        <Link to="/assignments" className="min-w-0 truncate text-lg font-bold text-foreground">TaskGrid<span className="text-primary">.</span></Link>
        <nav aria-label="Main navigation" className="col-span-2 row-start-2 flex min-w-0 items-center gap-1 sm:col-span-1 sm:row-start-auto">
          <Button asChild size="sm" variant={pathname === "/assignments" ? "secondary" : "ghost"}>
            <Link to="/assignments" aria-current={pathname === "/assignments" ? "page" : undefined}><ListTodo />List</Link>
          </Button>
          <Button asChild size="sm" variant={pathname === "/dashboard" ? "secondary" : "ghost"}>
            <Link to="/dashboard" aria-current={pathname === "/dashboard" ? "page" : undefined}><LayoutDashboard />Dashboard</Link>
          </Button>
        </nav>
        <Button className="col-start-2 row-start-1 sm:col-auto sm:row-auto" variant="ghost" size="sm" onClick={() => void signOut()} title="Sign out" aria-label="Sign out">
          <LogOut /><span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}