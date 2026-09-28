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

export const ChaknaStoreAppView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'directory' | 'cart' | 'tiffin' | 'catering' | 'vendor_admin' | 'orders'
  >('directory');

  // Menu items state
  const [menuItems] = useState([
    { id: '1', name: 'Special Paneer Thali', price: 180, category: 'Main Meals', vendor: 'North Feast Kitchen', rating: 4.8 },
    { id: '2', name: 'Chakna Platter (Roasted Peanuts & Namkeen)', price: 120, category: 'Snacks', vendor: 'Chakna Express', rating: 4.9 },
    { id: '3', name: 'Dal Makhani & Butter Naan', price: 160, category: 'Main Meals', vendor: 'North Feast Kitchen', rating: 4.7 },
    { id: '4', name: 'Healthy Sprouts & Salad Bowl', price: 90, category: 'Healthy Foods', vendor: 'Green Leaf Kitchen', rating: 4.6 },
  ]);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([
    { id: '1', name: 'Special Paneer Thali', price: 180, quantity: 1 },
    { id: '2', name: 'Chakna Platter (Roasted Peanuts & Namkeen)', price: 120, quantity: 1 },
  ]);

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);

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
    alert(`Order placed successfully for ₹${finalTotal}! Order notification sent to Vendor Dashboard.`);
    setActiveTab('orders');
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: Order['status']) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
    setOrders(updated);
    hybridDB.saveAppData('chakna', 'orders', updated);
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
              <h1 className="text-xl font-bold text-white font-display">ChaknaStore Food Delivery & Vendor Portal</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Supabase Realtime
              </span>
            </div>
            <p className="text-xs text-slate-400">Cart Quantity Adjuster, Promo Codes (CHAKNA20), Order State Machine & Vendor Board</p>
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

      {/* Tab 3: Vendor Fulfillment State Machine Board */}
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

      {/* Tab 4: Live Order Tracker */}
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
    </div>
  );
};
