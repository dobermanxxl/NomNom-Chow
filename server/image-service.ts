import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";
import { Buffer } from "node:buffer";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export function configureCloudinary(): void {
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

configureCloudinary();

export interface ImageGenerationResult {
  imageUrl: string;
  success: boolean;
  error?: string;
}

export async function generateMealImage(
  title: string, 
  ingredients: string[],
  cuisine?: string,
  skillLevel?: string
): Promise<ImageGenerationResult> {
  if (!isCloudinaryConfigured()) {
    return {
      imageUrl: "",
      success: false,
      error: "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables."
    };
  }

  const ingredientList = ingredients.slice(0, 8).join(", ");
  const cuisineHint = cuisine ? `${cuisine} cuisine style.` : "";
  const prompt = `
A realistic, home-cooked, kid-friendly meal: "${title}".
Main ingredients visible: ${ingredientList}. ${cuisineHint}
Style: Photorealistic, natural kitchen lighting, home-cooked weeknight dinner, simple white plate or ceramic bowl, normal family portion sizes, overhead or 45-degree angle shot.
Rules: No fancy restaurant plating, no garnish, no studio lighting, no extra foods not in the ingredients list.
The image should look like a parent took a high-quality photo of a real dinner they just made at home.
  `.trim();

  try {
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      n: 1
    } as any);

    // Handle response - may return b64_json or url depending on API version
    const imageData = response.data?.[0] as any;
    let buffer: Buffer;
    
    if (imageData?.b64_json) {
      // Base64 response
      buffer = Buffer.from(imageData.b64_json, "base64");
    } else if (imageData?.url) {
      // URL response - download the image
      const imageResponse = await fetch(imageData.url);
      if (!imageResponse.ok) {
        return { imageUrl: "", success: false, error: "Failed to download generated image" };
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      return { imageUrl: "", success: false, error: "No image data returned from AI" };
    }

    const imageUrl = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: "nomnomchow/meals",
          transformation: [
            { width: 1024, height: 1024, crop: "fill", gravity: "auto" },
            { quality: "auto", fetch_format: "auto" }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result?.secure_url || "");
        }
      );
      uploadStream.end(buffer);
    });

    return { imageUrl, success: true };
  } catch (error: any) {
    console.error("Image generation error:", error);
    return { 
      imageUrl: "", 
      success: false, 
      error: error.message || "Failed to generate image" 
    };
  }
}

export interface BatchProgress {
  current: number;
  total: number;
  currentMealTitle: string;
  completed: number;
  failed: number;
  failures: Array<{ mealId: number; title: string; error: string }>;
  isRunning: boolean;
}

let batchProgress: BatchProgress = {
  current: 0,
  total: 0,
  currentMealTitle: "",
  completed: 0,
  failed: 0,
  failures: [],
  isRunning: false
};

let stopBatchRequested = false;

export function getBatchProgress(): BatchProgress {
  return { ...batchProgress };
}

export function stopBatch(): void {
  stopBatchRequested = true;
}

export function resetBatchProgress(): void {
  batchProgress = {
    current: 0,
    total: 0,
    currentMealTitle: "",
    completed: 0,
    failed: 0,
    failures: [],
    isRunning: false
  };
  stopBatchRequested = false;
}

export async function processBatchImageGeneration(
  meals: Array<{ id: number; title: string; ingredients: string[]; cuisine?: string; skillLevel?: string }>,
  updateMealImage: (mealId: number, imageUrl: string) => Promise<void>,
  incrementImageGen: (mealId: number) => Promise<void>
): Promise<void> {
  if (batchProgress.isRunning) {
    throw new Error("Batch job already running");
  }

  resetBatchProgress();
  batchProgress.isRunning = true;
  batchProgress.total = meals.length;

  const THROTTLE_MS = 4000; // 4 seconds between requests

  for (let i = 0; i < meals.length; i++) {
    if (stopBatchRequested) {
      batchProgress.isRunning = false;
      return;
    }

    const meal = meals[i];
    batchProgress.current = i + 1;
    batchProgress.currentMealTitle = meal.title;

    try {
      const result = await generateMealImage(
        meal.title, 
        meal.ingredients || [],
        meal.cuisine,
        meal.skillLevel
      );

      if (result.success && result.imageUrl) {
        await updateMealImage(meal.id, result.imageUrl);
        await incrementImageGen(meal.id);
        batchProgress.completed++;
      } else {
        batchProgress.failed++;
        batchProgress.failures.push({
          mealId: meal.id,
          title: meal.title,
          error: result.error || "Unknown error"
        });
      }
    } catch (error: any) {
      batchProgress.failed++;
      batchProgress.failures.push({
        mealId: meal.id,
        title: meal.title,
        error: error.message || "Unknown error"
      });
    }

    // Throttle between requests
    if (i < meals.length - 1 && !stopBatchRequested) {
      await new Promise(resolve => setTimeout(resolve, THROTTLE_MS));
    }
  }

  batchProgress.isRunning = false;
}
