import { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Clock } from 'lucide-react';
import { useSearchMenu, MenuItem } from '@/hooks/useMenu';
import { cn } from '@/lib/utils';

interface SmartSearchBarProps {
    vendorId?: string;
    onSelectItem?: (item: MenuItem) => void;
    placeholder?: string;
}

export const SmartSearchBar = ({ vendorId, onSelectItem, placeholder = 'Search for dishes...' }: SmartSearchBarProps) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const { results, loading, search } = useSearchMenu();
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load search history from localStorage
    useEffect(() => {
        const history = localStorage.getItem('search_history');
        if (history) {
            setSearchHistory(JSON.parse(history));
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const debounce = setTimeout(() => {
            if (query.length >= 2) {
                search(query, vendorId);
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(debounce);
    }, [query, vendorId]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((prev) => Math.max(prev - 1, -1));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex >= 0 && results[selectedIndex]) {
                        handleSelectItem(results[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    setIsOpen(false);
                    inputRef.current?.blur();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, results]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                !inputRef.current?.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectItem = (item: MenuItem) => {
        // Add to search history
        const newHistory = [item.name, ...searchHistory.filter((h) => h !== item.name)].slice(0, 5);
        setSearchHistory(newHistory);
        localStorage.setItem('search_history', JSON.stringify(newHistory));

        setQuery('');
        setIsOpen(false);
        onSelectItem?.(item);
    };

    const handleHistoryClick = (historyItem: string) => {
        setQuery(historyItem);
        inputRef.current?.focus();
    };

    const clearSearch = () => {
        setQuery('');
        setIsOpen(false);
        inputRef.current?.focus();
    };

    const popularSearches = ['Biryani', 'Dosa', 'Chai', 'Paneer', 'Thali'];

    return (
        <div className="relative w-full">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg max-h-96 overflow-y-auto z-50"
                >
                    {loading ? (
                        <div className="p-4 text-center text-muted-foreground">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                            Searching...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="py-2">
                            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                                Results
                            </p>
                            {results.map((item, index) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelectItem(item)}
                                    className={cn(
                                        'w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left',
                                        selectedIndex === index && 'bg-muted/50'
                                    )}
                                >
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                            🍽️
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{item.name}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>₹{item.discount_price || item.price}</span>
                                            {!item.is_available && (
                                                <span className="text-destructive text-xs">Out of stock</span>
                                            )}
                                        </div>
                                    </div>
                                    {item.is_best_seller && (
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                            Best Seller
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <p className="mb-2">No results found for "{query}"</p>
                            <p className="text-sm">Try searching for something else</p>
                        </div>
                    ) : null}

                    {/* Search History */}
                    {query.length < 2 && searchHistory.length > 0 && (
                        <div className="py-2 border-t">
                            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Recent Searches
                            </p>
                            {searchHistory.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleHistoryClick(item)}
                                    className="w-full px-4 py-2 text-left hover:bg-muted/50 transition-colors text-sm"
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Popular Searches */}
                    {query.length < 2 && (
                        <div className="py-2 border-t">
                            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                                <TrendingUp className="w-3 h-3" />
                                Popular Searches
                            </p>
                            <div className="px-4 py-2 flex flex-wrap gap-2">
                                {popularSearches.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleHistoryClick(item)}
                                        className="px-3 py-1 bg-muted hover:bg-muted/70 rounded-full text-sm transition-colors"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
