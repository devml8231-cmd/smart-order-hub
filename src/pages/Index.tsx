import { useState, useMemo, useRef } from 'react';
import { Header } from '@/components/food/Header';
import { HeroSection } from '@/components/food/HeroSection';
import { CategoryPills } from '@/components/food/CategoryPills';
import { MenuCard } from '@/components/food/MenuCard';
import { BestSellers } from '@/components/food/BestSellers';
import { TodaySpecials } from '@/components/food/TodaySpecials';
import { CartDrawer } from '@/components/food/CartDrawer';
import { CartProvider } from '@/context/CartContext';
import { categories, menuItems } from '@/data/mockData';
import { Clock, Lightbulb } from 'lucide-react';

const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    let items = menuItems;

    // Filter by category
    if (selectedCategory !== 'all') {
      items = items.filter((item) => item.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return items;
  }, [selectedCategory, searchQuery]);

  const scrollToMenu = () => {
    menuRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onCartClick={() => setCartOpen(true)}
        onSearchChange={setSearchQuery}
      />

      {/* Hero */}
      <HeroSection onExploreClick={scrollToMenu} />

      <main className="container mx-auto px-4 py-6">
        {/* Best Sellers */}
        <BestSellers items={menuItems} />

        {/* Today's Specials */}
        <TodaySpecials items={menuItems} />

        {/* Idle Time Suggestion */}
        <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 mb-8 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Skip the Rush!</h4>
            <p className="text-muted-foreground text-sm">
              Order for pickup at <span className="font-medium text-secondary">3:00 PM - 4:00 PM</span> for 
              minimal wait time. Currently less crowded! 🎯
            </p>
          </div>
        </div>

        {/* Menu Section */}
        <section ref={menuRef} id="menu" className="scroll-mt-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-2xl">Full Menu</h2>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="w-4 h-4" />
              <span>Open until 8:00 PM</span>
            </div>
          </div>

          {/* Categories */}
          <CategoryPills
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />

          {/* Menu Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
            {filteredItems.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">No items found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter to find what you're looking for
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Footer */}
      <footer className="bg-muted mt-12 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-golden-amber flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
            <span className="font-display font-bold text-xl">QuickBite</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Pre-order your meals and skip the queue. Fast, fresh, and hassle-free!
          </p>
          <p className="text-muted-foreground text-xs mt-4">
            © 2024 QuickBite. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const Index = () => {
  return (
    <CartProvider>
      <HomePage />
    </CartProvider>
  );
};

export default Index;
