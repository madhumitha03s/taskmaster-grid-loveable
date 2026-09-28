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

export const COURSE_COLORS = Array.from({ length: 8 }, (_, i) => `var(--course-${i + 1})`);

export const COURSE_TAG_CLASSES = [
  "bg-course-1-soft text-course-1-ink",
  "bg-course-2-soft text-course-2-ink",
  "bg-course-3-soft text-course-3-ink",
  "bg-course-4-soft text-course-4-ink",
  "bg-course-5-soft text-course-5-ink",
  "bg-course-6-soft text-course-6-ink",
  "bg-course-7-soft text-course-7-ink",
  "bg-course-8-soft text-course-8-ink",
];

export function courseColorMap(courses: string[]): Map<string, string> {
  const map = new Map<string, string>();
  courses.forEach((course, i) => {
    map.set(course, COURSE_COLORS[i % COURSE_COLORS.length] ?? "var(--primary)");
  });
  return map;
}

export function courseTagMap(courses: string[]): Map<string, string> {
  return new Map(courses.map((course, i) => [course, COURSE_TAG_CLASSES[i % COURSE_TAG_CLASSES.length] ?? COURSE_TAG_CLASSES[0] ?? "bg-secondary text-secondary-foreground"]));
}
