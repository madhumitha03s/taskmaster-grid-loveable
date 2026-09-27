import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AssignmentStatus = "not_started" | "in_progress" | "done";
export type AssignmentPriority = "low" | "medium" | "high";

export interface AssignmentInput {
  title: string;
  course: string;
  due_date: string;
  estimated_hours: number;
  status: AssignmentStatus;
  priority: AssignmentPriority;
}

export interface Assignment extends AssignmentInput {
  id: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: string[];
  initial?: Assignment | null;
  onSubmit: (values: AssignmentInput) => Promise<void>;
  onAddCourse: (name: string) => Promise<void>;
}

const emptyValues: AssignmentInput = {
  title: "",
  course: "",
  due_date: "",
  estimated_hours: 1,
  status: "not_started",
  priority: "medium",
};

export function AssignmentForm({
  open,
  onOpenChange,
  courses,
  initial,
  onSubmit,
  onAddCourse,
}: Props) {
  const [values, setValues] = useState<AssignmentInput>(initial ?? emptyValues);
  const [newCourse, setNewCourse] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof AssignmentInput>(key: K, value: AssignmentInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCourse() {
    const name = newCourse.trim();
    if (!name) return;
    await onAddCourse(name);
    set("course", name);
    setNewCourse("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit assignment" : "New assignment"}</DialogTitle>
        </DialogHeader>

        <form id="assignment-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={values.course} onValueChange={(v) => set("course", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Add a course"
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleAddCourse();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={() => void handleAddCourse()}>
                Add
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="due">Due date</Label>
              <Input
                id="due"
                type="date"
                required
                value={values.due_date}
                onChange={(e) => set("due_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Estimated hours</Label>
              <Input
                id="hours"
                type="number"
                min={0}
                step={0.5}
                required
                value={values.estimated_hours}
                onChange={(e) => set("estimated_hours", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={values.status}
                onValueChange={(v) => set("status", v as AssignmentStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not started</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={values.priority}
                onValueChange={(v) => set("priority", v as AssignmentPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="assignment-form" disabled={saving || !values.course}>
            {initial ? "Save changes" : "Add assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
