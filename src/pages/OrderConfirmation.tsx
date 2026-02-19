import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Copy, ShoppingBag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, total, items } = location.state || {};

  if (!token) {
    navigate('/');
    return null;
  }

  const copyToken = () => {
    navigator.clipboard.writeText(token.toString());
    toast({ title: 'Token Copied', description: 'Order token copied to clipboard' });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Success */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="font-display font-bold text-2xl mb-2">Order Confirmed! 🎉</h1>
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
            <Button variant="ghost" size="icon" onClick={copyToken} className="text-muted-foreground">
              <Copy className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Show this token at the counter to collect your order
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-card rounded-2xl border p-6 mb-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Total</p>
              <p className="font-semibold text-lg">₹{total} · {items} item{items !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Status chip */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse shrink-0" />
            <div>
              <p className="font-semibold text-sm text-yellow-800">Status: Placed</p>
              <p className="text-xs text-yellow-700">We'll notify you when your order is being prepared</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-slide-up">
          <Button className="w-full h-12" onClick={() => navigate('/orders')}>
            Track Order Status
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" className="w-full h-12" onClick={() => navigate('/')}>
            Order More
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
