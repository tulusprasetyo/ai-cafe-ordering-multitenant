import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { NextRequest } from 'next/server';
import { db } from '@/db';
import { menuItem, category, restaurant } from '@/db/schema';
import { eq, and, ilike, desc } from 'drizzle-orm';
import { getRestaurantId } from '@/lib/tenant';
import { z } from 'zod';

// Define the tool schemas
const searchMenuSchema = z.object({
  query: z.string().describe('Search query for menu items'),
  category: z.string().optional().describe('Category to filter by'),
  maxPrice: z.number().optional().describe('Maximum price filter'),
  vegetarian: z.boolean().optional().describe('Filter for vegetarian items'),
  vegan: z.boolean().optional().describe('Filter for vegan items'),
  glutenFree: z.boolean().optional().describe('Filter for gluten-free items'),
});

const getMenuItemSchema = z.object({
  itemId: z.string().describe('ID of the menu item to get details for'),
});

const getFullMenuSchema = z.object({
  category: z.string().optional().describe('Category to filter by'),
});

// Tool functions
async function searchMenuTools(params: z.infer<typeof searchMenuSchema>) {
  try {
    const restaurantId = await getRestaurantId();

    let query = db
      .select({
        id: menuItem.id,
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        image: menuItem.image,
        category: category.name,
        isVegetarian: menuItem.isVegetarian,
        isVegan: menuItem.isVegan,
        isGlutenFree: menuItem.isGlutenFree,
        isAvailable: menuItem.isAvailable,
        preparationTime: menuItem.preparationTime,
        spicyLevel: menuItem.spicyLevel,
        ingredients: menuItem.ingredients,
      })
      .from(menuItem)
      .leftJoin(category, eq(menuItem.categoryId, category.id))
      .where(
        and(
          eq(menuItem.restaurantId, restaurantId),
          eq(menuItem.isAvailable, true)
        )
      );

    // Apply search filters
    if (params.query) {
      query = query.where(
        and(
          eq(menuItem.restaurantId, restaurantId),
          eq(menuItem.isAvailable, true),
          ilike(menuItem.name, `%${params.query}%`)
        )
      );
    }

    const results = await query.limit(20).execute();

    return {
      success: true,
      data: results.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price as string),
        image: item.image,
        category: item.category,
        dietary: {
          vegetarian: item.isVegetarian,
          vegan: item.isVegan,
          glutenFree: item.isGlutenFree,
        },
        preparationTime: item.preparationTime,
        spicyLevel: item.spicyLevel,
        ingredients: item.ingredients,
      })),
    };
  } catch (error) {
    console.error('Error searching menu:', error);
    return {
      success: false,
      error: 'Failed to search menu items',
    };
  }
}

async function getMenuItemDetails(params: z.infer<typeof getMenuItemSchema>) {
  try {
    const restaurantId = await getRestaurantId();

    const result = await db
      .select({
        id: menuItem.id,
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        image: menuItem.image,
        images: menuItem.images,
        ingredients: menuItem.ingredients,
        allergens: menuItem.allergens,
        nutritionInfo: menuItem.nutritionInfo,
        isVegetarian: menuItem.isVegetarian,
        isVegan: menuItem.isVegan,
        isGlutenFree: menuItem.isGlutenFree,
        spicyLevel: menuItem.spicyLevel,
        preparationTime: menuItem.preparationTime,
        category: category.name,
        categoryDescription: category.description,
      })
      .from(menuItem)
      .leftJoin(category, eq(menuItem.categoryId, category.id))
      .where(
        and(
          eq(menuItem.id, params.itemId),
          eq(menuItem.restaurantId, restaurantId),
          eq(menuItem.isAvailable, true)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        error: 'Menu item not found',
      };
    }

    const item = result[0];

    return {
      success: true,
      data: {
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price as string),
        image: item.image,
        images: item.images,
        ingredients: item.ingredients,
        allergens: item.allergens,
        nutritionInfo: item.nutritionInfo,
        dietary: {
          vegetarian: item.isVegetarian,
          vegan: item.isVegan,
          glutenFree: item.isGlutenFree,
        },
        spicyLevel: item.spicyLevel,
        preparationTime: item.preparationTime,
        category: item.category,
        categoryDescription: item.categoryDescription,
      },
    };
  } catch (error) {
    console.error('Error getting menu item details:', error);
    return {
      success: false,
      error: 'Failed to get menu item details',
    };
  }
}

async function getFullMenu(params: z.infer<typeof getFullMenuSchema>) {
  try {
    const restaurantId = await getRestaurantId();

    let query = db
      .select({
        id: menuItem.id,
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        image: menuItem.image,
        category: category.name,
        categoryName: category.name,
        sortOrder: menuItem.sortOrder,
        isVegetarian: menuItem.isVegetarian,
        isVegan: menuItem.isVegan,
        isGlutenFree: menuItem.isGlutenFree,
        spicyLevel: menuItem.spicyLevel,
        preparationTime: menuItem.preparationTime,
      })
      .from(menuItem)
      .leftJoin(category, eq(menuItem.categoryId, category.id))
      .where(
        and(
          eq(menuItem.restaurantId, restaurantId),
          eq(menuItem.isAvailable, true)
        )
      )
      .orderBy(menuItem.sortOrder, menuItem.name);

    if (params.category) {
      query = query.where(ilike(category.name, `%${params.category}%`));
    }

    const results = await query.execute();

    // Group by category
    const menuByCategory = results.reduce((acc, item) => {
      const category = item.categoryName || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price as string),
        image: item.image,
        dietary: {
          vegetarian: item.isVegetarian,
          vegan: item.isVegan,
          glutenFree: item.isGlutenFree,
        },
        spicyLevel: item.spicyLevel,
        preparationTime: item.preparationTime,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return {
      success: true,
      data: menuByCategory,
    };
  } catch (error) {
    console.error('Error getting full menu:', error);
    return {
      success: false,
      error: 'Failed to get menu',
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    // Get restaurant information for context
    const restaurantId = await getRestaurantId();
    const restaurantInfo = await db
      .select({
        name: restaurant.name,
        description: restaurant.description,
      })
      .from(restaurant)
      .where(eq(restaurant.id, restaurantId))
      .limit(1);

    const restaurantName = restaurantInfo[0]?.name || 'our restaurant';

    const result = await streamText({
      model: google('gemini-2.0-flash-exp'),
      messages,
      system: `You are a friendly and helpful AI waiter assistant for ${restaurantName}. Your role is to help customers with:

1. **Menu Navigation**: Help customers find items based on their preferences, dietary restrictions, and cravings
2. **Recommendations**: Suggest popular items, combinations, or specials based on what they're looking for
3. **Order Assistance**: Help customers add items to their cart and understand the ordering process
4. **Information**: Provide details about ingredients, preparation time, spice levels, and dietary accommodations

**Guidelines:**
- Be conversational, friendly, and professional like a real waiter
- Ask clarifying questions to understand their preferences
- Highlight popular items or chef's recommendations
- Be honest about preparation times and ingredient availability
- For dietary restrictions, always double-check by using the search tools to verify item details
- When suggesting items, mention key features like taste profile, spice level, or popular combinations
- Keep responses concise but helpful
- Use appropriate emojis to make the conversation more engaging 😊

**Available Tools:**
- searchMenu: Find items matching specific criteria
- getMenuItemDetails: Get complete information about a specific item
- getFullMenu: Display the entire menu organized by categories

Remember to use the tools to get accurate, real-time information about menu items rather than making assumptions.`,
      tools: {
        searchMenu: {
          description: 'Search for menu items based on query, category, dietary preferences, or price range',
          parameters: searchMenuSchema,
          execute: searchMenuTools,
        },
        getMenuItemDetails: {
          description: 'Get detailed information about a specific menu item including ingredients and nutritional info',
          parameters: getMenuItemSchema,
          execute: getMenuItemDetails,
        },
        getFullMenu: {
          description: 'Get the complete menu organized by categories, optionally filtered by category',
          parameters: getFullMenuSchema,
          execute: getFullMenu,
        },
      },
      maxSteps: 5,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}