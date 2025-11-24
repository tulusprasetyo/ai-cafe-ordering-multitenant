"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  User,
  Phone,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  ChefHat,
  Package,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  tableNumber?: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  specialInstructions?: string;
  estimatedTime?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialRequests?: string;
  menuItemName: string;
  menuItemDescription?: string;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-orange-100 text-orange-800 border-orange-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const statusIcons = {
  pending: <Clock className="h-4 w-4" />,
  confirmed: <AlertCircle className="h-4 w-4" />,
  preparing: <ChefHat className="h-4 w-4" />,
  ready: <Package className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
  cancelled: <AlertCircle className="h-4 w-4" />,
};

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Load orders on mount
  useEffect(() => {
    loadOrders();
    // Set up real-time polling
    const interval = setInterval(loadOrders, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [selectedStatus]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedStatus !== 'all') {
        queryParams.append('status', selectedStatus);
      }

      const response = await fetch(`/api/orders?${queryParams.toString()}`);
      const result = await response.json();

      if (result.success) {
        setOrders(result.data.orders);
        calculateStats(result.data.orders);
      } else {
        toast.error('Failed to load orders');
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (orderData: Order[]) => {
    const newStats: OrderStats = {
      totalOrders: orderData.length,
      pendingOrders: orderData.filter(o => o.status === 'pending').length,
      preparingOrders: orderData.filter(o => o.status === 'preparing').length,
      readyOrders: orderData.filter(o => o.status === 'ready').length,
      completedOrders: orderData.filter(o => o.status === 'completed').length,
      totalRevenue: orderData
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.total, 0),
    };
    setStats(newStats);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setIsUpdating(orderId);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Order ${orderId} updated to ${newStatus}`);
        loadOrders(); // Refresh orders
      } else {
        toast.error(result.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order');
    } finally {
      setIsUpdating(null);
    }
  };

  const viewOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const result = await response.json();

      if (result.success) {
        setSelectedOrder(result.data.order);
      } else {
        toast.error('Failed to load order details');
      }
    } catch (error) {
      console.error('Failed to load order details:', error);
      toast.error('Failed to load order details');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusActions = (order: Order) => {
    const actions = [];

    switch (order.status) {
      case 'pending':
        actions.push(
          <Button
            key="confirm"
            size="sm"
            onClick={() => updateOrderStatus(order.id, 'confirmed')}
            disabled={isUpdating === order.id}
          >
            Confirm
          </Button>
        );
        break;
      case 'confirmed':
        actions.push(
          <Button
            key="prepare"
            size="sm"
            onClick={() => updateOrderStatus(order.id, 'preparing')}
            disabled={isUpdating === order.id}
          >
            Start Preparing
          </Button>
        );
        break;
      case 'preparing':
        actions.push(
          <Button
            key="ready"
            size="sm"
            onClick={() => updateOrderStatus(order.id, 'ready')}
            disabled={isUpdating === order.id}
          >
            Mark Ready
          </Button>
        );
        break;
      case 'ready':
        actions.push(
          <Button
            key="complete"
            size="sm"
            onClick={() => updateOrderStatus(order.id, 'completed')}
            disabled={isUpdating === order.id}
          >
            Complete
          </Button>
        );
        break;
    }

    if (['pending', 'confirmed'].includes(order.status)) {
      actions.push(
        <Button
          key="cancel"
          size="sm"
          variant="destructive"
          onClick={() => updateOrderStatus(order.id, 'cancelled')}
          disabled={isUpdating === order.id}
        >
          Cancel
        </Button>
      );
    }

    return actions;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">
            Manage and track restaurant orders in real-time
          </p>
        </div>
        <Button onClick={loadOrders} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Preparing</p>
                <p className="text-2xl font-bold text-orange-600">{stats.preparingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold text-green-600">{stats.readyOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-gray-600">{stats.completedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label htmlFor="status-filter" className="font-medium">Filter by status:</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        #{order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{order.customerName}</div>
                          {order.tableNumber && (
                            <div className="text-sm text-muted-foreground">Table {order.tableNumber}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.orderType === 'dine-in' && '🍽️ Dine In'}
                          {order.orderType === 'takeaway' && '🥡 Takeaway'}
                          {order.orderType === 'delivery' && '🚚 Delivery'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          <span className="flex items-center gap-1">
                            {statusIcons[order.status]}
                            {order.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>{order.itemCount || 0} items</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTime(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewOrderDetails(order.id)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Order Details</DialogTitle>
                              </DialogHeader>
                              {selectedOrder && selectedOrder.id === order.id && (
                                <ScrollArea className="max-h-[600px]">
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium">Order ID</label>
                                        <p className="font-mono text-sm">#{selectedOrder.id}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Status</label>
                                        <Badge className={statusColors[selectedOrder.status]}>
                                          <span className="flex items-center gap-1">
                                            {statusIcons[selectedOrder.status]}
                                            {selectedOrder.status}
                                          </span>
                                        </Badge>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Customer</label>
                                        <p>{selectedOrder.customerName}</p>
                                        {selectedOrder.customerPhone && (
                                          <p className="text-sm text-muted-foreground">{selectedOrder.customerPhone}</p>
                                        )}
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Order Type</label>
                                        <p>{selectedOrder.orderType}</p>
                                        {selectedOrder.tableNumber && (
                                          <p className="text-sm text-muted-foreground">Table {selectedOrder.tableNumber}</p>
                                        )}
                                      </div>
                                    </div>

                                    <Separator />

                                    <div>
                                      <label className="text-sm font-medium">Order Items</label>
                                      <div className="mt-2 space-y-2">
                                        {selectedOrder.items?.map((item) => (
                                          <div key={item.id} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-start">
                                              <div className="flex-1">
                                                <p className="font-medium">{item.menuItemName}</p>
                                                <p className="text-sm text-muted-foreground">{item.menuItemDescription}</p>
                                                {item.specialRequests && (
                                                  <p className="text-sm text-blue-600 mt-1">Note: {item.specialRequests}</p>
                                                )}
                                              </div>
                                              <div className="text-right ml-4">
                                                <p className="font-medium">{item.quantity}x</p>
                                                <p className="text-sm text-muted-foreground">{formatCurrency(item.unitPrice)}</p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {selectedOrder.specialInstructions && (
                                      <>
                                        <Separator />
                                        <div>
                                          <label className="text-sm font-medium">Special Instructions</label>
                                          <p className="mt-1 text-sm">{selectedOrder.specialInstructions}</p>
                                        </div>
                                      </>
                                    )}

                                    <Separator />

                                    <div className="flex justify-between items-center font-semibold">
                                      <span>Total</span>
                                      <span>{formatCurrency(selectedOrder.total)}</span>
                                    </div>
                                  </div>
                                </ScrollArea>
                              )}
                            </DialogContent>
                          </Dialog>

                          {getStatusActions(order)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}