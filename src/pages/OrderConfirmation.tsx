import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, MapPin, ArrowRight, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, pickupTime, total, items } = location.state || {};

  if (!token) {
    navigate('/');
    return null;
  }

  const copyToken = () => {
    navigator.clipboard.writeText(token.toString());
    toast({
      title: "Token Copied",
      description: "Order token copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Success Animation */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-secondary" />
          </div>
          <h1 className="font-display font-bold text-2xl mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Your order has been placed successfully
          </p>
        </div>

        {/* Token Card */}
        <div className="bg-card rounded-2xl border p-6 mb-6 text-center animate-slide-up">
          <p className="text-muted-foreground text-sm mb-2">Your Order Token</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-display font-bold text-5xl text-primary">
              #{token}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyToken}
              className="text-muted-foreground"
            >
              <Copy className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Show this token at the counter to collect your order
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-card rounded-2xl border p-6 mb-6 space-y-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pickup Time</p>
              <p className="font-semibold">{pickupTime}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pickup Location</p>
              <p className="font-semibold">Main Canteen, Ground Floor</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{items} items</span>
              <span className="font-display font-bold text-lg">₹{total}</span>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="bg-golden-amber/10 border border-golden-amber/20 rounded-2xl p-4 mb-6 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-golden-amber animate-pulse" />
            <div>
              <p className="font-semibold text-sm">Status: Pending</p>
              <p className="text-muted-foreground text-xs">
                We'll notify you when your order is being prepared
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-slide-up">
          <Button
            className="w-full h-12"
            onClick={() => navigate('/orders')}
          >
            Track Order Status
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => navigate('/')}
          >
            Order More
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
