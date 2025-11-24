import { Metadata } from 'next';
import { headers } from 'next/headers';

interface RestaurantLayoutProps {
  children: React.ReactNode;
  params: {
    'resto-slug': string;
  };
}

export async function generateMetadata({
  params,
}: RestaurantLayoutProps): Promise<Metadata> {
  const headersList = await headers();
  const restaurantName = headersList.get('x-restaurant-name') || 'AI Cafe';
  const restaurantSlug = params['resto-slug'];

  return {
    title: `${restaurantName} - AI Powered Menu`,
    description: `Order from ${restaurantName} with our AI-powered menu assistant. Get personalized recommendations and chat with our virtual waiter.`,
    openGraph: {
      title: `${restaurantName} - AI Powered Menu`,
      description: `Order from ${restaurantName} with our AI-powered menu assistant.`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${restaurantName} - AI Powered Menu`,
      description: `Order from ${restaurantName} with our AI-powered menu assistant.`,
    },
    alternates: {
      canonical: `/${restaurantSlug}`,
    },
  };
}

export default function RestaurantLayout({
  children,
}: RestaurantLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}