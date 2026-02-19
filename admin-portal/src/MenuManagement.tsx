import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Loader2, ImagePlus, ToggleLeft, ToggleRight, X, Search } from 'lucide-react';
import { menuService, MenuItem } from './lib/supabase';
import { cn } from './lib/utils';

// ─── Form State ───────────────────────────────────────────────────────────────
const EMPTY_FORM = {
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    is_veg: true,
    is_best_seller: false,
    is_today_special: false,
    is_available: true,
    prep_time_minutes: '15',
};

const CATEGORIES = ['Starter', 'Main Course', 'Breads', 'Rice', 'Dessert', 'Beverage', 'Snacks', 'Other'];

// ─── Item Card ────────────────────────────────────────────────────────────────
const ItemCard = ({
    item,
    onEdit,
    onDelete,
    onToggle,
    toggling,
}: {
    item: MenuItem;
    onEdit: (item: MenuItem) => void;
    onDelete: (id: string) => void;
    onToggle: (id: string, val: boolean) => void;
    toggling: boolean;
}) => (
    <div className={cn(
        'bg-white rounded-2xl border shadow-sm overflow-hidden transition-all',
        !item.is_available && 'opacity-60'
    )}>
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
            {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
            )}
            {/* Veg/Non-veg dot */}
            <div className={cn(
                'absolute top-2 right-2 w-5 h-5 border-2 rounded flex items-center justify-center bg-white',
                item.is_veg ? 'border-green-500' : 'border-red-500'
            )}>
                <div className={cn('w-2.5 h-2.5 rounded-full', item.is_veg ? 'bg-green-500' : 'bg-red-500')} />
            </div>
            {item.is_best_seller && (
                <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">🔥 Bestseller</span>
            )}
            {item.is_today_special && (
                <span className={cn(
                    'absolute text-white text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500',
                    item.is_best_seller ? 'top-8 left-2 mt-1' : 'top-2 left-2'
                )}>✨ Special</span>
            )}
        </div>

        {/* Content */}
        <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-1">{item.name}</h3>
                <span className="text-orange-600 font-bold text-base shrink-0">₹{item.price}</span>
            </div>
            {item.description && (
                <p className="text-gray-500 text-xs line-clamp-2 mb-2">{item.description}</p>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                <span className="bg-gray-100 px-2 py-0.5 rounded-full">{item.category}</span>
                <span className="bg-gray-100 px-2 py-0.5 rounded-full">⏱ {item.prep_time_minutes} min</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t">
                {/* Availability toggle */}
                <button
                    onClick={() => onToggle(item.id, !item.is_available)}
                    disabled={toggling}
                    className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                >
                    {item.is_available
                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                        : <ToggleLeft className="w-5 h-5 text-gray-400" />
                    }
                    <span className={item.is_available ? 'text-green-600' : 'text-gray-400'}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                    </span>
                </button>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
const ItemModal = ({
    item,
    onClose,
    onSave,
    saving,
}: {
    item?: MenuItem;
    onClose: () => void;
    onSave: (formData: typeof EMPTY_FORM, imageFile?: File) => Promise<void>;
    saving: boolean;
}) => {
    const [form, setForm] = useState(item
        ? {
            name: item.name,
            description: item.description || '',
            price: String(item.price),
            category: item.category,
            is_veg: item.is_veg,
            is_best_seller: item.is_best_seller,
            is_today_special: item.is_today_special,
            is_available: item.is_available,
            prep_time_minutes: String(item.prep_time_minutes),
        }
        : { ...EMPTY_FORM }
    );
    const [imageFile, setImageFile] = useState<File | undefined>();
    const [preview, setPreview] = useState<string | undefined>(item?.image_url);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl">
                    <h2 className="font-bold text-lg text-gray-900">{item ? 'Edit Item' : 'Add New Item'}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Food Image</label>
                        <div
                            onClick={() => fileRef.current?.click()}
                            className={cn(
                                'relative w-full aspect-video rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden',
                                preview ? 'border-orange-300' : 'border-gray-300 hover:border-orange-400'
                            )}
                        >
                            {preview ? (
                                <>
                                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <p className="text-white text-sm font-semibold">Click to change</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center">
                                    <ImagePlus className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                                    <p className="text-sm text-gray-500">Click to upload image</p>
                                </div>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Item Name *</label>
                        <input
                            value={form.name}
                            onChange={(e) => set('name', e.target.value)}
                            placeholder="e.g. Paneer Butter Masala"
                            className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                            placeholder="Short description of the dish..."
                            rows={2}
                            className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                        />
                    </div>

                    {/* Price + Prep Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price (₹) *</label>
                            <input
                                type="number"
                                min={0}
                                value={form.price}
                                onChange={(e) => set('price', e.target.value)}
                                placeholder="0"
                                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prep Time (min)</label>
                            <input
                                type="number"
                                min={1}
                                value={form.prep_time_minutes}
                                onChange={(e) => set('prep_time_minutes', e.target.value)}
                                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                        <select
                            value={form.category}
                            onChange={(e) => set('category', e.target.value)}
                            className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                        >
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-2 gap-3">
                        {([
                            { key: 'is_veg', label: '🥦 Vegetarian' },
                            { key: 'is_available', label: '✅ Available' },
                            { key: 'is_best_seller', label: '🔥 Best Seller' },
                            { key: 'is_today_special', label: '✨ Today\'s Special' },
                        ] as { key: keyof typeof form; label: string }[]).map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => set(key, !form[key])}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                                    form[key]
                                        ? 'bg-orange-50 border-orange-300 text-orange-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-500'
                                )}
                            >
                                {form[key]
                                    ? <ToggleRight className="w-4 h-4 shrink-0" />
                                    : <ToggleLeft className="w-4 h-4 shrink-0" />
                                }
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(form, imageFile)}
                        disabled={saving || !form.name || !form.price}
                        className="px-5 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {item ? 'Save Changes' : 'Add Item'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MenuManagement = () => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalItem, setModalItem] = useState<MenuItem | 'new' | null>(null);
    const [saving, setSaving] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const load = async () => {
        try {
            setLoading(true);
            const data = await menuService.getAll();
            setItems(data);
            setError(null);
        } catch (e: any) {
            setError(e.message || 'Failed to load menu items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleSave = async (formData: typeof EMPTY_FORM, imageFile?: File) => {
        setSaving(true);
        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                price: parseFloat(formData.price),
                category: formData.category,
                is_veg: formData.is_veg,
                is_best_seller: formData.is_best_seller,
                is_today_special: formData.is_today_special,
                is_available: formData.is_available,
                prep_time_minutes: parseInt(formData.prep_time_minutes) || 15,
            };
            if (modalItem === 'new') {
                await menuService.create(payload, imageFile);
            } else if (modalItem) {
                await menuService.update(modalItem.id, payload, imageFile);
            }
            await load();
            setModalItem(null);
        } catch (e: any) {
            alert('Error: ' + (e.message || 'Failed to save'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await menuService.delete(id);
            setItems((prev) => prev.filter((i) => i.id !== id));
            setDeleteConfirm(null);
        } catch (e: any) {
            alert('Delete failed: ' + e.message);
        }
    };

    const handleToggle = async (id: string, val: boolean) => {
        setTogglingId(id);
        try {
            await menuService.toggleAvailability(id, val);
            setItems((prev) => prev.map((i) => i.id === id ? { ...i, is_available: val } : i));
        } catch (e: any) {
            alert('Toggle failed: ' + e.message);
        } finally {
            setTogglingId(null);
        }
    };

    const filtered = items.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="relative flex-1 min-w-0 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search items..."
                        className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                    />
                </div>
                <button
                    onClick={() => setModalItem('new')}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Item
                </button>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-3 mb-6">
                {[
                    { label: 'Total Items', value: items.length, color: 'text-orange-500' },
                    { label: 'Available', value: items.filter(i => i.is_available).length, color: 'text-green-500' },
                    { label: 'Unavailable', value: items.filter(i => !i.is_available).length, color: 'text-gray-400' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white rounded-xl border px-5 py-3 flex items-center gap-3 shadow-sm">
                        <span className={cn('text-2xl font-bold', color)}>{value}</span>
                        <span className="text-gray-500 text-sm font-medium">{label}</span>
                    </div>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                    <Loader2 className="w-10 h-10 animate-spin mb-3 text-orange-400" />
                    <p>Loading menu items...</p>
                </div>
            ) : error ? (
                <div className="text-center py-20 text-red-500">
                    <p className="font-semibold mb-1">Failed to load items</p>
                    <p className="text-sm">{error}</p>
                    <button onClick={load} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold">Retry</button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 text-gray-400">
                    <div className="text-5xl mb-3">🍽️</div>
                    <p className="font-semibold text-gray-600 mb-1">{search ? 'No items match your search' : 'No menu items yet'}</p>
                    {!search && (
                        <button onClick={() => setModalItem('new')} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold">
                            Add your first item
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((item) => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            onEdit={(i) => setModalItem(i)}
                            onDelete={(id) => setDeleteConfirm(id)}
                            onToggle={handleToggle}
                            toggling={togglingId === item.id}
                        />
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {modalItem && (
                <ItemModal
                    item={modalItem === 'new' ? undefined : modalItem}
                    onClose={() => setModalItem(null)}
                    onSave={handleSave}
                    saving={saving}
                />
            )}

            {/* Delete confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
                        <div className="text-4xl mb-3">🗑️</div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">Delete Item?</h3>
                        <p className="text-gray-500 text-sm mb-5">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuManagement;
