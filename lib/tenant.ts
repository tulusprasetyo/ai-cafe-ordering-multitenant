import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export interface TenantContext {
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
}

/**
 * Get tenant context from request headers
 */
export async function getTenantContext(): Promise<TenantContext> {
  const headersList = await headers();
  const restaurantId = headersList.get('x-restaurant-id');
  const restaurantName = headersList.get('x-restaurant-name');
  const restaurantSlug = headersList.get('x-restaurant-slug');

  if (!restaurantId || !restaurantName || !restaurantSlug) {
    throw new Error('Tenant context not found');
  }

  return {
    restaurantId,
    restaurantName,
    restaurantSlug,
  };
}

/**
 * Get restaurant ID from tenant context
 */
export async function getRestaurantId(): Promise<string> {
  const context = await getTenantContext();
  return context.restaurantId;
}

/**
 * Server component hook to get tenant context
 */
export function useTenantContext(): TenantContext {
  const headersList = headers();
  const restaurantId = headersList.get('x-restaurant-id');
  const restaurantName = headersList.get('x-restaurant-name');
  const restaurantSlug = headersList.get('x-restaurant-slug');

  if (!restaurantId || !restaurantName || !restaurantSlug) {
    throw new Error('Tenant context not found');
  }

  return {
    restaurantId,
    restaurantName,
    restaurantSlug,
  };
}

/**
 * Validate that an operation is scoped to the correct tenant
 */
export async function validateTenantAccess(resourceRestaurantId: string): Promise<boolean> {
  try {
    const context = await getTenantContext();
    return context.restaurantId === resourceRestaurantId;
  } catch (error) {
    return false;
  }
}

/**
 * Get tenant-specific database query filter
 */
export async function getTenantFilter() {
  const restaurantId = await getRestaurantId();
  return { restaurantId };
}