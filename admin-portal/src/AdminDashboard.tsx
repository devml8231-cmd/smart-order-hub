import { useState, useEffect, useCallback } from 'react';
import {
    ShoppingBag, RefreshCw, Loader2, ChevronDown,
    BarChart3, Clock, CheckCircle2,
    XCircle, ChefHat, Timer, Bell, UtensilsCrossed,
} from 'lucide-react';
import { cn, formatDate } from './lib/utils';
import { orderService, Order } from './lib/supabase';
import { useAllOrders } from './hooks/useAllOrders';
import MenuManagement from './MenuManagement';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['PLACED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] as const;

const statusConfig: Record<Order['status'], { label: string; icon: React.ElementType; card: string; badge: string }> = {
    PLACED: { label: 'Placed', icon: Clock, card: 'border-yellow-200 bg-yellow-50/30', badge: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    PREPARING: { label: 'Preparing', icon: ChefHat, card: 'border-orange-200 bg-orange-50/30', badge: 'bg-orange-100 text-orange-800 border-orange-200' },
    READY: { label: 'Ready', icon: CheckCircle2, card: 'border-green-300 bg-green-50/30 ring-2 ring-green-400', badge: 'bg-green-100 text-green-800 border-green-200' },
    COMPLETED: { label: 'Completed', icon: CheckCircle2, card: 'border-border bg-white', badge: 'bg-gray-100 text-gray-600 border-gray-200' },
    CANCELLED: { label: 'Cancelled', icon: XCircle, card: 'border-red-200 bg-white', badge: 'bg-red-100 text-red-700 border-red-200' },
};

// ─── Countdown Timer ──────────────────────────────────────────────────────────
const CountdownTimer = ({ targetTime }: { targetTime: string }) => {
    const getRemaining = useCallback(
        () => Math.max(0, Math.floor((new Date(targetTime).getTime() - Date.now()) / 1000)),
        [targetTime]
    );
    const [secs, setSecs] = useState(getRemaining);

    useEffect(() => {
        const t = setInterval(() => setSecs(getRemaining()), 1000);
        return () => clearInterval(t);
    }, [getRemaining]);

    if (secs <= 0) return <span className="text-green-600 font-semibold text-sm">Should be ready now!</span>;

    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return (
        <span className="font-mono font-bold text-orange-600 text-sm">
            {mins > 0 ? `${mins}m ` : ''}{rem.toString().padStart(2, '0')}s
        </span>
    );
};

// ─── Order Card ───────────────────────────────────────────────────────────────
const OrderCard = ({
    order, onStatusChange, updating,
}: {
    order: Order;
    onStatusChange: (id: string, status: string, mins?: number) => void;
    updating: boolean;
}) => {
    const [estMins, setEstMins] = useState(15);
    const cfg = statusConfig[order.status];
    const StatusIcon = cfg.icon;
    const isTerminal = ['COMPLETED', 'CANCELLED'].includes(order.status);

    return (
        <div className={cn('rounded-2xl border p-5 transition-all bg-white shadow-sm', cfg.card)}>
            <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Left */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-bold text-2xl text-black leading-tight">
                            {order.order_items.map(i => i.menu_item_data?.name).filter(Boolean).join(', ')}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-sm font-semibold text-red-600">Token #{order.token_number}</span>
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold', cfg.badge)}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                        </span>
                        {order.status === 'READY' && (
                            <span className="flex items-center gap-1 text-xs text-green-700 font-semibold animate-bounce">
                                <Bell className="w-3 h-3" /> Notify customer!
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-gray-400 mb-2">
                        {order.phone && <span className="mr-3">📱 {order.phone}</span>}
                        🕐 {formatDate(order.created_at)}
                    </p>

                    {/* Countdown */}
                    {order.estimated_ready_at && order.status === 'PREPARING' && (
                        <div className="flex items-center gap-2 mb-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 w-fit">
                            <Timer className="w-4 h-4 text-orange-500" />
                            <span className="text-xs text-gray-500">Ready in:</span>
                            <CountdownTimer targetTime={order.estimated_ready_at} />
                        </div>
                    )}

                    {/* Items */}
                    <div className="space-y-0.5 mt-2">
                        {order.order_items.map((item) => (
                            <p key={item.id} className="text-sm text-gray-700">
                                <span className="font-semibold">{item.quantity}×</span> {item.menu_item_data?.name}
                                <span className="text-gray-400 ml-2 text-xs">₹{item.subtotal}</span>
                            </p>
                        ))}
                    </div>
                </div>

                {/* Right */}
                <div className="flex flex-col items-end gap-2.5 shrink-0">
                    <p className="text-2xl font-bold text-gray-800">₹{order.total_amount}</p>

                    {order.status === 'PLACED' && (
                        <div className="flex items-center gap-1.5 text-sm border rounded-lg px-2 py-1 bg-gray-50">
                            <span className="text-gray-500 whitespace-nowrap text-xs">Ready in</span>
                            <input
                                type="number" min={1} max={120} value={estMins}
                                onChange={(e) => setEstMins(parseInt(e.target.value) || 15)}
                                className="w-12 text-center border-0 bg-transparent font-semibold text-sm outline-none"
                            />
                            <span className="text-gray-500 text-xs">min</span>
                        </div>
                    )}

                    {!isTerminal && (
                        <div className="relative">
                            <select
                                value={order.status}
                                disabled={updating}
                                onChange={(e) => onStatusChange(order.id, e.target.value, order.status === 'PLACED' ? estMins : undefined)}
                                className={cn(
                                    'appearance-none pl-3 pr-8 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition-all',
                                    cfg.badge, 'disabled:opacity-60 disabled:cursor-not-allowed'
                                )}
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                                ))}
                            </select>
                            {updating
                                ? <Loader2 className="absolute right-2 top-2.5 w-4 h-4 animate-spin pointer-events-none" />
                                : <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 pointer-events-none" />
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Stats Bar ────────────────────────────────────────────────────────────────
const StatsBar = ({ orders }: { orders: Order[] }) => (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {STATUS_OPTIONS.map((s) => {
            const count = orders.filter((o) => o.status === s).length;
            const cfg = statusConfig[s];
            return (
                <div key={s} className={cn('rounded-2xl border p-4 text-center bg-white shadow-sm', cfg.badge)}>
                    <p className="text-3xl font-bold">{count}</p>
                    <p className="text-xs mt-1 font-medium">{cfg.label}</p>
                </div>
            );
        })}
    </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const { orders, loading, error, refetch } = useAllOrders();
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [activeTab, setActiveTab] = useState<'orders' | 'stats' | 'menu'>('orders');

    const filtered = filterStatus === 'ALL' ? orders : orders.filter((o) => o.status === filterStatus);
    const activeCount = orders.filter((o) => ['PLACED', 'PREPARING', 'READY'].includes(o.status)).length;
    const completedRevenue = orders.filter((o) => o.status === 'COMPLETED').reduce((s, o) => s + o.total_amount, 0);

    const handleStatusChange = async (orderId: string, newStatus: string, estMins?: number) => {
        let estimatedReadyAt: string | undefined;
        if (newStatus === 'PREPARING' && estMins) {
            estimatedReadyAt = new Date(Date.now() + estMins * 60 * 1000).toISOString();
        }
        setUpdatingId(orderId);
        try {
            await orderService.updateOrderStatus(orderId, newStatus, estimatedReadyAt);
            refetch();
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white text-xl">🍽️</div>
                        <div>
                            <h1 className="font-bold text-lg leading-none text-gray-900">Smart Order Hub</h1>
                            <p className="text-xs text-gray-400">Admin • Kitchen Display</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {activeCount > 0 && (
                            <span className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                {activeCount} active
                            </span>
                        )}
                        <button
                            onClick={refetch}
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1">
                    {([
                        { id: 'orders' as const, label: 'Orders', icon: ShoppingBag },
                        { id: 'menu' as const, label: 'Menu', icon: UtensilsCrossed },
                        { id: 'stats' as const, label: 'Analytics', icon: BarChart3 },
                    ]).map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all',
                                activeTab === id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-700'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {/* ── Orders Tab ── */}
                {activeTab === 'orders' && (
                    <>
                        <StatsBar orders={orders} />

                        {/* Filter chips */}
                        <div className="flex flex-wrap gap-2 mb-5">
                            {['ALL', ...STATUS_OPTIONS].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={cn(
                                        'px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all',
                                        filterStatus === s
                                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                                    )}
                                >
                                    {s === 'ALL' ? 'All Orders' : s.charAt(0) + s.slice(1).toLowerCase()}
                                    <span className="ml-1.5 opacity-60 text-xs">
                                        ({s === 'ALL' ? orders.length : orders.filter((o) => o.status === s).length})
                                    </span>
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                <Loader2 className="w-10 h-10 animate-spin mb-3 text-orange-400" />
                                <p>Loading orders...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-20 text-red-500">
                                <p className="font-semibold mb-1">Failed to load orders</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                <p className="font-medium">No orders here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filtered.map((order) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onStatusChange={handleStatusChange}
                                        updating={updatingId === order.id}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ── Menu Tab ── */}
                {activeTab === 'menu' && (
                    <MenuManagement />
                )}

                {/* ── Stats Tab ── */}
                {activeTab === 'stats' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'Total Orders', value: orders.length, color: 'text-orange-500' },
                                { label: 'Revenue (Completed)', value: `₹${completedRevenue.toFixed(0)}`, color: 'text-green-500' },
                                { label: 'Active Right Now', value: activeCount, color: 'text-blue-500' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="bg-white rounded-2xl border p-6 text-center shadow-sm">
                                    <p className={cn('text-4xl font-bold', color)}>{value}</p>
                                    <p className="text-gray-500 mt-1.5 text-sm font-medium">{label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl border p-6 shadow-sm">
                            <h3 className="font-semibold text-gray-700 mb-5">Status Breakdown</h3>
                            <div className="space-y-4">
                                {STATUS_OPTIONS.map((s) => {
                                    const count = orders.filter((o) => o.status === s).length;
                                    const pct = orders.length ? (count / orders.length) * 100 : 0;
                                    const cfg = statusConfig[s];
                                    return (
                                        <div key={s} className="flex items-center gap-4">
                                            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 w-24 text-center', cfg.badge)}>
                                                {cfg.label}
                                            </span>
                                            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="h-full bg-orange-400 rounded-full transition-all duration-700"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-gray-600 w-6 text-right shrink-0">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
