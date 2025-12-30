
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { meals } from "@shared/schema"; // For type reference if needed
import { 
  generateMealImage, 
  isCloudinaryConfigured, 
  getBatchProgress, 
  stopBatch, 
  processBatchImageGeneration,
  resetBatchProgress
} from "./image-service";

// Simple rate limiter for image generation
const imageRateLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_IMAGES_PER_HOUR = 30;

const checkRateLimit = (id: string) => {
  const now = Date.now();
  const limit = imageRateLimits.get(id);
  if (!limit || now > limit.resetAt) {
    imageRateLimits.set(id, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  if (limit.count >= MAX_IMAGES_PER_HOUR) return false;
  limit.count++;
  return true;
};

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

  // === RECIPE GENERATION ROUTES ===
  app.post(api.ai.generate.path, async (req, res) => {
      try {
          const { mealId, ageRange, dietaryFilters } = req.body;
          const meal = await storage.getMeal(mealId);
          if (!meal) return res.status(404).json({ message: "Meal not found" });

          storage.incrementRecipeGeneration(mealId).catch(console.error);

          const prompt = `
            Create a detailed, kid-friendly cooking guide for "${meal.title}".
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
              model: "gpt-5.1",
              messages: [{ role: "system", content: "You are a helpful cooking assistant for parents." }, { role: "user", content: prompt }],
              response_format: { type: "json_object" }
          });

          const content = JSON.parse(response.choices[0].message.content || "{}");

          res.json(content);
      } catch (e) {
          console.error("Recipe generation failed:", e);
          res.status(500).json({ message: "Failed to create recipe. Please try again." });
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
          
          const content = JSON.parse(response.choices[0].message.content || "{}");
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

  app.post(api.admin.generateImage.path, requireAdmin, async (req, res) => {
    try {
      const { mealId, title, ingredients, cuisine, skillLevel } = api.admin.generateImage.input.parse(req.body);
      
      if (!checkRateLimit(req.sessionID || 'anonymous')) {
        return res.status(429).json({ message: "Image generation limit reached (30/hour). Please try again later." });
      }

      const result = await generateMealImage(title, ingredients, cuisine, skillLevel);
      
      if (result.success && result.imageUrl && mealId) {
        await storage.updateMeal(mealId, { imageUrl: result.imageUrl });
        await storage.incrementImageGeneration(mealId);
      }

      res.json(result);
    } catch (e) {
      console.error("Image generation failed:", e);
      res.status(500).json({ message: "Failed to generate image", success: false });
    }
  });

  // Helper: Check if an imageUrl is a placeholder (should be treated as missing)
  function isPlaceholderImage(imageUrl: string | null | undefined): boolean {
    if (!imageUrl || imageUrl.length === 0) return true;
    const lowerUrl = imageUrl.toLowerCase();
    // Treat as placeholder if it contains these keywords or is the default placeholder asset
    return (
      lowerUrl.includes('placeholder') ||
      lowerUrl.includes('yummy') ||
      lowerUrl.includes('illustration') ||
      lowerUrl.endsWith('/placeholder-meal.svg') ||
      lowerUrl.startsWith('data:image/svg') ||
      !lowerUrl.includes('cloudinary') // If not from Cloudinary, treat as placeholder
    );
  }

  // Helper: Check if meal has a real (non-placeholder) image
  function hasRealImage(imageUrl: string | null | undefined): boolean {
    return !isPlaceholderImage(imageUrl);
  }

  // Image stats endpoint
  app.get(api.admin.imageStats.path, requireAdmin, async (req, res) => {
    const allMeals = await storage.getMeals();
    const withImages = allMeals.filter(m => hasRealImage(m.imageUrl)).length;
    res.json({
      totalMeals: allMeals.length,
      withImages,
      withoutImages: allMeals.length - withImages,
      cloudinaryConfigured: isCloudinaryConfigured()
    });
  });

  // Batch generate endpoint
  app.post(api.admin.batchGenerate.path, requireAdmin, async (req, res) => {
    const { regenerate, mealIds } = req.body;
    
    if (!isCloudinaryConfigured()) {
      return res.status(400).json({ message: "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET." });
    }

    const allMeals = await storage.getMeals();
    let mealsToProcess = allMeals;
    
    if (mealIds && mealIds.length > 0) {
      mealsToProcess = allMeals.filter(m => mealIds.includes(m.id));
    } else if (!regenerate) {
      // Include meals with no image OR placeholder images
      mealsToProcess = allMeals.filter(m => isPlaceholderImage(m.imageUrl));
    }

    if (mealsToProcess.length === 0) {
      return res.json({ message: "No meals to process" });
    }

    // Start batch in background
    processBatchImageGeneration(
      mealsToProcess.map(m => ({
        id: m.id,
        title: m.title,
        ingredients: (m.ingredients as string[]) || [],
        cuisine: m.cuisine || undefined,
        skillLevel: m.skillLevel || undefined
      })),
      async (mealId, imageUrl) => {
        await storage.updateMeal(mealId, { imageUrl });
      },
      async (mealId) => {
        await storage.incrementImageGeneration(mealId);
      }
    ).catch(console.error);

    res.json({ message: `Started processing ${mealsToProcess.length} meals` });
  });

  // Batch progress endpoint
  app.get(api.admin.batchProgress.path, requireAdmin, (req, res) => {
    res.json(getBatchProgress());
  });

  // Stop batch endpoint
  app.post(api.admin.stopBatch.path, requireAdmin, (req, res) => {
    stopBatch();
    res.json({ message: "Batch job stop requested" });
  });

  // Add sample meals endpoint
  app.post(api.admin.addSampleMeals.path, requireAdmin, async (req, res) => {
    const added = await addSampleMeals();
    res.json({ added, message: `Added ${added} new sample meals` });
  });

  // === AFFILIATE ROUTES ===
  app.get(api.affiliate.tools.path, async (req, res) => {
    const tools = await storage.getAffiliateTools();
    res.json(tools);
  });

  app.get(api.affiliate.byBundle.path, async (req, res) => {
    const bundle = req.params.bundle;
    const tools = await storage.getAffiliateToolsByBundle(bundle);
    res.json(tools);
  });

  app.post(api.affiliate.click.path, async (req, res) => {
    const { toolId, mealId, page } = req.body;
    await storage.recordAffiliateClick(toolId, mealId, page);
    res.json({ success: true });
  });

  return httpServer;
}

import { sampleMeals } from "./sample-meals";

// === ADD SAMPLE MEALS ===
async function addSampleMeals(): Promise<number> {
  const existing = await storage.getMeals();
  const existingTitles = new Set(existing.map(m => m.title.toLowerCase()));
  
  let added = 0;
  for (const meal of sampleMeals) {
    if (!existingTitles.has(meal.title.toLowerCase())) {
      await storage.createMeal(meal);
      added++;
    }
  }
  return added;
}

// === SEED AFFILIATE TOOLS ===
const sampleAffiliateTools = [
  // Parents bundle
  { title: "Instant-Read Thermometer", category: "thermometer", searchQuery: "instant read meat thermometer", benefit: "Never overcook chicken again. Takes the guesswork out of safe cooking temps.", isTopPick: true, bundle: "parents", tags: ["essential", "safety"] },
  { title: "12-Inch Stainless Steel Skillet", category: "cookware", searchQuery: "12 inch stainless steel skillet", benefit: "Perfect for one-pan dinners. Oven-safe for finishing dishes.", isTopPick: false, bundle: "parents", tags: ["essential"] },
  { title: "Half Sheet Pans (Set of 2)", category: "bakeware", searchQuery: "half sheet pan set rimmed", benefit: "Sheet pan dinners are a weeknight lifesaver. Heavy gauge won't warp.", isTopPick: false, bundle: "parents", tags: ["essential"] },
  { title: "Silicone Spatula Set", category: "utensils", searchQuery: "silicone spatula set heat resistant", benefit: "Won't scratch your pans. Flexible enough to scrape every last bit.", isTopPick: false, bundle: "parents", tags: ["essential"] },
  { title: "8-Inch Chef's Knife", category: "knives", searchQuery: "8 inch chef knife", benefit: "One good knife handles 90% of prep work. Worth the investment.", isTopPick: false, bundle: "parents", tags: ["essential"] },
  { title: "Cutting Board Set", category: "prep", searchQuery: "cutting board set color coded", benefit: "Color-coded boards prevent cross-contamination. Dishwasher safe.", isTopPick: false, bundle: "parents", tags: ["essential", "safety"] },
  { title: "Dutch Oven 6-Quart", category: "cookware", searchQuery: "dutch oven 6 quart enameled", benefit: "Perfect for soups, stews, and one-pot meals. Goes from stovetop to oven.", isTopPick: false, bundle: "parents", tags: ["versatile"] },
  { title: "Food Scale", category: "prep", searchQuery: "kitchen food scale digital", benefit: "Makes baking foolproof. Also great for portion consistency.", isTopPick: false, bundle: "parents", tags: ["baking"] },
  { title: "Timer with Multiple Channels", category: "tools", searchQuery: "kitchen timer multiple", benefit: "Track multiple dishes at once. Magnetic back sticks to fridge.", isTopPick: false, bundle: "parents", tags: ["organization"] },
  { title: "Splatter Screen", category: "safety", searchQuery: "splatter screen for frying pan", benefit: "Keeps grease in the pan, not on your stovetop. Easy cleanup.", isTopPick: false, bundle: "parents", tags: ["safety", "cleanup"] },
  
  // Kids bundle
  { title: "Kid-Safe Kitchen Knife Set", category: "knives", searchQuery: "kids cooking knife set nylon", benefit: "Serrated edges cut food, not fingers. Builds confidence safely.", isTopPick: true, bundle: "kids", tags: ["essential", "safety"] },
  { title: "Kids Apron with Pockets", category: "apparel", searchQuery: "kids apron adjustable", benefit: "Protects clothes and makes kids feel like real chefs.", isTopPick: false, bundle: "kids", tags: ["fun"] },
  { title: "Learning Tower/Kitchen Helper", category: "furniture", searchQuery: "learning tower kitchen helper", benefit: "Brings little ones to counter height safely. Folding versions save space.", isTopPick: false, bundle: "kids", tags: ["safety", "essential"] },
  { title: "Whisk Set for Kids", category: "utensils", searchQuery: "kids whisk set small", benefit: "Smaller handles fit little hands. Perfect for scrambled eggs.", isTopPick: false, bundle: "kids", tags: ["essential"] },
  { title: "Measuring Cups and Spoons", category: "prep", searchQuery: "kids measuring cups colorful", benefit: "Bright colors help kids learn fractions while cooking.", isTopPick: false, bundle: "kids", tags: ["learning"] },
  { title: "Vegetable Crinkle Cutter", category: "tools", searchQuery: "crinkle cutter vegetable kids", benefit: "Makes veggies more fun. Safe wavy cuts that kids love.", isTopPick: false, bundle: "kids", tags: ["fun"] },
  { title: "Cookie Cutters Variety Pack", category: "baking", searchQuery: "cookie cutters set kids shapes", benefit: "Turn sandwiches and pancakes into fun shapes.", isTopPick: false, bundle: "kids", tags: ["fun", "baking"] },
  { title: "Mini Rolling Pin", category: "baking", searchQuery: "mini rolling pin kids", benefit: "Sized for small hands. Perfect for pizza dough and cookies.", isTopPick: false, bundle: "kids", tags: ["baking"] },
  { title: "Oven Mitts for Kids", category: "safety", searchQuery: "oven mitts kids small hands", benefit: "Heat protection sized for smaller hands. Bright colors for visibility.", isTopPick: false, bundle: "kids", tags: ["safety", "essential"] },
  { title: "Kid-Friendly Cookbook", category: "books", searchQuery: "kids cookbook easy recipes", benefit: "Age-appropriate recipes with lots of pictures. Builds independence.", isTopPick: false, bundle: "kids", tags: ["learning"] },
];

async function seedAffiliateTools(): Promise<number> {
  const { db } = await import("./db");
  const { affiliateTools } = await import("@shared/schema");
  
  const existing = await db.select().from(affiliateTools);
  if (existing.length > 0) return 0;
  
  await db.insert(affiliateTools).values(sampleAffiliateTools);
  return sampleAffiliateTools.length;
}

// === SEED DATA ===
export async function seed() {
    const existing = await storage.getMeals();
    if (existing.length === 0) {
        console.log("Seeding database with sample meals...");
        const added = await addSampleMeals();
        console.log(`Seeding complete. Added ${added} meals.`);
    }
    
    // Seed affiliate tools
    const toolsAdded = await seedAffiliateTools();
    if (toolsAdded > 0) {
        console.log(`Seeded ${toolsAdded} affiliate tools.`);
    }
}
