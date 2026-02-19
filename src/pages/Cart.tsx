import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/food/Header';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Minus,
    Plus,
    Trash2,
    ShoppingBag,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Cart = () => {
    const navigate = useNavigate();
    const { items, updateQuantity, removeItem, totalAmount, totalItems, clearCart, loading } = useCart();
    const { isAuthenticated } = useAuth();

    const platformFee = 5;
    const total = totalAmount + platformFee;

    const handleCheckout = () => {
        if (!isAuthenticated) {
            navigate('/signin', { state: { from: { pathname: '/checkout' } } });
            return;
        }
        navigate('/checkout');
    };

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header onCartClick={() => { }} />
                <div className="container mx-auto px-4 py-16 text-center max-w-md">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading your cart...</p>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <Header onCartClick={() => { }} />
                <div className="container mx-auto px-4 py-16 text-center max-w-md">
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h2 className="font-display font-bold text-2xl mb-2">Your cart is empty</h2>
                    <p className="text-muted-foreground mb-6">
                        Add some delicious items to get started
                    </p>
                    <Button onClick={() => navigate('/')}>Browse Menu</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header onCartClick={() => { }} />

            <main className="container mx-auto px-4 py-6 max-w-2xl">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    className="mb-6"
                    onClick={() => navigate('/')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Continue Shopping
                </Button>

                <div className="flex items-center justify-between mb-6">
                    <h1 className="font-display font-bold text-2xl">
                        Your Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                    </h1>
                    {items.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearCart}
                            className="text-destructive hover:text-destructive"
                        >
                            Clear All
                        </Button>
                    )}
                </div>

                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="bg-card rounded-2xl border p-4 flex gap-4"
                        >
                            {/* Item Image */}
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">
                                        🍽️
                                    </div>
                                )}
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">{item.name}</h3>
                                        {item.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Quantity Controls & Price */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        >
                                            <Minus className="w-3 h-3" />
                                        </Button>
                                        <span className="font-medium w-8 text-center">{item.quantity}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-display font-bold text-lg">₹{item.price * item.quantity}</p>
                                        {item.quantity > 1 && (
                                            <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bill Summary */}
                <div className="bg-card rounded-2xl border p-6 mb-6">
                    <h3 className="font-semibold mb-4">Bill Summary</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                            <span>₹{totalAmount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Platform Fee</span>
                            <span>₹{platformFee}</span>
                        </div>
                        <div className="border-t pt-3 flex justify-between font-semibold">
                            <span>Total Amount</span>
                            <span className="text-primary text-lg">₹{total}</span>
                        </div>
                    </div>
                </div>

                {/* Authentication Notice */}
                {!isAuthenticated && (
                    <div className="bg-golden-amber/10 border border-golden-amber/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-golden-amber shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-sm mb-1">Sign in to checkout</h4>
                            <p className="text-muted-foreground text-sm">
                                You'll need to sign in or create an account to place your order
                            </p>
                        </div>
                    </div>
                )}

                {/* Checkout Button */}
                <Button
                    className="w-full h-14 text-lg font-semibold"
                    onClick={handleCheckout}
                >
                    {isAuthenticated ? 'Proceed to Checkout' : 'Sign In to Checkout'}
                </Button>

                <p className="text-center text-xs text-muted-foreground mt-4">
                    Review your order before proceeding to payment
                </p>
            </main>
        </div>
    );
};

export default Cart;
