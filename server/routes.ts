
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { meals } from "@shared/schema"; // For type reference if needed

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === ADMIN AUTH MIDDLEWARE ===
  const requireAdmin = (req: any, res: any, next: any) => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error("CRITICAL: ADMIN_PASSWORD environment variable is missing!");
      return res.status(500).json({ message: "Server configuration error: Admin password not set." });
    }

    if (req.session.isAdmin) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // === ADMIN ROUTES ===
  app.post(api.admin.login.path, (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("CRITICAL: ADMIN_PASSWORD environment variable is missing!");
      return res.status(500).json({ message: "Server configuration error: Admin password not set." });
    }

    if (password === adminPassword) {
      req.session.isAdmin = true;
      return res.json({ success: true });
    }
    res.status(401).json({ message: "Invalid password" });
  });

  app.get(api.admin.stats.path, requireAdmin, async (req, res) => {
      const stats = await storage.getAllStats();
      res.json(stats);
  });

  // === MEAL ROUTES ===
  app.get(api.meals.list.path, async (req, res) => {
    try {
        const filters = {
            ageRange: req.query.ageRange as string,
            diet: req.query.diet as string,
            cuisine: req.query.cuisine as string,
            skill: req.query.skill as string,
            timeLimit: req.query.timeLimit ? parseInt(req.query.timeLimit as string) : undefined,
            search: req.query.search as string
        };
        const meals = await storage.getMeals(filters);
        res.json(meals);
    } catch (e) {
        console.error("Error fetching meals:", e);
        res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  app.get(api.meals.get.path, async (req, res) => {
      const meal = await storage.getMeal(Number(req.params.id));
      if (!meal) return res.status(404).json({ message: "Meal not found" });
      
      // Increment view count asynchronously
      storage.incrementView(Number(req.params.id)).catch(console.error);
      
      res.json(meal);
  });

  app.post(api.meals.create.path, requireAdmin, async (req, res) => {
      try {
          const input = api.meals.create.input.parse(req.body);
          const meal = await storage.createMeal(input);
          res.status(201).json(meal);
      } catch (e) {
          res.status(400).json({ message: "Validation failed" });
      }
  });

  app.put(api.meals.update.path, requireAdmin, async (req, res) => {
      try {
          const input = api.meals.update.input.parse(req.body);
          const meal = await storage.updateMeal(Number(req.params.id), input);
          res.json(meal);
      } catch (e) {
          res.status(400).json({ message: "Validation failed" });
      }
  });

  app.delete(api.meals.delete.path, requireAdmin, async (req, res) => {
      await storage.deleteMeal(Number(req.params.id));
      res.status(204).send();
  });

  // === AI ROUTES ===
  app.post(api.ai.generate.path, async (req, res) => {
      try {
          const { mealId, ageRange, dietaryFilters } = req.body;
          const meal = await storage.getMeal(mealId);
          if (!meal) return res.status(404).json({ message: "Meal not found" });

          // Increment generation stats
          storage.incrementAiGeneration(mealId).catch(console.error);

          const prompt = `
            Generate a detailed, kid-friendly cooking guide for "${meal.title}".
            Target Audience: Busy parents with kids aged ${ageRange}.
            Dietary Needs: ${dietaryFilters?.join(', ') || 'None'}.
            
            Return a JSON object with this exact structure:
            {
              "instructions": ["step 1", "step 2", ...],
              "kidFriendlyAdjustments": ["tip 1", "tip 2"],
              "optionalSpice": "instruction for adults to add spice",
              "substitutions": [{"original": "item", "substitute": "item"}],
              "shoppingList": {
                "produce": [],
                "meat": [],
                "dairy": [],
                "pantry": [],
                "spices": [],
                "frozen": []
              },
              "toolSuggestions": [{"name": "tool name", "why": "why it helps"}]
            }
          `;

          const response = await openai.chat.completions.create({
              model: "gpt-5.1", // Or appropriate model
              messages: [{ role: "system", content: "You are a helpful cooking assistant for parents." }, { role: "user", content: prompt }],
              response_format: { type: "json_object" }
          });

          const content = JSON.parse(response.choices[0].message.content || "{}");
          
          // Save generated recipe (optional, skipped for MVP simplicity, just returning)
          // await storage.createGeneratedRecipe(...) 

          res.json(content);
      } catch (e) {
          console.error("AI Generation failed:", e);
          res.status(500).json({ message: "AI generation failed" });
      }
  });
  
  app.post(api.ai.suggest.path, async (req, res) => {
      try {
          const { ingredients } = req.body;
          const prompt = `
            I have these ingredients: ${ingredients.join(', ')}.
            Suggest 3 kid-friendly meal ideas.
            Return a JSON array of objects, each with: title, description, cuisine, timeMinutes (int), skillLevel (Easy/Intermediate/Advanced).
          `;
          
          const response = await openai.chat.completions.create({
              model: "gpt-5.1",
              messages: [{ role: "system", content: "You are a helpful cooking assistant." }, { role: "user", content: prompt }],
              response_format: { type: "json_object" }
          });
          
          // OpenAI json_object response might wrap array in a key, handle broadly
          const content = JSON.parse(response.choices[0].message.content || "{}");
          // Expecting { "meals": [...] } or similar, let's normalize
          const suggestions = content.meals || content.suggestions || [];
          
          res.json(suggestions);
      } catch (e) {
          res.status(500).json({ message: "Failed to suggest meals" });
      }
  });

  // === DRAFT ROUTES ===
  app.post(api.drafts.create.path, async (req, res) => {
      // User creates a draft via "What's in my fridge" flow if no match
      const draft = await storage.createDraftMeal(req.body);
      res.status(201).json(draft);
  });

  app.get(api.drafts.list.path, requireAdmin, async (req, res) => {
      const drafts = await storage.getDraftMeals();
      res.json(drafts);
  });

  app.post(api.drafts.approve.path, requireAdmin, async (req, res) => {
     // Move draft to real meal (simplified for MVP: just update status)
     const updated = await storage.updateDraftStatus(Number(req.params.id), 'approved');
     // Logic to convert draft to meal would go here
     res.json(updated);
  });

  return httpServer;
}

// === SEED DATA ===
export async function seed() {
    // Only seed if empty
    const existing = await storage.getMeals();
    if (existing.length === 0) {
        console.log("Seeding database...");
        const seedMeals = [
            {
                title: "Sheet Pan Chicken & Veggies",
                description: "One pan, no mess, healthy and colorful.",
                cuisine: "American",
                skillLevel: "Easy",
                timeMinutes: 30,
                ageRanges: ["2-5", "6-10", "10-13"],
                dietaryFlags: ["gluten-free"],
                ingredients: ["Chicken breast", "Broccoli", "Carrots", "Olive oil"],
                instructions: ["Preheat oven", "Chop veggies", "Bake 20 mins"],
                imageUrl: "https://images.unsplash.com/photo-1594998893017-361479423561?w=800"
            },
            {
                title: "Mini Meatballs & Spaghetti",
                description: "Fun-sized meatballs perfect for little hands.",
                cuisine: "Italian",
                skillLevel: "Intermediate",
                timeMinutes: 45,
                ageRanges: ["2-5", "6-10"],
                dietaryFlags: [],
                ingredients: ["Ground beef", "Spaghetti", "Tomato sauce", "Breadcrumbs"],
                imageUrl: "https://images.unsplash.com/photo-1594998893017-361479423561?w=800" // Placeholder
            },
            {
                title: "Chicken Quesadillas",
                description: "Cheesy, crispy, and easy to customize.",
                cuisine: "Mexican",
                skillLevel: "Easy",
                timeMinutes: 15,
                ageRanges: ["2-5", "6-10", "10-13"],
                dietaryFlags: [],
                ingredients: ["Tortillas", "Cheese", "Cooked Chicken"],
                imageUrl: "https://images.unsplash.com/photo-1599354607487-194d27129599?w=800"
            },
             {
                title: "Vegetable Stir Fry",
                description: "Colorful veggies with mild sauce.",
                cuisine: "Asian",
                skillLevel: "Easy",
                timeMinutes: 20,
                ageRanges: ["6-10", "10-13"],
                dietaryFlags: ["vegetarian"],
                ingredients: ["Broccoli", "Bell peppers", "Soy sauce", "Rice"],
                imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800"
            }
        ];
        
        for (const m of seedMeals) {
            await storage.createMeal(m);
        }
        console.log("Seeding complete.");
    }
}
