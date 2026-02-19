import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/food/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, CreditCard, Smartphone, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { orderService } from '@/services/supabase';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const total = totalAmount;


  const handlePlaceOrder = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: 'Enter Phone Number',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({ title: 'Not signed in', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create order row
      const order = await orderService.createOrder(user.id, total, phone);

      // 2. Create order items
      await orderService.createOrderItems(
        order.id,
        items.map((item) => ({
          menu_item_id: item.id,
          menu_item_data: item,
          quantity: item.quantity,
          unit_price: item.price,
        }))
      );

      // 3. Clear cart
      await clearCart();

      // 4. Navigate to confirmation
      navigate('/order-confirmation', {
        state: {
          token: order.token_number,
          orderId: order.id,
          total,
          items: items.length,
        },
      });
    } catch (error: any) {
      console.error('Order placement failed:', error);
      toast({
        title: 'Order Failed',
        description: error.message || 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header onCartClick={() => { }} />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display font-bold text-2xl mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some items to proceed with checkout</p>
          <Button onClick={() => navigate('/')}>Browse Menu</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => { }} />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/cart')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </Button>

        <h1 className="font-display font-bold text-2xl mb-6">Checkout</h1>

        {/* Order Summary */}
        <div className="bg-card rounded-2xl border p-6 mb-6">
          <h3 className="font-semibold mb-4">Order Summary</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.quantity}x {item.name}
                </span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary text-lg">₹{total}</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-card rounded-2xl border p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Contact Details</h3>
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your 10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground mt-2">
              We'll send order updates to this number
            </p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-card rounded-2xl border p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Payment Method</h3>
          </div>
          <RadioGroup defaultValue="online" className="space-y-3">
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-muted">
              <RadioGroupItem value="online" id="online" />
              <Label htmlFor="online" className="flex-1 cursor-pointer">
                <span className="font-medium">Pay Online</span>
                <span className="text-muted-foreground text-sm block">
                  UPI, Cards, Net Banking
                </span>
              </Label>
              <span className="text-2xl">💳</span>
            </div>
          </RadioGroup>
        </div>

        {/* Place Order Button */}
        <Button
          className="w-full h-14 text-lg font-semibold"
          onClick={handlePlaceOrder}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Placing Order...
            </>
          ) : (
            <>Pay ₹{total} &amp; Place Order</>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By placing this order, you agree to our terms and conditions
        </p>
      </main>
    </div>
  );
};

const Checkout = () => <CheckoutPage />;
export default Checkout;
