"use client";

import { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  MessageCircle,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Send,
  Menu as MenuIcon,
  Clock,
  Users,
  Star,
  ChefHat
} from 'lucide-react';
import Image from 'next/image';
import { getTenantContext } from '@/lib/tenant';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  dietary: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
  };
  spicyLevel?: number;
  preparationTime?: number;
}

interface CartItem {
  itemId: string;
  quantity: number;
  specialRequests?: string;
  menuItem?: MenuItem;
  totalPrice?: number;
}

interface MenuData {
  [category: string]: MenuItem[];
}

export default function RestaurantMenuPage({ params }: { params: { 'resto-slug': string } }) {
  const [menu, setMenu] = useState<MenuData>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  // Load menu on mount
  useEffect(() => {
    loadMenu();
    loadCart();
  }, []);

  // Load menu from API
  const loadMenu = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: 'Show me the full menu',
          }],
        }),
      });

      // For now, let's create a mock menu structure
      const mockMenu: MenuData = {
        'Appetizers': [
          {
            id: '1',
            name: 'Spring Rolls',
            description: 'Fresh vegetables wrapped in rice paper, served with peanut sauce',
            price: 8.99,
            category: 'Appetizers',
            dietary: { vegetarian: true, vegan: true, glutenFree: false },
            spicyLevel: 1,
            preparationTime: 10,
          },
          {
            id: '2',
            name: 'Calamari',
            description: 'Golden fried squid rings with marinara sauce',
            price: 12.99,
            category: 'Appetizers',
            dietary: { vegetarian: false, vegan: false, glutenFree: false },
            spicyLevel: 2,
            preparationTime: 15,
          },
        ],
        'Main Courses': [
          {
            id: '3',
            name: 'Pad Thai',
            description: 'Stir-fried rice noodles with shrimp, tofu, peanuts, and tamarind sauce',
            price: 16.99,
            category: 'Main Courses',
            dietary: { vegetarian: false, vegan: false, glutenFree: true },
            spicyLevel: 3,
            preparationTime: 20,
          },
          {
            id: '4',
            name: 'Green Curry',
            description: 'Thai green curry with coconut milk, vegetables, and basil',
            price: 18.99,
            category: 'Main Courses',
            dietary: { vegetarian: true, vegan: true, glutenFree: true },
            spicyLevel: 4,
            preparationTime: 25,
          },
        ],
        'Desserts': [
          {
            id: '5',
            name: 'Mango Sticky Rice',
            description: 'Sweet glutinous rice with fresh mango and coconut cream',
            price: 7.99,
            category: 'Desserts',
            dietary: { vegetarian: true, vegan: true, glutenFree: false },
            spicyLevel: 0,
            preparationTime: 5,
          },
        ],
        'Beverages': [
          {
            id: '6',
            name: 'Thai Iced Tea',
            description: 'Sweet and creamy tea with condensed milk',
            price: 4.99,
            category: 'Beverages',
            dietary: { vegetarian: true, vegan: false, glutenFree: true },
            spicyLevel: 0,
            preparationTime: 5,
          },
        ],
      };

      setMenu(mockMenu);
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Load cart from local storage
  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem('restaurant-cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  };

  // Save cart to local storage
  const saveCart = (updatedCart: CartItem[]) => {
    localStorage.setItem('restaurant-cart', JSON.stringify(updatedCart));
    setCart(updatedCart);

    // Calculate totals
    const itemCount = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
    const total = updatedCart.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    setCartItemCount(itemCount);
    setCartTotal(total);
  };

  // Add item to cart
  const addToCart = async (menuItem: MenuItem) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: menuItem.id,
          quantity: 1,
        }),
      });

      if (response.ok) {
        const updatedCart = [...cart];
        const existingItem = updatedCart.find(item => item.itemId === menuItem.id);

        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          updatedCart.push({
            itemId: menuItem.id,
            quantity: 1,
            menuItem,
            totalPrice: menuItem.price,
          });
        }

        saveCart(updatedCart);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (itemId: string, quantity: number) => {
    if (quantity === 0) {
      // Remove item
      const updatedCart = cart.filter(item => item.itemId !== itemId);
      saveCart(updatedCart);
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          quantity,
        }),
      });

      if (response.ok) {
        const updatedCart = cart.map(item => {
          if (item.itemId === itemId) {
            const menuItem = Object.values(menu).flat().find(m => m.id === itemId);
            return {
              ...item,
              quantity,
              totalPrice: (menuItem?.price || 0) * quantity,
            };
          }
          return item;
        });
        saveCart(updatedCart);
      }
    } catch (error) {
      console.error('Failed to update cart:', error);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      await fetch('/api/cart', { method: 'DELETE' });
      saveCart([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  // Get all categories
  const categories = ['all', ...Object.keys(menu)];

  // Filter menu items
  const filteredMenu = selectedCategory === 'all'
    ? menu
    : { [selectedCategory]: menu[selectedCategory] || [] };

  // Dietary badge component
  const DietaryBadges = ({ item }: { item: MenuItem }) => (
    <div className="flex gap-1 flex-wrap">
      {item.dietary.vegetarian && <Badge variant="secondary" className="text-xs">🥗 Veg</Badge>}
      {item.dietary.vegan && <Badge variant="secondary" className="text-xs">🌱 Vegan</Badge>}
      {item.dietary.glutenFree && <Badge variant="secondary" className="text-xs">🌾 GF</Badge>}
      {item.spicyLevel && item.spicyLevel > 0 && (
        <Badge variant="destructive" className="text-xs">
          🌶️ {'🌶️'.repeat(item.spicyLevel)}
        </Badge>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">AI Cafe Menu</h1>
              <Badge variant="outline" className="hidden sm:inline-flex">
                {params['resto-slug']}
              </Badge>
            </div>

            {/* Cart Trigger */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {cartItemCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                  Cart
                </Button>
              </SheetTrigger>

              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Your Order</SheetTitle>
                </SheetHeader>

                <div className="mt-6">
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Your cart is empty
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.itemId} className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.menuItem?.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              ${item.menuItem?.price.toFixed(2)} each
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItem(item.itemId, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItem(item.itemId, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItem(item.itemId, 0)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <Button className="w-full" size="lg">
                          Proceed to Checkout
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            {/* Category Filter */}
            <div className="mb-6">
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Menu Items */}
            {isLoadingMenu ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(filteredMenu).map(([category, items]) => (
                  <div key={category}>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <ChefHat className="h-5 w-5" />
                      {category}
                    </h2>
                    <div className="grid gap-4">
                      {items.map((item) => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {item.image && (
                                <div className="relative w-20 h-20 flex-shrink-0">
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover rounded-lg"
                                  />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h3 className="font-semibold text-lg">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {item.description}
                                    </p>
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className="font-semibold text-lg">${item.price.toFixed(2)}</div>
                                    {item.preparationTime && (
                                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {item.preparationTime} min
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <DietaryBadges item={item} />
                                  <Button
                                    size="sm"
                                    onClick={() => addToCart(item)}
                                    className="ml-2"
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add to Cart
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Assistant Section */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  AI Waiter Assistant
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ask me about menu items, get recommendations, or help with your order!
                </p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">Hello! I'm your AI waiter assistant</p>
                        <p className="text-sm mt-2">
                          Try asking me:
                        </p>
                        <div className="mt-4 space-y-2 text-sm">
                          <p>• "What are your vegetarian options?"</p>
                          <p>• "Show me spicy dishes"</p>
                          <p>• "What do you recommend for a first-time visitor?"</p>
                          <p>• "Show me the full menu"</p>
                        </div>
                      </div>
                    )}

                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="border-t p-4">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask about our menu..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button type="submit" size="sm" disabled={isLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}