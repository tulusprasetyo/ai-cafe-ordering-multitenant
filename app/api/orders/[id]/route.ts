import { NextRequest, NextResponse } from 'next/server';
import { getRestaurantId } from '@/lib/tenant';
import { db } from '@/db';
import { order, orderItem, menuItem } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Update order status schema
const updateOrderSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']),
});

// GET - Get specific order details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurantId = await getRestaurantId();
    const orderId = params.id;

    // Get order details
    const orderData = await db
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
      })
      .from(order)
      .where(
        and(
          eq(order.id, orderId),
          eq(order.restaurantId, restaurantId)
        )
      )
      .limit(1);

    if (orderData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get order items
    const orderItems = await db
      .select({
        id: orderItem.id,
        menuItemId: orderItem.menuItemId,
        quantity: orderItem.quantity,
        unitPrice: orderItem.unitPrice,
        totalPrice: orderItem.totalPrice,
        specialRequests: orderItem.specialRequests,
        menuItemName: menuItem.name,
        menuItemDescription: menuItem.description,
      })
      .from(orderItem)
      .innerJoin(menuItem, eq(orderItem.menuItemId, menuItem.id))
      .where(eq(orderItem.orderId, orderId));

    return NextResponse.json({
      success: true,
      data: {
        order: {
          ...orderData[0],
          subtotal: parseFloat(orderData[0].subtotal as string),
          tax: parseFloat(orderData[0].tax as string),
          total: parseFloat(orderData[0].total as string),
          items: orderItems.map(item => ({
            ...item,
            unitPrice: parseFloat(item.unitPrice as string),
            totalPrice: parseFloat(item.totalPrice as string),
          })),
        },
      },
    });
  } catch (error) {
    console.error('GET order error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve order' },
      { status: 500 }
    );
  }
}

// PATCH - Update order status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurantId = await getRestaurantId();
    const orderId = params.id;

    const body = await req.json();
    const { status } = updateOrderSchema.parse(body);

    // Check if order exists and belongs to this restaurant
    const existingOrder = await db
      .select({ id: order.id, status: order.status })
      .from(order)
      .where(
        and(
          eq(order.id, orderId),
          eq(order.restaurantId, restaurantId)
        )
      )
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = { status, updatedAt: new Date() };

    // Set completedAt when order is completed
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    // Update order
    await db
      .update(order)
      .set(updateData)
      .where(eq(order.id, orderId));

    // Get updated order details
    const updatedOrder = await db
      .select({
        id: order.id,
        customerName: order.customerName,
        status: order.status,
        completedAt: order.completedAt,
        updatedAt: order.updatedAt,
      })
      .from(order)
      .where(eq(order.id, orderId))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        order: updatedOrder[0],
        previousStatus: existingOrder[0].status,
        newStatus: status,
      },
    });
  } catch (error) {
    console.error('PATCH order error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel order (soft delete by updating status)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurantId = await getRestaurantId();
    const orderId = params.id;

    // Check if order exists and can be cancelled
    const existingOrder = await db
      .select({ id: order.id, status: order.status })
      .from(order)
      .where(
        and(
          eq(order.id, orderId),
          eq(order.restaurantId, restaurantId)
        )
      )
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only allow cancellation of pending or confirmed orders
    const currentStatus = existingOrder[0].status;
    if (!['pending', 'confirmed'].includes(currentStatus)) {
      return NextResponse.json(
        { success: false, error: 'Order cannot be cancelled at this stage' },
        { status: 400 }
      );
    }

    // Cancel order
    await db
      .update(order)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(order.id, orderId));

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        status: 'cancelled',
        message: 'Order cancelled successfully',
      },
    });
  } catch (error) {
    console.error('DELETE order error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}