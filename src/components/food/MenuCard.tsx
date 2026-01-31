import { MenuItem } from '@/types/food';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Star, Leaf, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

interface MenuCardProps {
  item: MenuItem;
}

export const MenuCard = ({ item }: MenuCardProps) => {
  const { addItem } = useCart();

  return (
    <div
      className={cn(
        "group bg-card rounded-2xl overflow-hidden food-card-hover border border-border",
        !item.available && "opacity-60"
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {item.isBestSeller && (
            <Badge className="bg-golden-amber text-espresso font-semibold text-xs">
              <Flame className="w-3 h-3 mr-1" />
              Bestseller
            </Badge>
          )}
          {item.isTodaySpecial && (
            <Badge className="bg-secondary text-secondary-foreground font-semibold text-xs">
              ✨ Today's Special
            </Badge>
          )}
        </div>

        {/* Veg/Non-veg indicator */}
        <div className="absolute top-2 right-2">
          <div className={cn(
            "w-5 h-5 border-2 rounded flex items-center justify-center",
            item.isVeg ? "border-fresh-green" : "border-destructive"
          )}>
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              item.isVeg ? "bg-fresh-green" : "bg-destructive"
            )} />
          </div>
        </div>

        {/* Out of stock overlay */}
        {!item.available && (
          <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-semibold text-lg text-card-foreground line-clamp-1">
            {item.name}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-4 h-4 fill-golden-amber text-golden-amber" />
            <span className="text-sm font-medium text-card-foreground">{item.rating}</span>
          </div>
        </div>

        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
          {item.description}
        </p>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price and Add Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xl text-card-foreground">
              ₹{item.price}
            </span>
            <span className="flex items-center text-xs text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />
              {item.prepTime} min
            </span>
          </div>
          
          <Button
            size="sm"
            onClick={() => addItem(item)}
            disabled={!item.available}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};
