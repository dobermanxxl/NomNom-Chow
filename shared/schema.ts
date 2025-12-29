
import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  cuisine: text("cuisine"),
  skillLevel: text("skill_level"), // 'Easy', 'Intermediate', 'Advanced'
  timeMinutes: integer("time_minutes").notNull(),
  ageRanges: jsonb("age_ranges").$type<string[]>(), // e.g. ["2-5", "6-10"]
  dietaryFlags: jsonb("dietary_flags").$type<string[]>(), // e.g. ["vegetarian", "gluten-free"]
  imageUrl: text("image_url"),
  ingredients: jsonb("ingredients").$type<string[]>(), // Simple array of strings
  instructions: jsonb("instructions").$type<string[]>(), // Array of steps
  kidFriendlyNotes: text("kid_friendly_notes"), // Specific notes for kids
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const generatedRecipes = pgTable("generated_recipes", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id").references(() => meals.id),
  inputFiltersJson: jsonb("input_filters_json"),
  outputJson: jsonb("output_json").notNull(), // Stores the AI response
  createdAt: timestamp("created_at").defaultNow(),
});

export const mealStats = pgTable("meal_stats", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id").references(() => meals.id).unique(),
  views: integer("views").default(0),
  aiGenerations: integer("ai_generations").default(0),
});

export const draftMeals = pgTable("draft_meals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  ingredients: jsonb("ingredients").$type<string[]>(),
  suggestedByIngredients: boolean("suggested_by_ingredients").default(false),
  status: text("status").default("pending"), // 'pending', 'approved', 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const mealsRelations = relations(meals, ({ one }) => ({
  stats: one(mealStats, {
    fields: [meals.id],
    references: [mealStats.mealId],
  }),
}));

export const mealStatsRelations = relations(mealStats, ({ one }) => ({
  meal: one(meals, {
    fields: [mealStats.mealId],
    references: [meals.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertGeneratedRecipeSchema = createInsertSchema(generatedRecipes).omit({
  id: true,
  createdAt: true
});

export const insertDraftMealSchema = createInsertSchema(draftMeals).omit({
  id: true,
  createdAt: true
});

// === EXPLICIT API CONTRACT TYPES ===

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type GeneratedRecipe = typeof generatedRecipes.$inferSelect;
export type InsertGeneratedRecipe = z.infer<typeof insertGeneratedRecipeSchema>;

export type DraftMeal = typeof draftMeals.$inferSelect;
export type InsertDraftMeal = z.infer<typeof insertDraftMealSchema>;

// Request types
export type CreateMealRequest = InsertMeal;
export type UpdateMealRequest = Partial<InsertMeal>;

// Response types
export type MealResponse = Meal;
export type GeneratedRecipeResponse = GeneratedRecipe;

// AI Generation Request
export interface GenerateRecipeRequest {
  mealId: number;
  ageRange: string;
  dietaryFilters?: string[];
}

export interface AIResponse {
  instructions: string[];
  kidFriendlyAdjustments: string[];
  optionalSpice: string;
  substitutions: { original: string; substitute: string }[];
  shoppingList: {
    produce: string[];
    meat: string[];
    dairy: string[];
    pantry: string[];
    spices: string[];
    frozen: string[];
  };
  toolSuggestions: { name: string; why: string }[];
}
