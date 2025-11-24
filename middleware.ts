import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { restaurant } from '@/db/schema';

// Cache for restaurant slug to ID mapping
const restaurantCache = new Map<string, { id: string; name: string }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

async function getRestaurantBySlug(slug: string) {
  // Check cache first
  const cached = restaurantCache.get(slug);
  const timestamp = cacheTimestamps.get(slug);

  if (cached && timestamp && Date.now() - timestamp < CACHE_TTL) {
    return cached;
  }

  // Query database
  const restaurantRecord = await db
    .select({
      id: restaurant.id,
      name: restaurant.name,
      status: restaurant.status,
    })
    .from(restaurant)
    .where(eq(restaurant.slug, slug))
    .limit(1);

  if (restaurantRecord.length === 0) {
    return null;
  }

  const restRecord = restaurantRecord[0];

  // Only return active restaurants
  if (restRecord.status !== 'active') {
    return null;
  }

  const result = {
    id: restRecord.id,
    name: restRecord.name,
  };

  // Update cache
  restaurantCache.set(slug, result);
  cacheTimestamps.set(slug, Date.now());

  return result;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and admin paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Extract restaurant slug from URL
  // Expected format: /{resto-slug}/...
  const pathSegments = pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) {
    // Root path - redirect to a default page or show landing
    return NextResponse.next();
  }

  const slug = pathSegments[0];

  // Skip if it doesn't look like a restaurant slug (e.g., /about, /contact)
  if (['about', 'contact', 'privacy', 'terms'].includes(slug)) {
    return NextResponse.next();
  }

  // Get restaurant info
  const restaurantInfo = await getRestaurantBySlug(slug);

  if (!restaurantInfo) {
    // Restaurant not found, could redirect to 404 or show a generic page
    return new NextResponse('Restaurant not found', { status: 404 });
  }

  // Add restaurant info to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-restaurant-id', restaurantInfo.id);
  requestHeaders.set('x-restaurant-name', restaurantInfo.name);
  requestHeaders.set('x-restaurant-slug', slug);

  // Create response with modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - dashboard (admin dashboard)
     * - admin (admin routes)
     * - auth (authentication routes)
     */
    '/((?!_next|api|dashboard|admin|auth|favicon.ico).*)',
  ],
};