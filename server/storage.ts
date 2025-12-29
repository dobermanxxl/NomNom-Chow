
import { db } from "./db";
import {
  meals,
  generatedRecipes,
  mealStats,
  draftMeals,
  type Meal,
  type InsertMeal,
  type GeneratedRecipe,
  type InsertGeneratedRecipe,
  type DraftMeal,
  type InsertDraftMeal,
  type MealResponse
} from "@shared/schema";
import { eq, like, and, or, sql, desc } from "drizzle-orm";

export interface IStorage {
  // Meals
  getMeals(filters?: {
    ageRange?: string;
    diet?: string;
    cuisine?: string;
    skill?: string;
    timeLimit?: number;
    search?: string;
  }): Promise<Meal[]>;
  getMeal(id: number): Promise<Meal | undefined>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  updateMeal(id: number, meal: Partial<InsertMeal>): Promise<Meal>;
  deleteMeal(id: number): Promise<void>;

  // Stats
  getMealStats(mealId: number): Promise<any>; // Type appropriately
  incrementView(mealId: number): Promise<void>;
  incrementAiGeneration(mealId: number): Promise<void>;
  incrementImageGeneration(mealId: number): Promise<void>;
  getAllStats(): Promise<any>;

  // Generated Recipes
  createGeneratedRecipe(recipe: InsertGeneratedRecipe): Promise<GeneratedRecipe>;
  getGeneratedRecipe(mealId: number, inputFilters: any): Promise<GeneratedRecipe | undefined>;

  // Drafts
  createDraftMeal(draft: InsertDraftMeal): Promise<DraftMeal>;
  getDraftMeals(): Promise<DraftMeal[]>;
  updateDraftStatus(id: number, status: string): Promise<DraftMeal>;
}

export class DatabaseStorage implements IStorage {
  async getMeals(filters?: {
    ageRange?: string;
    diet?: string;
    cuisine?: string;
    skill?: string;
    timeLimit?: number;
    search?: string;
  }): Promise<Meal[]> {
    let conditions = [];

    if (filters?.cuisine && filters.cuisine !== 'Any') {
      conditions.push(eq(meals.cuisine, filters.cuisine));
    }
    if (filters?.skill) {
        conditions.push(eq(meals.skillLevel, filters.skill));
    }
    if (filters?.timeLimit) {
        conditions.push(sql`${meals.timeMinutes} <= ${filters.timeLimit}`);
    }
    // Age range and diet are JSON arrays, simple 'like' check might suffice for MVP or use @> operator if using Postgres specialized types, but for text/jsonb columns let's stick to standard checks if possible.
    // For MVP with JSONB in Drizzle/PG:
    if (filters?.ageRange) {
        // This is a simplification. Ideally use JSONB operators.
        // Assuming ageRanges is stored as ["2-5", "6-10"]
        conditions.push(sql`${meals.ageRanges} @> ${JSON.stringify([filters.ageRange])}::jsonb`);
    }
    if (filters?.diet && filters.diet !== 'none') {
         conditions.push(sql`${meals.dietaryFlags} @> ${JSON.stringify([filters.diet])}::jsonb`);
    }

    if (filters?.search) {
        conditions.push(or(
            like(meals.title, `%${filters.search}%`),
            like(meals.description, `%${filters.search}%`)
        ));
    }

    if (conditions.length === 0) {
      return await db.select().from(meals);
    }

    return await db.select().from(meals).where(and(...conditions));
  }

  async getMeal(id: number): Promise<Meal | undefined> {
    const [meal] = await db.select().from(meals).where(eq(meals.id, id));
    return meal;
  }

  async createMeal(meal: InsertMeal): Promise<Meal> {
    const [newMeal] = await db.insert(meals).values(meal).returning();
    // Initialize stats
    await db.insert(mealStats).values({ mealId: newMeal.id, views: 0, aiGenerations: 0 });
    return newMeal;
  }

  async updateMeal(id: number, mealUpdates: Partial<InsertMeal>): Promise<Meal> {
    const [updated] = await db.update(meals).set(mealUpdates).where(eq(meals.id, id)).returning();
    return updated;
  }

  async deleteMeal(id: number): Promise<void> {
    await db.delete(mealStats).where(eq(mealStats.mealId, id));
    await db.delete(generatedRecipes).where(eq(generatedRecipes.mealId, id));
    await db.delete(meals).where(eq(meals.id, id));
  }

  async getMealStats(mealId: number) {
    const [stats] = await db.select().from(mealStats).where(eq(mealStats.mealId, mealId));
    return stats;
  }

  async incrementView(mealId: number): Promise<void> {
    await db.update(mealStats)
      .set({ views: sql`${mealStats.views} + 1` })
      .where(eq(mealStats.mealId, mealId));
  }

  async incrementAiGeneration(mealId: number): Promise<void> {
     await db.update(mealStats)
      .set({ aiGenerations: sql`${mealStats.aiGenerations} + 1` })
      .where(eq(mealStats.mealId, mealId));
  }

  async incrementImageGeneration(mealId: number): Promise<void> {
    await db.update(mealStats)
     .set({ imageGenerations: sql`${mealStats.imageGenerations} + 1` })
     .where(eq(mealStats.mealId, mealId));
 }
  
  async getAllStats(): Promise<any> {
      const stats = await db.select({
          mealId: mealStats.mealId,
          title: meals.title,
          views: mealStats.views,
          aiGenerations: mealStats.aiGenerations
      })
      .from(mealStats)
      .leftJoin(meals, eq(mealStats.mealId, meals.id));
      
      const totalMeals = await db.select({ count: sql<number>`count(*)` }).from(meals);
      
      return {
          totalMeals: totalMeals[0].count,
          mostViewed: stats.sort((a,b) => (b.views || 0) - (a.views || 0)).slice(0, 5),
          mostGenerated: stats.sort((a,b) => (b.aiGenerations || 0) - (a.aiGenerations || 0)).slice(0, 5)
      };
  }


  async createGeneratedRecipe(recipe: InsertGeneratedRecipe): Promise<GeneratedRecipe> {
    const [newRecipe] = await db.insert(generatedRecipes).values(recipe).returning();
    return newRecipe;
  }

  async getGeneratedRecipe(mealId: number, inputFilters: any): Promise<GeneratedRecipe | undefined> {
    // MVP: Naive check. In production, meaningful hash of filters.
    // Here we just return the latest one for the meal to save API costs if it's "close enough" 
    // OR we could just not cache for MVP and always generate.
    // Let's implement strictly new generations for now to ensure quality/customization.
    return undefined; 
  }

  async createDraftMeal(draft: InsertDraftMeal): Promise<DraftMeal> {
    const [newDraft] = await db.insert(draftMeals).values(draft).returning();
    return newDraft;
  }

  async getDraftMeals(): Promise<DraftMeal[]> {
    return await db.select().from(draftMeals).where(eq(draftMeals.status, 'pending'));
  }

  async updateDraftStatus(id: number, status: string): Promise<DraftMeal> {
      const [updated] = await db.update(draftMeals).set({ status }).where(eq(draftMeals.id, id)).returning();
      return updated;
  }
}

export const storage = new DatabaseStorage();
