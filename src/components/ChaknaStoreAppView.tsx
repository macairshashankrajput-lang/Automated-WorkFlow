import React, { useState } from 'react';
import {
  Utensils,
  ShoppingBag,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  Plus,
  Minus,
  FileSpreadsheet,
  Trash2,
  Send,
  Building,
  DollarSign,
  Search,
  Tag,
  PlusCircle,
  Users,
  Award,
} from 'lucide-react';
import { hybridDB } from '../services/hybridDatabase';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  customer: string;
  phone: string;
  items: string;
  total: number;
  status: 'Order Placed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  time: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  vendor: string;
  rating: number;
}

interface TiffinSubscription {
  id: string;
  planType: string;
  duration: string;
  slot: string;
  price: number;
  startDate: string;
}

export const ChaknaStoreAppView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'directory' | 'cart' | 'tiffin' | 'catering' | 'vendor_admin' | 'orders'
  >('directory');

  // Menu items state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: '1', name: 'Special Paneer Thali', price: 180, category: 'Main Meals', vendor: 'North Feast Kitchen', rating: 4.8 },
    { id: '2', name: 'Chakna Platter (Roasted Peanuts & Namkeen)', price: 120, category: 'Snacks', vendor: 'Chakna Express', rating: 4.9 },
    { id: '3', name: 'Dal Makhani & Butter Naan', price: 160, category: 'Main Meals', vendor: 'North Feast Kitchen', rating: 4.7 },
    { id: '4', name: 'Healthy Sprouts & Salad Bowl', price: 90, category: 'Healthy Foods', vendor: 'Green Leaf Kitchen', rating: 4.6 },
  ]);

  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState(150);
  const [newDishCategory, setNewDishCategory] = useState('Snacks');
  const [newDishVendor, setNewDishVendor] = useState('Chakna Express');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([
    { id: '1', name: 'Special Paneer Thali', price: 180, quantity: 1 },
    { id: '2', name: 'Chakna Platter (Roasted Peanuts & Namkeen)', price: 120, quantity: 1 },
  ]);

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);

  // Tiffin Subscriptions State
  const [tiffins, setTiffins] = useState<TiffinSubscription[]>([
    { id: 'SUB-101', planType: 'Special North Indian Veg Meal', duration: 'Monthly (30 Days)', slot: 'Lunch (12:30 PM)', price: 4200, startDate: '2026-09-01' },
  ]);
  const [tiffinPlanType, setTiffinPlanType] = useState('Special North Indian Veg Meal');
  const [tiffinDuration, setTiffinDuration] = useState('Weekly (7 Days)');
  const [tiffinSlot, setTiffinSlot] = useState('Dinner (08:00 PM)');

  // Catering Estimator State
  const [guestCount, setGuestCount] = useState(30);
  const [cateringCategory, setCateringCategory] = useState('Corporate Event Snacks & Platter');
  const [quoteRequested, setQuoteRequested] = useState(false);

  // Active Orders State
  const [orders, setOrders] = useState<Order[]>([
    { id: 'ORD-8801', customer: 'Shashank Rajput', phone: '+91 98765 43210', items: 'Paneer Thali x1, Chakna Platter x1', total: 300, status: 'Preparing', time: '10 mins ago' },
    { id: 'ORD-8802', customer: 'Priya Sharma', phone: '+91 97788 99001', items: 'Healthy Sprouts Bowl x2', total: 180, status: 'Out for Delivery', time: '25 mins ago' },
  ]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddToCart = (item: { id: string; name: string; price: number }) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(cart.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (id: string, delta: number) => {
    setCart(
      cart
        .map((c) => {
          if (c.id === id) {
            const q = c.quantity + delta;
            return q > 0 ? { ...c, quantity: q } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const applyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'CHAKNA20') {
      setDiscountPercent(20);
      setPromoApplied(true);
      alert('Promo code CHAKNA20 applied! 20% Discount active.');
    } else {
      alert('Invalid Promo Code. Try using "CHAKNA20" for 20% off.');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const finalTotal = subtotal - discountAmount;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const newOrd: Order = {
      id: `ORD-${Math.floor(8800 + Math.random() * 100)}`,
      customer: 'Shashank Rajput',
      phone: '+91 98765 43210',
      items: cart.map((c) => `${c.name} x${c.quantity}`).join(', '),
      total: finalTotal,
      status: 'Order Placed',
      time: 'Just Now',
    };

    setOrders([newOrd, ...orders]);
    setCart([]);
    setPromoApplied(false);
    setDiscountPercent(0);
    alert(`Order placed successfully for ₹${finalTotal}! Notification sent to Vendor Board.`);
    setActiveTab('orders');
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: Order['status']) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
    setOrders(updated);
    hybridDB.saveAppData('chakna', 'orders', updated);
  };

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;
    const item: MenuItem = {
      id: Date.now().toString(),
      name: newDishName,
      price: Number(newDishPrice),
      category: newDishCategory,
      vendor: newDishVendor,
      rating: 5.0,
    };
    setMenuItems([...menuItems, item]);
    setShowAddDishModal(false);
    setNewDishName('');
    hybridDB.saveAppData('chakna', 'menu', [...menuItems, item]);
  };

  const handleSubscribeTiffin = (e: React.FormEvent) => {
    e.preventDefault();
    const price = tiffinDuration.includes('Weekly') ? 1150 : 4200;
    const sub: TiffinSubscription = {
      id: `SUB-${Math.floor(100 + Math.random() * 900)}`,
      planType: tiffinPlanType,
      duration: tiffinDuration,
      slot: tiffinSlot,
      price,
      startDate: new Date().toISOString().split('T')[0],
    };
    setTiffins([...tiffins, sub]);
    alert(`Successfully subscribed to ${tiffinPlanType} (${tiffinDuration})! Active from today.`);
  };

  const handleExportOrders = () => {
    hybridDB.exportToSpreadsheet('ChaknaStore_Fulfillment_Log', orders);
  };

  const filteredItems = menuItems.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* App Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Utensils className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white font-display">ChaknaStore Food Delivery & Vendor Suite</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                7 Integrated Modules
              </span>
            </div>
            <p className="text-xs text-slate-400">Cart Quantity Adjuster, Promo Codes (CHAKNA20), Tiffin Plans, Party Catering & Vendor Board</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportOrders}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 font-bold text-xs text-slate-200 transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4 text-amber-400" /> Export Orders (.xlsx)
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs text-white shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2"
          >
            <ShoppingBag className="h-4 w-4" /> Cart ({cart.reduce((sum, c) => sum + c.quantity, 0)})
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-semibold">
        {[
          { id: 'directory', label: 'Food Directory', icon: Utensils },
          { id: 'cart', label: `Cart (${cart.length})`, icon: ShoppingBag },
          { id: 'tiffin', label: 'Tiffin Subscriptions', icon: Calendar },
          { id: 'catering', label: 'Party Catering Estimator', icon: Users },
          { id: 'vendor_admin', label: 'Vendor Fulfillment Board', icon: DollarSign },
          { id: 'orders', label: 'Live Order Tracker', icon: Truck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 flex-shrink-0 ${
                isActive
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Food Directory */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="relative max-w-xs">
              <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dish or vendor..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={() => setShowAddDishModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" /> Vendor: Publish New Dish
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{item.category}</span>
                    <h3 className="text-sm font-bold text-white">{item.name}</h3>
                    <div className="text-xs text-slate-400">By {item.vendor} • ★ {item.rating}</div>
                  </div>
                  <div className="text-base font-extrabold text-amber-400">₹{item.price}</div>
                </div>

                <button
                  onClick={() => handleAddToCart(item)}
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Cart & Promo Code */}
      {activeTab === 'cart' && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 max-w-xl">
          <h2 className="text-sm font-bold text-white">Your Shopping Cart</h2>

          {cart.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <p>Your cart is empty.</p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {cart.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-400">₹{item.price} each</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                      <button onClick={() => handleQuantityChange(item.id, -1)} className="p-1 text-slate-400 hover:text-white">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2 font-bold text-white">{item.quantity}</span>
                      <button onClick={() => handleQuantityChange(item.id, 1)} className="p-1 text-slate-400 hover:text-white">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-bold text-amber-400 w-16 text-right">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              ))}

              {/* Promo Code Input */}
              <form onSubmit={applyPromoCode} className="flex items-center gap-2 pt-2">
                <div className="relative flex-1">
                  <Tag className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter Promo Code (e.g. CHAKNA20)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button type="submit" className="px-3 py-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 font-bold text-xs">
                  Apply Promo
                </button>
              </form>

              {promoApplied && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex justify-between font-bold">
                  <span>20% Promo Discount Applied!</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between font-bold text-sm">
                <span className="text-slate-300">Total Amount:</span>
                <span className="text-amber-400">₹{finalTotal}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-white shadow-lg transition-all"
              >
                Place Order & Pay ₹{finalTotal}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Tiffin Subscriptions */}
      {activeTab === 'tiffin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-400" /> Configure Daily Tiffin Subscription
            </h2>
            <form onSubmit={handleSubscribeTiffin} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Meal Preference</label>
                <select
                  value={tiffinPlanType}
                  onChange={(e) => setTiffinPlanType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="Special North Indian Veg Meal">Special North Indian Veg Meal (Roti, Sabzi, Dal, Rice)</option>
                  <option value="Executive Non-Veg Chicken Thali">Executive Non-Veg Chicken Thali</option>
                  <option value="High-Protein Salad & Sprouts Bowl">High-Protein Salad & Sprouts Bowl</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Plan Duration</label>
                  <select
                    value={tiffinDuration}
                    onChange={(e) => setTiffinDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="Weekly (7 Days)">Weekly (7 Days - ₹1,150)</option>
                    <option value="Monthly (30 Days)">Monthly (30 Days - ₹4,200)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Delivery Slot</label>
                  <select
                    value={tiffinSlot}
                    onChange={(e) => setTiffinSlot(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="Lunch (12:30 PM)">Lunch (12:30 PM)</option>
                    <option value="Dinner (08:00 PM)">Dinner (08:00 PM)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-white transition-all">
                Subscribe Tiffin Plan Now
              </button>
            </form>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white">Active Tiffin Plans ({tiffins.length})</h2>
            {tiffins.map((sub) => (
              <div key={sub.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-white">
                  <span>{sub.planType}</span>
                  <span className="text-amber-400">₹{sub.price}</span>
                </div>
                <div className="text-slate-400">{sub.duration} • {sub.slot}</div>
                <div className="text-[11px] text-emerald-400 font-bold pt-1">Active Since: {sub.startDate}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Party Catering Estimator */}
      {activeTab === 'catering' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 max-w-lg">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" /> Event Catering & Party Estimator
          </h2>
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-slate-400">Guest Count:</label>
                <span className="font-bold text-amber-400 text-sm">{guestCount} Guests</span>
              </div>
              <input
                type="range"
                min="10"
                max="250"
                step="5"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Event Catering Package</label>
              <select
                value={cateringCategory}
                onChange={(e) => setCateringCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              >
                <option value="Corporate Event Snacks & Platter">Corporate Event Snacks & Platter (₹180/head)</option>
                <option value="Grand Party Buffet Dinner">Grand Party Buffet Dinner (₹350/head)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-bold">
              <div className="flex justify-between text-slate-300">
                <span>Estimated Total Catering Cost:</span>
                <span className="text-amber-400 text-base">₹{(guestCount * (cateringCategory.includes('Buffet') ? 350 : 180)).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setQuoteRequested(true);
                alert(`Catering quote request submitted for ${guestCount} guests! ChaknaStore Events Manager will contact you.`);
              }}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-white transition-all shadow-lg shadow-amber-600/30"
            >
              {quoteRequested ? 'Quote Requested!' : 'Request Catering Quote'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Vendor Fulfillment State Machine Board */}
      {activeTab === 'vendor_admin' && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white">Vendor Orders Fulfillment Board</h2>
          <div className="space-y-3 text-xs">
            {orders.map((o) => (
              <div key={o.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-sm">{o.id}</span>
                    <div className="text-slate-400">{o.customer} ({o.phone}) • {o.time}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-400 text-sm block">₹{o.total}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
                      {o.status}
                    </span>
                  </div>
                </div>

                <div className="text-slate-300 font-mono bg-slate-900 p-2 rounded-lg">{o.items}</div>

                <div className="pt-2 flex flex-wrap gap-2 justify-end">
                  {o.status === 'Order Placed' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, 'Preparing')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold"
                    >
                      Start Preparing
                    </button>
                  )}
                  {o.status === 'Preparing' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, 'Out for Delivery')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold"
                    >
                      Dispatch for Delivery
                    </button>
                  )}
                  {o.status === 'Out for Delivery' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, 'Delivered')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Live Order Tracker */}
      {activeTab === 'orders' && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white">Live Customer Order Tracker</h2>
          <div className="space-y-2 text-xs">
            {orders.map((o) => (
              <div key={o.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{o.id}</div>
                  <div className="text-[11px] text-slate-400">{o.items}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Dish Modal */}
      {showAddDishModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 animate-fade-in">
            <h2 className="text-base font-bold text-white">Publish New Vendor Dish</h2>
            <form onSubmit={handleAddDish} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  placeholder="e.g. Crispy Corn Chaat"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={newDishPrice}
                    onChange={(e) => setNewDishPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="Snacks">Snacks</option>
                    <option value="Main Meals">Main Meals</option>
                    <option value="Healthy Foods">Healthy Foods</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Vendor Kitchen Name</label>
                <input
                  type="text"
                  value={newDishVendor}
                  onChange={(e) => setNewDishVendor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddDishModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold">
                  Publish Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
