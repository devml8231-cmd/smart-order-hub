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
  XCircle,
  Loader2,
  AlertCircle,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrders, canCancelOrder, getCancellationTimeRemaining, useCancelOrder } from '@/hooks/useOrders';
import { ReorderModal } from '@/components/ReorderModal';
import { ReviewModal } from '@/components/ReviewModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusConfig = {
  PLACED: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-golden-amber/10 text-golden-amber border-golden-amber/20',
    dotColor: 'bg-golden-amber',
  },
  PREPARING: {
    label: 'Preparing',
    icon: ChefHat,
    color: 'bg-preparing/10 text-preparing border-preparing/20',
    dotColor: 'bg-preparing',
  },
  READY: {
    label: 'Ready for Pickup',
    icon: CheckCircle2,
    color: 'bg-ready/10 text-ready border-ready/20',
    dotColor: 'bg-ready animate-pulse',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'bg-muted text-muted-foreground border-border',
    dotColor: 'bg-muted-foreground',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    dotColor: 'bg-destructive',
  },
};

const Orders = () => {
  const navigate = useNavigate();
  const { orders, loading, error, refetch } = useOrders();
  const { cancelOrder, loading: cancelling } = useCancelOrder();
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reorderOrder, setReorderOrder] = useState<any>(null);
  const [reviewOrder, setReviewOrder] = useState<any>(null);

  const activeOrders = orders.filter((o) => ['PLACED', 'PREPARING', 'READY'].includes(o.status));
  const pastOrders = orders.filter((o) => ['COMPLETED', 'CANCELLED'].includes(o.status));

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;

    const success = await cancelOrder(cancelOrderId, cancelReason || 'User cancelled');
    if (success) {
      setCancelOrderId(null);
      setCancelReason('');
      refetch();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">Failed to Load Orders</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

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
            <Button
              variant="ghost"
              size="icon"
              onClick={refetch}
              className="ml-auto"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
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
                const canCancel = canCancelOrder(order);
                const timeRemaining = getCancellationTimeRemaining(order.created_at);

                return (
                  <div
                    key={order.id}
                    className={cn(
                      "bg-card rounded-2xl border p-6",
                      order.status === 'READY' && "ring-2 ring-ready animate-pulse-ready"
                    )}
                  >
                    {/* Token & Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-muted-foreground text-sm">Token</p>
                        <p className="font-display font-bold text-3xl text-primary">
                          #{order.token_number}
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
                      {order.order_items.map(item => `${item.menu_item.name} (${item.quantity})`).join(', ')}
                    </p>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>Pickup: {formatTime(order.pickup_time)}</span>
                      </div>
                      {order.estimated_ready_time && (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-preparing" />
                          <span>Ready by: {formatTime(order.estimated_ready_time)}</span>
                        </div>
                      )}
                    </div>

                    {/* Queue Position */}
                    {order.token && order.token.queue_position > 0 && (
                      <div className="mb-4 p-3 bg-muted/50 rounded-xl">
                        <p className="text-sm">
                          <span className="font-semibold">Queue Position:</span> #{order.token.queue_position}
                          {order.token.estimated_time_minutes > 0 && (
                            <span className="text-muted-foreground ml-2">
                              (~{order.token.estimated_time_minutes} min)
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Ready Message */}
                    {order.status === 'READY' && (
                      <div className="mb-4 p-3 bg-ready/10 rounded-xl flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-ready" />
                        <div>
                          <p className="font-semibold text-sm text-ready">
                            Your order is ready!
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Please collect from {order.vendor.name}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Cancel Button */}
                    {canCancel && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Cancel within: {Math.ceil(timeRemaining)} min
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelOrderId(order.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            Cancel Order
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-display font-bold text-lg">₹{order.final_amount}</span>
                      </div>
                    </div>
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
                        <p className="font-semibold">Token #{order.token_number}</p>
                        <p className="text-muted-foreground text-sm">
                          {order.order_items.slice(0, 2).map(item => item.menu_item.name).join(', ')}
                          {order.order_items.length > 2 && ` + ${order.order_items.length - 2} more`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{order.final_amount}</p>
                        <p className="text-muted-foreground text-xs">{formatTime(order.created_at)}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReorderOrder(order)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reorder
                      </Button>
                      {order.status === 'COMPLETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewOrder(order)}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      )}
                    </div>
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

      {/* Reorder Modal */}
      {reorderOrder && (
        <ReorderModal
          order={reorderOrder}
          onClose={() => setReorderOrder(null)}
        />
      )}

      {/* Review Modal */}
      {reviewOrder && (
        <ReviewModal
          orderId={reviewOrder.id}
          menuItemId={reviewOrder.order_items[0]?.menu_item.id}
          menuItemName={reviewOrder.order_items[0]?.menu_item.name}
          onClose={() => setReviewOrder(null)}
          onSuccess={refetch}
        />
      )}

      {/* Cancel Order Dialog */}
      <AlertDialog open={!!cancelOrderId} onOpenChange={() => setCancelOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <label className="text-sm font-medium mb-2 block">Reason (optional)</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            >
              <option value="">Select a reason</option>
              <option value="Changed mind">Changed my mind</option>
              <option value="Ordered by mistake">Ordered by mistake</option>
              <option value="Taking too long">Taking too long</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Order'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Orders;

