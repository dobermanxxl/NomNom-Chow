
import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  cuisine: text("cuisine"),
  skillLevel: text("skill_level"),
  timeMinutes: integer("time_minutes").notNull(),
  ageRanges: jsonb("age_ranges").$type<string[]>(),
  dietaryFlags: jsonb("dietary_flags").$type<string[]>(),
  imageUrl: text("image_url"),
  ingredients: jsonb("ingredients").$type<string[]>(),
  instructions: jsonb("instructions").$type<string[]>(),
  kidFriendlyNotes: text("kid_friendly_notes"),
  slug: text("slug"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  tags: jsonb("tags").$type<string[]>(),
  amazonRecommendations: jsonb("amazon_recommendations").$type<AmazonRecommendation[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export interface AmazonRecommendation {
  title: string;
  category: string;
  asin?: string;
  searchQuery: string;
  affiliateUrl?: string;
  whyThisHelps: string;
}

export interface MealPlanDay {
  dayName: string;
  mealId: number;
}

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  weekStartDate: timestamp("week_start_date").notNull(),
  days: jsonb("days").$type<MealPlanDay[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const affiliateTools = pgTable("affiliate_tools", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  searchQuery: text("search_query").notNull(),
  asin: text("asin"),
  benefit: text("benefit").notNull(),
  tags: jsonb("tags").$type<string[]>(),
  isTopPick: boolean("is_top_pick").default(false),
  bundle: text("bundle"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const affiliateClicks = pgTable("affiliate_clicks", {
  id: serial("id").primaryKey(),
  toolId: integer("tool_id").references(() => affiliateTools.id),
  mealId: integer("meal_id").references(() => meals.id),
  page: text("page").notNull(),
  clickedAt: timestamp("clicked_at").defaultNow(),
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
  imageGenerations: integer("image_generations").default(0),
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

export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({
  id: true,
  createdAt: true
});

export const insertAffiliateToolSchema = createInsertSchema(affiliateTools).omit({
  id: true,
  createdAt: true
});

export const insertAffiliateClickSchema = createInsertSchema(affiliateClicks).omit({
  id: true,
  clickedAt: true
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
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

export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;

export type AffiliateTool = typeof affiliateTools.$inferSelect;
export type InsertAffiliateTool = z.infer<typeof insertAffiliateToolSchema>;

export type AffiliateClick = typeof affiliateClicks.$inferSelect;
export type InsertAffiliateClick = z.infer<typeof insertAffiliateClickSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

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

export interface RecipeDetails {
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
