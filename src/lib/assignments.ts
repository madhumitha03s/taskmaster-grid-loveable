import { useQuery } from "@tanstack/react-query";

import type { Assignment } from "@/components/AssignmentForm";
import { supabase } from "@/integrations/supabase/client";

export function useAssignments() {
  return useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, title, course, due_date, estimated_hours, status, priority");
      if (error) throw error;
      return data as Assignment[];
    },
  });
}

export const COURSE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
];

export function courseColorMap(courses: string[]): Map<string, string> {
  const map = new Map<string, string>();
  courses.forEach((course, i) => {
    map.set(course, COURSE_COLORS[i % COURSE_COLORS.length]);
  });
  return map;
}
