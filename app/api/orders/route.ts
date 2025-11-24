import { NextRequest, NextResponse } from 'next/server';
import { getRestaurantId } from '@/lib/tenant';
import { db } from '@/db';
import { order, orderItem, menuItem } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Order creation schema
const createOrderSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  tableNumber: z.string().optional(),
  orderType: z.enum(['dine-in', 'takeaway', 'delivery']),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().min(1),
    specialRequests: z.string().optional(),
  })).min(1),
  specialInstructions: z.string().optional(),
});

// GET - Get orders (for admin)
export async function GET(req: NextRequest) {
  try {
    const restaurantId = await getRestaurantId();
    const url = new URL(req.url);
    const status = url.searchParams.get('status') as any;
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = db
      .select({
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        tableNumber: order.tableNumber,
        orderType: order.orderType,
        status: order.status,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        specialInstructions: order.specialInstructions,
        estimatedTime: order.estimatedTime,
        completedAt: order.completedAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        itemCount: db.select({ count: orderItem.id }).from(orderItem).where(eq(orderItem.orderId, order.id)).as('itemCount'),
      })
      .from(order)
      .where(eq(order.restaurantId, restaurantId))
      .orderBy(order.createdAt)
      .limit(limit)
      .offset(offset);

    if (status) {
      query = query.where(and(eq(order.restaurantId, restaurantId), eq(order.status, status)));
    }

    const orders = await query.execute();

    return NextResponse.json({
      success: true,
      data: {
        orders: orders.map(orderData => ({
          ...orderData,
          subtotal: parseFloat(orderData.subtotal as string),
          tax: parseFloat(orderData.tax as string),
          total: parseFloat(orderData.total as string),
          itemCount: Number(orderData.itemCount) || 0,
        })),
        pagination: {
          limit,
          offset,
        },
      },
    });
  } catch (error) {
    console.error('GET orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve orders' },
      { status: 500 }
    );
  }
}

// POST - Create new order
export async function POST(req: NextRequest) {
  try {
    const restaurantId = await getRestaurantId();

    const body = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      tableNumber,
      orderType,
      items,
      specialInstructions,
    } = createOrderSchema.parse(body);

    // Validate all menu items exist and are available
    const menuItemIds = items.map(item => item.itemId);
    const menuItems = await db
      .select({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        isAvailable: menuItem.isAvailable,
        preparationTime: menuItem.preparationTime,
      })
      .from(menuItem)
      .where(
        and(
          eq(menuItem.restaurantId, restaurantId),
          menuItem.id.in(menuItemIds)
        )
      )
      .execute();

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some menu items are not available' },
        { status: 400 }
      );
    }

    const unavailableItems = menuItems.filter(item => !item.isAvailable);
    if (unavailableItems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Some menu items are currently unavailable',
          unavailableItems: unavailableItems.map(item => item.name),
        },
        { status: 400 }
      );
    }

    // Calculate totals
    let subtotal = 0;
    const orderItemsData = items.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.itemId);
      const unitPrice = parseFloat(menuItem!.price as string);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      return {
        id: crypto.randomUUID(),
        menuItemId: item.itemId,
        quantity: item.quantity,
        unitPrice: unitPrice.toString(),
        totalPrice: totalPrice.toString(),
        specialRequests: item.specialRequests,
      };
    });

    // Calculate tax (assuming 8% tax rate - this should come from restaurant settings)
    const taxRate = 0.08;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Calculate estimated preparation time (max of all items + buffer)
    const maxPrepTime = Math.max(...menuItems.map(item => item.preparationTime || 15));
    const estimatedTime = maxPrepTime + 10; // Add 10 minute buffer

    // Create order
    const orderId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      // Insert order
      await tx.insert(order).values({
        id: orderId,
        restaurantId,
        customerName,
        customerEmail,
        customerPhone,
        tableNumber,
        orderType,
        status: 'pending',
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        specialInstructions,
        estimatedTime,
      });

      // Insert order items
      for (const itemData of orderItemsData) {
        await tx.insert(orderItem).values({
          id: itemData.id,
          orderId,
          menuItemId: itemData.menuItemId,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          totalPrice: itemData.totalPrice,
          specialRequests: itemData.specialRequests,
        });
      }
    });

    // Return created order with details
    const createdOrder = await db
      .select({
        id: order.id,
        customerName: order.customerName,
        orderType: order.orderType,
        status: order.status,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        specialInstructions: order.specialInstructions,
        estimatedTime: order.estimatedTime,
        createdAt: order.createdAt,
      })
      .from(order)
      .where(eq(order.id, orderId))
      .limit(1);

    const orderItems = await db
      .select({
        id: orderItem.id,
        menuItemId: orderItem.menuItemId,
        quantity: orderItem.quantity,
        unitPrice: orderItem.unitPrice,
        totalPrice: orderItem.totalPrice,
        specialRequests: orderItem.specialRequests,
        itemName: menuItem.name,
      })
      .from(orderItem)
      .innerJoin(menuItem, eq(orderItem.menuItemId, menuItem.id))
      .where(eq(orderItem.orderId, orderId));

    return NextResponse.json({
      success: true,
      data: {
        order: {
          ...createdOrder[0],
          subtotal: parseFloat(createdOrder[0].subtotal as string),
          tax: parseFloat(createdOrder[0].tax as string),
          total: parseFloat(createdOrder[0].total as string),
          items: orderItems.map(item => ({
            ...item,
            unitPrice: parseFloat(item.unitPrice as string),
            totalPrice: parseFloat(item.totalPrice as string),
          })),
        },
      },
    });
  } catch (error) {
    console.error('POST orders error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}