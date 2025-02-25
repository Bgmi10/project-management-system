import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_to?: string;
  due_date?: string;
  position: number;
  column_id: string;
  project_id: string;
  created_by: string;
  tags?: string[];
  subtasks?: { title: string; completed: boolean }[];
}

export function useTasks(projectId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    loadTasks();
  }, [projectId]);

  const getAuthHeaders = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error("User not authenticated.");
    return { Authorization: `Bearer ${token}` };
  };

  const loadTasks = async () => {
    try {
      const headers = await getAuthHeaders();
      const { data, error: queryError } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("position", { ascending: true })
        .headers(headers); // ✅ Include token

      if (queryError) throw queryError;

      setTasks(data || []);
      setError(null);
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError(err instanceof Error ? err.message : "Failed to load tasks");
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (newTask: Omit<Task, "id" | "position" | "created_by">) => {
    try {
      const headers = await getAuthHeaders();
      const { data: userSession } = await supabase.auth.getUser();
      if (!userSession?.user) throw new Error("User not authenticated");

      const { data: existingTasks } = await supabase
        .from("tasks")
        .select("position")
        .eq("project_id", newTask.project_id)
        .eq("column_id", newTask.column_id)
        .order("position", { ascending: false })
        .limit(1)
        .headers(headers);

      const maxPosition = existingTasks?.[0]?.position ?? -1;

      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert({
          ...newTask,
          created_by: userSession.user.id,
          position: maxPosition + 1,
        })
        .select()
        .single()
        .headers(headers);

      if (insertError) throw insertError;

      setTasks((prev) => [...prev, data]);
      toast.success("Task created successfully! 🎉");
      return data;
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error("Failed to create task");
      throw err;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const headers = await getAuthHeaders();
      const { data, error: updateError } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId)
        .select()
        .single()
        .headers(headers);

      if (updateError) throw updateError;

      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, ...data } : task))
      );
      toast.success("Task updated successfully");
      return data;
    } catch (err) {
      console.error("Error updating task:", err);
      toast.error("Failed to update task");
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const headers = await getAuthHeaders();
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .headers(headers);

      if (deleteError) throw deleteError;

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      toast.success("Task deleted successfully");
    } catch (err) {
      console.error("Error deleting task:", err);
      toast.error("Failed to delete task");
      throw err;
    }
  };

  const moveTask = async (taskId: string, toColumn: string, newPosition: number) => {
    try {
      const headers = await getAuthHeaders();
      const { data, error: moveError } = await supabase
        .from("tasks")
        .update({
          column_id: toColumn,
          position: newPosition,
        })
        .eq("id", taskId)
        .select()
        .single()
        .headers(headers);

      if (moveError) throw moveError;

      setTasks((prev) => {
        const updatedTasks = prev.map((task) => {
          if (task.id === taskId) {
            return { ...task, column_id: toColumn, position: newPosition };
          }
          if (task.column_id === toColumn && task.position >= newPosition) {
            return { ...task, position: task.position + 1 };
          }
          return task;
        });
        return updatedTasks.sort((a, b) => a.position - b.position);
      });

      return data;
    } catch (err) {
      console.error("Error moving task:", err);
      toast.error("Failed to move task");
      throw err;
    }
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    refresh: loadTasks,
  };
}
