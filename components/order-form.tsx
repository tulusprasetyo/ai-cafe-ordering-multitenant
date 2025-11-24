"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
  itemId: string;
  quantity: number;
  specialRequests?: string;
  menuItem?: {
    id: string;
    name: string;
    price: number;
  };
  totalPrice?: number;
}

interface OrderFormProps {
  cart: CartItem[];
  cartTotal: number;
  onOrderPlaced: () => void;
  onCancel: () => void;
}

export default function OrderForm({ cart, cartTotal, onOrderPlaced, onCancel }: OrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderData, setOrderData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    orderType: 'dine-in',
    tableNumber: '',
    specialInstructions: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!orderData.customerName.trim()) {
      newErrors.customerName = 'Name is required';
    }

    if (!orderData.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    }

    if (orderData.orderType === 'dine-in' && !orderData.tableNumber.trim()) {
      newErrors.tableNumber = 'Table number is required for dine-in orders';
    }

    if (orderData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderData.customerEmail)) {
      newErrors.customerEmail = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        ...orderData,
        items: cart.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          specialRequests: item.specialRequests,
        })),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Order placed successfully! 🎉');
        onOrderPlaced();
      } else {
        toast.error(result.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setOrderData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const estimatedTime = Math.max(...cart.map(item => 15), 15) + 10; // Estimate based on cart items

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Complete Your Order
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.menuItem?.name}
                    </span>
                    <span>${(item.totalPrice || 0).toFixed(2)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Estimated preparation time: {estimatedTime} minutes
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Name *</Label>
                  <Input
                    id="customerName"
                    value={orderData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    placeholder="John Doe"
                    className={errors.customerName ? 'border-red-500' : ''}
                  />
                  {errors.customerName && (
                    <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerPhone">Phone *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={orderData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    placeholder="+1 234 567 8900"
                    className={errors.customerPhone ? 'border-red-500' : ''}
                  />
                  {errors.customerPhone && (
                    <p className="text-xs text-red-500 mt-1">{errors.customerPhone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerEmail">Email (optional)</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={orderData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    placeholder="john@example.com"
                    className={errors.customerEmail ? 'border-red-500' : ''}
                  />
                  {errors.customerEmail && (
                    <p className="text-xs text-red-500 mt-1">{errors.customerEmail}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Type */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Order Type
              </h3>

              <RadioGroup
                value={orderData.orderType}
                onValueChange={(value) => handleInputChange('orderType', value)}
                className="grid grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dine-in" id="dine-in" />
                  <Label htmlFor="dine-in" className="flex items-center gap-2">
                    <span>🍽️ Dine In</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="takeaway" id="takeaway" />
                  <Label htmlFor="takeaway" className="flex items-center gap-2">
                    <span>🥡 Takeaway</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex items-center gap-2">
                    <span>🚚 Delivery</span>
                  </Label>
                </div>
              </RadioGroup>

              {orderData.orderType === 'dine-in' && (
                <div>
                  <Label htmlFor="tableNumber">Table Number *</Label>
                  <Input
                    id="tableNumber"
                    value={orderData.tableNumber}
                    onChange={(e) => handleInputChange('tableNumber', e.target.value)}
                    placeholder="e.g., T1, A12, etc."
                    className={errors.tableNumber ? 'border-red-500' : ''}
                  />
                  {errors.tableNumber && (
                    <p className="text-xs text-red-500 mt-1">{errors.tableNumber}</p>
                  )}
                </div>
              )}
            </div>

            {/* Special Instructions */}
            <div className="space-y-2">
              <Label htmlFor="specialInstructions">Special Instructions (optional)</Label>
              <Textarea
                id="specialInstructions"
                value={orderData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                placeholder="Any allergies, dietary restrictions, or special requests..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Placing Order...' : `Place Order • $${cartTotal.toFixed(2)}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}