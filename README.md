# Nom Nom Chow - Kids Meal Picker

A production-ready full-stack web application for parents seeking kid-friendly meal ideas. The app provides an image-first "pick a meal - get shopping list + instructions" experience with AI-powered recipe generation.

## Features

- **Meal Discovery**: Browse 80+ kid-friendly meals with filters (age range, dietary needs, cuisine, skill level, time limit)
- **AI-Generated Recipes**: Get detailed cooking instructions and organized shopping lists via OpenAI
- **AI-Generated Images**: Photorealistic meal images generated automatically
- **"My Fridge" Feature**: Enter ingredients you have and get AI-suggested meals
- **Admin Dashboard**: Password-protected dashboard for meal management and batch operations
- **Search**: Full-text search across titles, descriptions, ingredients, and cuisine

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI API (via Replit AI Integrations)
- **Image Storage**: Cloudinary (required for production)

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `ADMIN_PASSWORD` - Password for admin dashboard access

### For AI Features
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Automatically set by Replit AI Integrations
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Automatically set by Replit AI Integrations

### For Image Generation (Required for Production)
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret

## Batch Image Generation

The Admin dashboard includes a powerful batch image generation feature:

### How It Works
1. Navigate to `/admin` and log in with your admin password
2. Click the "Images" tab
3. View stats showing total meals, meals with images, and meals missing images
4. Click "Generate Missing Images" to automatically generate images for all meals without one
5. Or click "Regenerate All Images" to refresh all meal images

### Rate Limiting & Throttling
- **Rate Limit**: 30 images per hour per admin session
- **Throttling**: 4 seconds between each image generation request
- **Progress Tracking**: Real-time progress bar showing current meal, completed count, and failures
- **Stop Button**: Cancel batch job at any time

### Image Generation Prompt
All generated images follow these rules:
- Photorealistic, home-cooked appearance
- Natural kitchen lighting
- Simple plate or bowl presentation
- No fancy restaurant plating or garnish
- Accurately matches meal title and ingredients

## Aspect Ratio Enforcement

All meal images maintain a consistent 1:1 square aspect ratio:

### Backend
- Generated images are 1024x1024 pixels
- Cloudinary transformation: `width=1024, height=1024, crop=fill, gravity=auto`
- WebP format with auto quality for optimal performance

### Frontend
- MealCard uses `aspect-square` container with `object-cover`
- Fallback placeholder SVG for meals without images
- Consistent grid layout regardless of original image dimensions

## Search Functionality

### What's Searchable
- Meal title (e.g., "chicken", "pasta")
- Description
- Cuisine type (e.g., "Mexican", "Italian")
- Ingredients (e.g., "steak", "cheese")
- Dietary flags (e.g., "vegetarian", "gluten-free")
- Skill level

### Search Features
- Case-insensitive matching
- Debounced input (300ms) for better performance
- Works in combination with all filters
- Clear button to reset search
- "No results" state with suggested search terms

### API Usage
```
GET /api/meals?search=steak&cuisine=American&skill=Easy&timeLimit=30
```

## Setting Up Cloudinary

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. From your Dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret
3. Add these as environment variables in Replit Secrets
4. Image generation will automatically use Cloudinary when configured

**Note**: Without Cloudinary configured, image generation buttons will be disabled and an error message will be shown in the Admin panel.

## Development

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

## Adding Sample Meals

1. Go to Admin Dashboard
2. Click "Add Sample Meals" button
3. This adds ~80 kid-friendly meals from the sample database (avoids duplicates)

## Production Deployment

The app is designed for deployment to Vercel or similar platforms:

1. Set all required environment variables
2. Ensure Cloudinary is configured (required for image storage)
3. Database should be a production PostgreSQL instance

## License

MIT
