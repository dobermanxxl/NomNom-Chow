import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertDraftMeal } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// ============================================
// ADMIN HOOKS
// ============================================

export function useAdminLogin() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (password: string) => {
      const res = await fetch(api.admin.login.path, {
        method: api.admin.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Invalid password");
      return api.admin.login.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "Welcome back!", description: "Logged in successfully." });
    },
    onError: () => {
      toast({ title: "Access Denied", description: "Incorrect password.", variant: "destructive" });
    }
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: [api.admin.stats.path],
    queryFn: async () => {
      const res = await fetch(api.admin.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.admin.stats.responses[200].parse(await res.json());
    },
    retry: false, // Don't retry if 401
  });
}

// ============================================
// DRAFT HOOKS
// ============================================

export function useDrafts() {
  return useQuery({
    queryKey: [api.drafts.list.path],
    queryFn: async () => {
      const res = await fetch(api.drafts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch drafts");
      return api.drafts.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateDraft() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: InsertDraftMeal) => {
      const res = await fetch(api.drafts.create.path, {
        method: api.drafts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create draft");
      return api.drafts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.drafts.list.path] });
      toast({ title: "Draft Saved", description: "Idea saved for later approval." });
    }
  });
}

export function useApproveDraft() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = api.drafts.approve.path.replace(":id", String(id));
      const res = await fetch(url, {
        method: api.drafts.approve.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve draft");
      return api.drafts.approve.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.drafts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Approved!", description: "Meal is now live." });
    }
  });
}
