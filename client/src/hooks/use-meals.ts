import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateMealRequest, type UpdateMealRequest, type GenerateRecipeRequest, type AIResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// ============================================
// MEAL HOOKS
// ============================================

export function useMeals(filters?: { ageRange?: string; diet?: string; cuisine?: string; skill?: string; timeLimit?: string; search?: string }) {
  // Construct query string manually since URLSearchParams doesn't handle undefined well in all envs without cleanup
  const queryParams = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
  }
  const queryString = queryParams.toString();
  const url = `${api.meals.list.path}${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: [api.meals.list.path, filters],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch meals");
      return api.meals.list.responses[200].parse(await res.json());
    },
  });
}

export function useMeal(id: number) {
  return useQuery({
    queryKey: [api.meals.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.meals.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch meal");
      return api.meals.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateMeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: CreateMealRequest) => {
      const res = await fetch(api.meals.create.path, {
        method: api.meals.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create meal");
      return api.meals.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Yum!", description: "New meal added to the menu." });
    },
    onError: (err) => {
      toast({ title: "Oops!", description: err.message, variant: "destructive" });
    }
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateMealRequest) => {
      const url = buildUrl(api.meals.update.path, { id });
      const res = await fetch(url, {
        method: api.meals.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update meal");
      return api.meals.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Updated!", description: "Meal details saved." });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.meals.delete.path, { id });
      const res = await fetch(url, { 
        method: api.meals.delete.method,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to delete meal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Gone!", description: "Meal removed from the database." });
    },
  });
}

// ============================================
// AI HOOKS
// ============================================

export function useGenerateRecipe() {
  return useMutation({
    mutationFn: async (data: GenerateRecipeRequest) => {
      const res = await fetch(api.ai.generate.path, {
        method: api.ai.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("AI generation failed");
      // The response is complex (AIResponse), validating broadly as custom for now in routes
      return await res.json() as AIResponse;
    },
  });
}

export function useSuggestMeals() {
  return useMutation({
    mutationFn: async (ingredients: string[]) => {
      const res = await fetch(api.ai.suggest.path, {
        method: api.ai.suggest.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to suggest meals");
      return api.ai.suggest.responses[200].parse(await res.json());
    },
  });
}
