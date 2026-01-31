import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  RefreshCw,
  ChefHat,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  token: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  pickupTime: string;
  items: string[];
  total: number;
  createdAt: string;
  estimatedReady?: string;
}

const mockOrders: Order[] = [
  {
    id: '1',
    token: 4521,
    status: 'preparing',
    pickupTime: '12:30 PM',
    items: ['Chicken Biryani', 'Cold Coffee'],
    total: 290,
    createdAt: '12:15 PM',
    estimatedReady: '12:28 PM',
  },
  {
    id: '2',
    token: 4498,
    status: 'ready',
    pickupTime: '11:30 AM',
    items: ['Masala Dosa', 'Masala Chai'],
    total: 100,
    createdAt: '11:10 AM',
  },
  {
    id: '3',
    token: 4452,
    status: 'completed',
    pickupTime: '10:00 AM',
    items: ['Idli Sambar', 'Poha'],
    total: 95,
    createdAt: '9:45 AM',
  },
];

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-golden-amber/10 text-golden-amber border-golden-amber/20',
    dotColor: 'bg-golden-amber',
  },
  preparing: {
    label: 'Preparing',
    icon: ChefHat,
    color: 'bg-preparing/10 text-preparing border-preparing/20',
    dotColor: 'bg-preparing',
  },
  ready: {
    label: 'Ready for Pickup',
    icon: CheckCircle2,
    color: 'bg-ready/10 text-ready border-ready/20',
    dotColor: 'bg-ready animate-pulse',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'bg-muted text-muted-foreground border-border',
    dotColor: 'bg-muted-foreground',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    dotColor: 'bg-destructive',
  },
};

const Orders = () => {
  const navigate = useNavigate();
  const [orders] = useState<Order[]>(mockOrders);

  const activeOrders = orders.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status));
  const pastOrders = orders.filter((o) => ['completed', 'cancelled'].includes(o.status));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass shadow-food">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display font-bold text-xl">My Orders</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <section className="mb-8">
            <h2 className="font-display font-semibold text-lg mb-4">Active Orders</h2>
            <div className="space-y-4">
              {activeOrders.map((order) => {
                const config = statusConfig[order.status];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={order.id}
                    className={cn(
                      "bg-card rounded-2xl border p-6",
                      order.status === 'ready' && "ring-2 ring-ready animate-pulse-ready"
                    )}
                  >
                    {/* Token & Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-muted-foreground text-sm">Token</p>
                        <p className="font-display font-bold text-3xl text-primary">
                          #{order.token}
                        </p>
                      </div>
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium",
                        config.color
                      )}>
                        <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
                        {config.label}
                      </div>
                    </div>

                    {/* Items */}
                    <p className="text-muted-foreground text-sm mb-4">
                      {order.items.join(', ')}
                    </p>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>Pickup: {order.pickupTime}</span>
                      </div>
                      {order.estimatedReady && (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-preparing" />
                          <span>Ready by: {order.estimatedReady}</span>
                        </div>
                      )}
                    </div>

                    {/* Ready Message */}
                    {order.status === 'ready' && (
                      <div className="mt-4 p-3 bg-ready/10 rounded-xl flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-ready" />
                        <div>
                          <p className="font-semibold text-sm text-ready">
                            Your order is ready!
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Please collect from Main Canteen Counter
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Past Orders */}
        {pastOrders.length > 0 && (
          <section>
            <h2 className="font-display font-semibold text-lg mb-4">Past Orders</h2>
            <div className="space-y-3">
              {pastOrders.map((order) => {
                const config = statusConfig[order.status];

                return (
                  <div
                    key={order.id}
                    className="bg-card rounded-xl border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Token #{order.token}</p>
                        <p className="text-muted-foreground text-sm">
                          {order.items.slice(0, 2).join(', ')}
                          {order.items.length > 2 && ` +${order.items.length - 2} more`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{order.total}</p>
                        <p className="text-muted-foreground text-xs">{order.createdAt}</p>
                      </div>
                    </div>

                    {/* Reorder Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => navigate('/')}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reorder
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {orders.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">
              Place your first order to see it here
            </p>
            <Button onClick={() => navigate('/')}>Browse Menu</Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;
