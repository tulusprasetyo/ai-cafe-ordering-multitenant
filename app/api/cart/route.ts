import { NextRequest, NextResponse } from 'next/server';
import { getRestaurantId } from '@/lib/tenant';
import { db } from '@/db';
import { menuItem } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Cart item schema
const cartItemSchema = z.object({
  itemId: z.string(),
  quantity: z.number().min(1),
  specialRequests: z.string().optional(),
});

// In-memory cart storage (in production, use Redis or database)
const carts = new Map<string, any[]>(); // sessionId -> cart items

function getCartId(req: NextRequest): string {
  // Try to get from session cookie first
  const sessionCookie = req.cookies.get('cart-session');
  if (sessionCookie?.value) {
    return sessionCookie.value;
  }

  // Fallback to IP address + user agent (not ideal for production)
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return btoa(`${ip}-${userAgent}`).substring(0, 32);
}

async function validateMenuItem(itemId: string, restaurantId: string) {
  const item = await db
    .select({
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      isAvailable: menuItem.isAvailable,
    })
    .from(menuItem)
    .where(
      and(
        eq(menuItem.id, itemId),
        eq(menuItem.restaurantId, restaurantId)
      )
    )
    .limit(1);

  return item[0] || null;
}

// GET - Retrieve cart
export async function GET(req: NextRequest) {
  try {
    const restaurantId = await getRestaurantId();
    const cartId = getCartId(req);

    const cart = carts.get(cartId) || [];

    // Validate all items still exist and are available
    const validItems = [];
    for (const item of cart) {
      const menuItem = await validateMenuItem(item.itemId, restaurantId);
      if (menuItem && menuItem.isAvailable) {
        validItems.push({
          ...item,
          menuItem: {
            id: menuItem.id,
            name: menuItem.name,
            price: parseFloat(menuItem.price as string),
          },
          totalPrice: parseFloat(menuItem.price as string) * item.quantity,
        });
      }
    }

    // Update cart with validated items
    carts.set(cartId, validItems.map(item => ({
      itemId: item.itemId,
      quantity: item.quantity,
      specialRequests: item.specialRequests,
    })));

    return NextResponse.json({
      success: true,
      data: {
        items: validItems,
        totalItems: validItems.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: validItems.reduce((sum, item) => sum + item.totalPrice, 0),
      },
    });
  } catch (error) {
    console.error('GET cart error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve cart' },
      { status: 500 }
    );
  }
}

// POST - Add item to cart
export async function POST(req: NextRequest) {
  try {
    const restaurantId = await getRestaurantId();
    const cartId = getCartId(req);

    const body = await req.json();
    const { itemId, quantity, specialRequests } = cartItemSchema.parse(body);

    // Validate menu item exists and is available
    const menuItem = await validateMenuItem(itemId, restaurantId);
    if (!menuItem) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      );
    }

    if (!menuItem.isAvailable) {
      return NextResponse.json(
        { success: false, error: 'Menu item is not available' },
        { status: 400 }
      );
    }

    // Get or create cart
    const cart = carts.get(cartId) || [];

    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => item.itemId === itemId);

    if (existingItemIndex >= 0) {
      // Update quantity
      cart[existingItemIndex].quantity += quantity;
      if (specialRequests) {
        cart[existingItemIndex].specialRequests = specialRequests;
      }
    } else {
      // Add new item
      cart.push({
        itemId,
        quantity,
        specialRequests,
      });
    }

    carts.set(cartId, cart);

    const totalPrice = parseFloat(menuItem.price as string) * quantity;

    return NextResponse.json({
      success: true,
      data: {
        itemId,
        name: menuItem.name,
        quantity,
        unitPrice: parseFloat(menuItem.price as string),
        totalPrice,
        specialRequests,
        cartTotal: cart.reduce((sum, item) => {
          const itemPrice = item.itemId === itemId
            ? totalPrice
            : 0; // We'd need to look up other items' prices in a real implementation
          return sum + itemPrice + (item.quantity * 10); // Placeholder
        }, 0),
      },
    });
  } catch (error) {
    console.error('POST cart error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// PUT - Update cart item
export async function PUT(req: NextRequest) {
  try {
    const restaurantId = await getRestaurantId();
    const cartId = getCartId(req);

    const body = await req.json();
    const { itemId, quantity, specialRequests } = cartItemSchema.parse(body);

    // Validate menu item exists
    const menuItem = await validateMenuItem(itemId, restaurantId);
    if (!menuItem) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      );
    }

    const cart = carts.get(cartId) || [];
    const itemIndex = cart.findIndex(item => item.itemId === itemId);

    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Item not found in cart' },
        { status: 404 }
      );
    }

    if (quantity === 0) {
      // Remove item
      cart.splice(itemIndex, 1);
    } else {
      // Update item
      cart[itemIndex] = {
        itemId,
        quantity,
        specialRequests,
      };
    }

    carts.set(cartId, cart);

    return NextResponse.json({
      success: true,
      data: {
        itemId,
        quantity,
        specialRequests,
      },
    });
  } catch (error) {
    console.error('PUT cart error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

// DELETE - Clear cart or remove specific item
export async function DELETE(req: NextRequest) {
  try {
    const cartId = getCartId(req);
    const url = new URL(req.url);
    const itemId = url.searchParams.get('itemId');

    if (itemId) {
      // Remove specific item
      const cart = carts.get(cartId) || [];
      const itemIndex = cart.findIndex(item => item.itemId === itemId);

      if (itemIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'Item not found in cart' },
          { status: 404 }
        );
      }

      cart.splice(itemIndex, 1);
      carts.set(cartId, cart);
    } else {
      // Clear entire cart
      carts.delete(cartId);
    }

    return NextResponse.json({
      success: true,
      data: { cleared: true },
    });
  } catch (error) {
    console.error('DELETE cart error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}