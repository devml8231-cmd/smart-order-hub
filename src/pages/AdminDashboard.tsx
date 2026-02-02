import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
} from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        // Get user from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    const handleLogout = async () => {
        try {
            await api.logout();
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            toast({
                title: 'Logged out',
                description: 'You have been successfully logged out',
            });

            navigate('/login');
        } catch (err) {
            toast({
                title: 'Logout failed',
                description: 'Please try again',
                variant: 'destructive',
            });
        }
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed lg:static inset-y-0 left-0 z-50 bg-card border-r transition-all',
                    sidebarOpen ? 'w-64' : 'w-0 lg:w-20'
                )}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-4 border-b flex items-center justify-between">
                        {sidebarOpen && (
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🍽️</span>
                                <span className="font-display font-bold">Admin</span>
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden"
                        >
                            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                                        activeTab === item.id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-muted'
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    {sidebarOpen && <span>{item.label}</span>}
                                </button>
                            );
                        })}
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t">
                        {sidebarOpen ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="font-semibold text-primary">
                                            {user?.full_name?.[0] || user?.phone_number?.[0] || 'A'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {user?.full_name || 'Admin User'}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {user?.role || 'ADMIN'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="w-full p-2 hover:bg-muted rounded-xl"
                            >
                                <LogOut className="w-5 h-5 mx-auto" />
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-card border-b">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="font-display font-bold text-2xl">
                                    {menuItems.find((item) => item.id === activeTab)?.label}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Welcome back, {user?.full_name || 'Admin'}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-6">
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Stats Cards */}
                            <div className="bg-card rounded-2xl border p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                        Total Orders
                                    </h3>
                                    <ShoppingBag className="w-5 h-5 text-primary" />
                                </div>
                                <p className="text-3xl font-bold">1,234</p>
                                <p className="text-sm text-green-600 mt-2">+12% from last month</p>
                            </div>

                            <div className="bg-card rounded-2xl border p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                        Active Users
                                    </h3>
                                    <Users className="w-5 h-5 text-primary" />
                                </div>
                                <p className="text-3xl font-bold">856</p>
                                <p className="text-sm text-green-600 mt-2">+8% from last month</p>
                            </div>

                            <div className="bg-card rounded-2xl border p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                        Revenue
                                    </h3>
                                    <BarChart3 className="w-5 h-5 text-primary" />
                                </div>
                                <p className="text-3xl font-bold">₹45,678</p>
                                <p className="text-sm text-green-600 mt-2">+15% from last month</p>
                            </div>

                            <div className="bg-card rounded-2xl border p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                        Avg. Rating
                                    </h3>
                                    <span className="text-xl">⭐</span>
                                </div>
                                <p className="text-3xl font-bold">4.8</p>
                                <p className="text-sm text-green-600 mt-2">+0.2 from last month</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="bg-card rounded-2xl border p-6">
                            <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
                            <p className="text-muted-foreground">
                                Order management interface coming soon...
                            </p>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="bg-card rounded-2xl border p-6">
                            <h2 className="text-xl font-semibold mb-4">User Management</h2>
                            <p className="text-muted-foreground">
                                User management interface coming soon...
                            </p>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="bg-card rounded-2xl border p-6">
                            <h2 className="text-xl font-semibold mb-4">Analytics</h2>
                            <p className="text-muted-foreground">
                                Analytics dashboard coming soon...
                            </p>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="bg-card rounded-2xl border p-6">
                            <h2 className="text-xl font-semibold mb-4">Settings</h2>
                            <p className="text-muted-foreground">
                                Settings interface coming soon...
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
