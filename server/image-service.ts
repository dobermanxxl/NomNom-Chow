
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";
import { Buffer } from "node:buffer";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function generateMealImage(title: string, ingredients: string[]): Promise<string> {
  const prompt = `
    A realistic, home-cooked, kid-friendly meal: "${title}".
    Ingredients: ${ingredients.join(", ")}.
    Style: Photorealistic, natural kitchen lighting, home-cooked weeknight dinner, simple plate or bowl, normal portion sizes.
    Rules: No fancy plating, no garnish, no restaurant presentation, no studio lighting. 
    The image should look like a parent took a high-quality photo of a real dinner they just made.
  `.trim();

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
    response_format: "b64_json"
  } as any);

  const base64 = (response.data?.[0] as any)?.b64_json;
  if (!base64) throw new Error("Failed to generate image data");
  
  const buffer = Buffer.from(base64, "base64");

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "nomnomchow/meals" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result?.secure_url || "");
        }
      );
      uploadStream.end(buffer);
    });
  } else {
    const dir = path.join(process.cwd(), "client", "public", "generated", "meals");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, buffer);
    return `/generated/meals/${fileName}`;
  }
}
