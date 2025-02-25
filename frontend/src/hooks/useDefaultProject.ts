import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";

export function useDefaultProject() {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProjectId(null);
      setLoading(false);
      return;
    }

    const loadDefaultProject = async () => {
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) throw new Error("User is not authenticated.");

        const { data, error } = await supabase
          .rpc("get_or_create_default_project", { user_id: user.id })
          //@ts-ignore
          .headers({ Authorization: `Bearer ${token}` }); // ✅ Attach Token Here

        if (error) throw error;
        setProjectId(data);
        setError(null);
      } catch (err) {
        console.error("Error loading default project:", err);
        setError(err instanceof Error ? err.message : "Failed to load default project");
        toast.error("Failed to load default project");
      } finally {
        setLoading(false);
      }
    };

    loadDefaultProject();
  }, [user]);

  return { projectId, loading, error };
}
