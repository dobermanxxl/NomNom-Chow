
import { z } from 'zod';
import { insertMealSchema, insertDraftMealSchema, insertGeneratedRecipeSchema, meals, generatedRecipes, draftMeals, mealStats, type CreateMealRequest, type UpdateMealRequest, type GenerateRecipeRequest, type AIResponse, type InsertDraftMeal } from './schema';

export type { CreateMealRequest, UpdateMealRequest, GenerateRecipeRequest, AIResponse, InsertDraftMeal };

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  meals: {
    list: {
      method: 'GET' as const,
      path: '/api/meals',
      input: z.object({
        ageRange: z.string().optional(),
        diet: z.string().optional(),
        cuisine: z.string().optional(),
        skill: z.string().optional(),
        timeLimit: z.string().optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof meals.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/meals/:id',
      responses: {
        200: z.custom<typeof meals.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/meals',
      input: insertMealSchema,
      responses: {
        201: z.custom<typeof meals.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/meals/:id',
      input: insertMealSchema.partial(),
      responses: {
        200: z.custom<typeof meals.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/meals/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  ai: {
    generate: {
      method: 'POST' as const,
      path: '/api/ai/generate',
      input: z.object({
        mealId: z.number(),
        ageRange: z.string(),
        dietaryFilters: z.array(z.string()).optional(),
      }),
      responses: {
        200: z.custom<any>(), // AI Response structure
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },
    suggest: {
        method: 'POST' as const,
        path: '/api/ai/suggest',
        input: z.object({
            ingredients: z.array(z.string())
        }),
        responses: {
            200: z.array(z.custom<typeof meals.$inferSelect>()),
            500: errorSchemas.internal
        }
    }
  },
  admin: {
    login: {
      method: 'POST' as const,
      path: '/api/admin/login',
      input: z.object({
        password: z.string(),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
      },
    },
    stats: {
        method: 'GET' as const,
        path: '/api/admin/stats',
        responses: {
            200: z.object({
                totalMeals: z.number(),
                mostViewed: z.array(z.custom<any>()), // Simplified for now
                mostGenerated: z.array(z.custom<any>())
            }),
            401: errorSchemas.unauthorized
        }
    },
    generateImage: {
      method: 'POST' as const,
      path: '/api/admin/generate-meal-image',
      input: z.object({
        mealId: z.number().optional(),
        title: z.string(),
        ingredients: z.array(z.string()),
      }),
      responses: {
        200: z.object({ imageUrl: z.string() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        429: z.object({ message: z.string() }),
        500: errorSchemas.internal,
      }
    }
  },
  drafts: {
      create: {
          method: 'POST' as const,
          path: '/api/drafts',
          input: insertDraftMealSchema,
          responses: {
              201: z.custom<typeof draftMeals.$inferSelect>(),
              400: errorSchemas.validation
          }
      },
      list: {
          method: 'GET' as const,
          path: '/api/drafts',
          responses: {
              200: z.array(z.custom<typeof draftMeals.$inferSelect>()),
              401: errorSchemas.unauthorized
          }
      },
      approve: {
          method: 'POST' as const,
          path: '/api/drafts/:id/approve',
          responses: {
              200: z.custom<typeof draftMeals.$inferSelect>(),
              404: errorSchemas.notFound,
              401: errorSchemas.unauthorized
          }
      }
  }

};

// ============================================
// HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
