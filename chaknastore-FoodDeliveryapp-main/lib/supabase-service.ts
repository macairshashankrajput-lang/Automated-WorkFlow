/**
 * Supabase Service
 * Unified Supabase database and storage access for the app.
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { menuCatalog } from './menu-data';
import { supabaseConfig } from './supabase-config';

const SUPABASE_URL = supabaseConfig.url;
const SUPABASE_ANON_KEY = supabaseConfig.anonKey;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export const db = supabase;

export function handleError(error: any, defaultMessage = 'Supabase request failed') {
  if (error) {
    console.error(`[Supabase Error] ${defaultMessage}:`, error);
    throw new Error(error.message ?? defaultMessage);
  }
}

// ============================================================================
// TYPES (aligned with Drizzle schema)
// ============================================================================

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: 'veg' | 'non-veg';
  price: number;
  image: string | null;
  ingredients: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: 'customer' | 'vendor' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  referralCode: string | null;
  pointsBalance: number;
  deliveryLocation: { address: string; latitude: number; longitude: number } | null;
  createdAt: string;
}


export interface Order {
  id: string;               // format: userId_timestamp
  userId: string;
  vendorId: string | null;
  type: 'chakna' | 'tiffin' | 'catering';
  subtotal: number;
  tax: number;
  deliveryFee: number;
  totalPrice: number;
  status: 'pending' | 'cooking' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentStatus: string;
  paymentMethod: string | null;
  receiptImage: string | null;
  createdAt: string;
}

export interface CateringRequest {
  id: number;
  userId: string;
  eventDate: string;
  guestCount: number;
  location: string;
  budget: number | null;
  menuPreferences: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

export interface TiffinSubscription {
  id: number;
  userId: string;
  startDate: string;
  endDate: string;
  totalPoints: number;
  remainingPoints: number;
  status: string;
}

export interface TiffinSchedule {
  id: number;
  subscriptionId: number;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  menuId: string | null;
  editableUntil: string | null;
  isChanged: boolean;
}

// ============================================================================
// MENU OPERATIONS
// ============================================================================

let _isMockMode = false;

export const menuService = {
  isMockMode: () => _isMockMode,

  getAllMenuItems: async (): Promise<MenuItem[]> => {
    try {
      const { data, error } = await supabase.from('menu').select('*').eq('is_active', true);
      if (error) throw error;
      _isMockMode = false;
      return (data as any[]).map(item => ({
        ...item,
        id: item.id.toString(),
      })) as MenuItem[];
    } catch (error: any) {
      console.warn('[SupabaseService] menu fetch failed, using catalog:', error.message);
      _isMockMode = true;
      // Fallback to local catalog if table doesn't exist yet or is empty
      const { menuItems } = require('./menu-data');
      return menuItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        type: item.type as 'veg' | 'non-veg',
        price: item.price,
        image: null,
        ingredients: item.ingredients.join(', '),
        isActive: true,
        createdAt: new Date().toISOString()
      }));
    }
  },

  getMenuItemById: async (id: string): Promise<MenuItem | null> => {
    const { data, error } = await supabase.from('menu').select('*').eq('id', id).single();
    if (error) {
      // Fallback
      const items = await menuService.getAllMenuItems();
      return items.find(i => i.id === id) || null;
    }
    return { ...data, id: data.id.toString() } as MenuItem;
  },

  subscribeToMenu: (callback: (items: MenuItem[]) => void) => {
    const channel = supabase
      .channel('menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, async () => {
        const items = await menuService.getAllMenuItems();
        callback(items);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },

  getVendorMenu: async (vendorId: string): Promise<MenuItem[]> => {
    try {
      // If vendor-specific menu is supported via a vendor_id column
      const { data, error } = await supabase.from('menu').select('*').eq('vendor_id', vendorId).eq('is_active', true);
      if (error || !data || data.length === 0) {
        // Fall back to returning all active items if vendor_id column doesn't exist
        return menuService.getAllMenuItems();
      }
      return (data as any[]).map(item => ({ ...item, id: item.id.toString() })) as MenuItem[];
    } catch {
      return menuService.getAllMenuItems();
    }
  },

  addMenuItem: async (item: any) => {
    const { data, error } = await supabase.from('menu').insert({
      vendor_id: item.vendorId,
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description,
      image: item.image,
      ingredients: item.ingredients,
      is_active: true,
    }).select().single();
    handleError(error);
    return { ...data, id: data.id.toString() } as MenuItem;
  },

  updateMenuItem: async (id: string | number, updates: any) => {
    const { error } = await supabase.from('menu').update({
      name: updates.name,
      price: updates.price,
      category: updates.category,
      description: updates.description,
      image: updates.image,
      is_active: updates.isActive ?? updates.available
    }).eq('id', id);
    handleError(error);
  },

  deleteMenuItem: async (id: string) => {
    const { error } = await supabase.from('menu').delete().eq('id', id);
    handleError(error);
  },

  seedMenuFromJson: async (items: any[]) => {
    const formatted = items.map(item => ({
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description,
      image: item.image,
      is_active: item.available ?? true
    }));
    const { error } = await supabase.from('menu').insert(formatted);
    if (error) console.error('Seed failed:', error);
  }
};

// ============================================================================
// USER OPERATIONS
// ============================================================================

export const userService = {
  updateUserProfile: async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .update({
        name: updates.name,
        phone: updates.phone,
        delivery_location: updates.deliveryLocation,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    handleError(error);
  },

  getProfile: async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    handleError(error);
    return data as UserProfile;
  },

  updatePoints: async (userId: string, points: number) => {
    const { data, error } = await supabase.rpc('increment_points', { user_id: userId, amount: points });
    if (error) {
      // Fallback if RPC doesn't exist
      const { data: profile } = await supabase.from('users').select('points_balance').eq('id', userId).single();
      const newBalance = (profile?.points_balance || 0) + points;
      await supabase.from('users').update({ points_balance: newBalance }).eq('id', userId);
    }
  },

  getCustomerCount: async (): Promise<number> => {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer');
    handleError(error);
    return count || 0;
  },

  getActiveVendorCount: async (): Promise<number> => {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'vendor').eq('status', 'active');
    handleError(error);
    return count || 0;
  }
};

// ============================================================================
// CATERING OPERATIONS
// ============================================================================

export const cateringService = {
  submitRequest: async (request: Omit<CateringRequest, 'id' | 'createdAt' | 'status'>) => {
    const { data, error } = await supabase.from('catering_requests').insert({
      ...request,
      status: 'pending'
    }).select().single();
    handleError(error);
    return data as CateringRequest;
  },

  getUserRequests: async (userId: string): Promise<CateringRequest[]> => {
    const { data, error } = await supabase.from('catering_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    handleError(error);
    return data as CateringRequest[];
  },

  getAllRequests: async (): Promise<CateringRequest[]> => {
    const { data, error } = await supabase
      .from('catering_requests')
      .select('*, users!user_id(name, phone)')
      .order('created_at', { ascending: false });
    handleError(error);
    return data as any[];
  },

  updateRequestStatus: async (id: number | string, status: string) => {
    const { error } = await supabase.from('catering_requests').update({ status }).eq('id', id);
    handleError(error);
  }
};

// ============================================================================
// TIFFIN OPERATIONS
// ============================================================================

export const tiffinService = {
  createSubscription: async (sub: Omit<TiffinSubscription, 'id' | 'status' | 'remainingPoints'> & { 
    meals?: { breakfast: boolean; lunch: boolean; dinner: boolean }, 
    defaultMenuId?: string,
    excludeWeekends?: boolean,
    skipDates?: string[]
  }) => {
    const { meals, defaultMenuId, excludeWeekends, skipDates, ...subData } = sub;

    // Check if user has enough points
    const { data: profile, error: profileError } = await supabase.from('users').select('points_balance').eq('id', subData.userId).single();
    if (profileError) throw profileError;
    if ((profile?.points_balance || 0) < subData.totalPoints) {
      throw new Error(`Insufficient points. You need ${subData.totalPoints} points but have ${profile?.points_balance || 0}.`);
    }

    // Deduct points from user
    const { error: deductError } = await supabase.from('users').update({ 
      points_balance: (profile.points_balance || 0) - subData.totalPoints 
    }).eq('id', subData.userId);
    if (deductError) throw deductError;

    const { data: newSub, error } = await supabase.from('tiffin_subscriptions').insert({
      ...subData,
      remaining_points: subData.totalPoints,
      status: 'active'
    }).select().single();
    
    handleError(error);

    // Create initial schedule
    if (meals && defaultMenuId) {
      const start = new Date(subData.startDate);
      const end = new Date(subData.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      const scheduleItems = [];
      const skipSet = new Set(skipDates || []);

      for (let i = 0; i < days; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday

        // Skip if date is in skipDates or if it's a weekend and excludeWeekends is true
        if (skipSet.has(dateStr)) continue;
        if (excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) continue;

        if (meals.breakfast) {
          scheduleItems.push({
            subscription_id: newSub.id,
            date: currentDate.toISOString(),
            meal_type: 'breakfast',
            menu_id: defaultMenuId,
            editable_until: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
        if (meals.lunch) {
          scheduleItems.push({
            subscription_id: newSub.id,
            date: currentDate.toISOString(),
            meal_type: 'lunch',
            menu_id: defaultMenuId,
            editable_until: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
        if (meals.dinner) {
          scheduleItems.push({
            subscription_id: newSub.id,
            date: currentDate.toISOString(),
            meal_type: 'dinner',
            menu_id: defaultMenuId,
            editable_until: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }

      if (scheduleItems.length > 0) {
        const { error: scheduleError } = await supabase.from('tiffin_schedule').insert(scheduleItems);
        if (scheduleError) console.error('Failed to create initial schedule:', scheduleError);
      }
    }

    return newSub as TiffinSubscription;
  },

  getSubscription: async (userId: string): Promise<TiffinSubscription | null> => {
    const { data, error } = await supabase.from('tiffin_subscriptions').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle();
    handleError(error);
    return data as TiffinSubscription;
  },

  getSchedule: async (subscriptionId: number): Promise<TiffinSchedule[]> => {
    const { data, error } = await supabase.from('tiffin_schedule').select('*').eq('subscription_id', subscriptionId);
    handleError(error);
    return data as TiffinSchedule[];
  },

  updateScheduleItem: async (id: number, menuId: string) => {
    const { data: item } = await supabase.from('tiffin_schedule').select('editable_until').eq('id', id).single();
    if (item?.editable_until && new Date(item.editable_until) < new Date()) {
       throw new Error('Changes can only be made 2 days prior to delivery');
    }

    const { error } = await supabase.from('tiffin_schedule').update({ menu_id: menuId }).eq('id', id);
    handleError(error);
  },

  addPoints: async (userId: string, amount: number) => {
    // In a real app, this would be after payment verification
    await userService.updatePoints(userId, amount);
  }
};

// ============================================================================
// ORDER OPERATIONS
// ============================================================================

export const orderService = {
  /**
   * Creates an order with a unique userId_timestamp ID.
   * Also creates a payment record and a bill record automatically.
   */
  createOrder: async (
    order: Omit<Order, 'id' | 'createdAt' | 'status' | 'paymentStatus'>,
    items: { menuId: number; quantity: number; price: number; notes?: string }[]
  ) => {
    const timestamp = Date.now();
    const orderId = `${order.userId}_${timestamp}`;

    const { data: newOrder, error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      user_id: order.userId,
      vendor_id: order.vendorId,
      type: order.type,
      subtotal: order.subtotal ?? order.totalPrice,
      tax: order.tax ?? 0,
      delivery_fee: order.deliveryFee ?? 0,
      total_price: order.totalPrice,
      payment_method: order.paymentMethod,
      status: 'pending',
      payment_status: 'pending',
    }).select().single();

    handleError(orderError);

    // Create payment record
    await supabase.from('payments').insert({
      id: `${orderId}_PAY`,
      order_id: orderId,
      user_id: order.userId,
      amount: order.totalPrice,
      method: order.paymentMethod ?? 'cod',
      status: 'pending',
    });

    const orderItems = items.map(item => ({
      order_id: orderId,
      menu_id: item.menuId,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes ?? null,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    handleError(itemsError);

    return newOrder as Order;
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    handleError(error);
    // Normalise snake_case from DB to camelCase
    return (data || []).map((o: any) => ({
      ...o,
      totalPrice: o.total_price,
      deliveryFee: o.delivery_fee,
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      createdAt: o.created_at,
    })) as Order[];
  },

  getAllOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    handleError(error);
    return (data || []).map((o: any) => ({
      ...o,
      totalPrice: o.total_price,
      deliveryFee: o.delivery_fee,
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      createdAt: o.created_at,
    })) as Order[];
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    handleError(error);
  },

  getOrderDetails: async (orderId: string) => {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`*, users!user_id (name, email, phone, delivery_location)`)
      .eq('id', orderId)
      .single();

    handleError(orderError);

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`*, menu!menu_id (name, price, image)`)
      .eq('order_id', orderId);

    handleError(itemsError);

    // Also fetch payment record
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    return {
      ...order,
      totalPrice: order.total_price,
      subtotal: order.subtotal ?? order.total_price,
      tax: order.tax ?? 0,
      deliveryFee: order.delivery_fee ?? 0,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      createdAt: order.created_at,
      payment: payment ?? null,
      items: (items || []).map((item: any) => ({
        ...item,
        // Use menu name first, fallback to notes (item name stored at checkout)
        name: item.menu?.name ?? item.notes ?? 'Menu Item',
        menuPrice: item.menu?.price ?? item.price,
        image: item.menu?.image ?? null,
      })),
    };
  },

  subscribeToOrders: (callback: (orders: Order[]) => void) => {
    const channel = supabase
      .channel('order-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const orders = await orderService.getAllOrders();
        callback(orders);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }
};

export interface Review {
  id: number;
  userId: string;
  orderId: string | null;  // now a varchar (userId_timestamp)
  rating: number;
  comment: string | null;
  createdAt: string;
  // Computed fields from joins
  userName?: string;
  itemName?: string;
  status?: string; 
}

// ============================================================================
// REVIEW OPERATIONS
// ============================================================================

export const reviewService = {
  getAllReviews: async (): Promise<Review[]> => {
    const { data, error } = await supabase.from('reviews').select(`
      *,
      users!user_id (name)
    `).order('created_at', { ascending: false });
    handleError(error);
    return (data as any[]).map(r => ({
      ...r,
      userName: r.users?.name || 'Unknown'
    })) as Review[];
  },

  updateReviewStatus: async (reviewId: number | string, status: string) => {
    const { error } = await supabase.from('reviews').update({ status }).eq('id', reviewId);
    handleError(error);
  },

  subscribeToReviews: (callback: (reviews: Review[]) => void) => {
    const channel = supabase
      .channel('review-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, async () => {
        const reviews = await reviewService.getAllReviews();
        callback(reviews);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }
};

export interface VendorUser extends UserProfile {
  businessName: string | null;
}

// ============================================================================
// VENDOR OPERATIONS
// ============================================================================

export const vendorService = {
  getAllVendors: async (): Promise<VendorUser[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'vendor')
      .order('created_at', { ascending: false });
    handleError(error);
    return (data as any[]).map(v => ({
      ...v,
      id: v.id,
      username: v.username,
      name: v.name,
      email: v.email,
      phone: v.phone,
      role: v.role,
      status: v.status,
      businessName: v.business_name || v.name,
      createdAt: v.created_at
    })) as VendorUser[];
  },

  updateVendorStatus: async (vendorId: string, status: string) => {
    const { error } = await supabase.from('users').update({ status }).eq('id', vendorId);
    handleError(error);
  },

  deleteVendor: async (vendorId: string) => {
    // Delete from public.users first
    const { error: profileError } = await supabase.from('users').delete().eq('id', vendorId);
    handleError(profileError);
    // Note: auth.users deletion usually happens via admin API or service role key
  },

  createVendor: async (vendor: any) => {
    const serviceKey = supabaseConfig.serviceRoleKey;
    const authEmail = `${vendor.username.toLowerCase()}@chakna.app`;
    
    // For admin operations, we use a service role client if key is available.
    // If not (e.g. on client), we fallback to a non-persisting signUp.
    const client = serviceKey 
      ? createClient(supabaseConfig.url, serviceKey, { auth: { persistSession: false } })
      : createClient(supabaseConfig.url, supabaseConfig.anonKey, { auth: { persistSession: false } });
    
    let userId: string;

    if (serviceKey && client.auth.admin) {
      const { data: authData, error: authError } = await client.auth.admin.createUser({
        email: authEmail,
        password: vendor.password,
        email_confirm: true,
        user_metadata: {
          role: 'vendor',
          name: vendor.name,
          username: vendor.username,
          businessName: vendor.businessName,
          profileEmail: vendor.email
        }
      });
      if (authError) throw authError;
      userId = authData.user.id;
    } else {
      // Fallback for client-side creation (might require RLS to be disabled or specific policies)
      const { data: authData, error: authError } = await client.auth.signUp({
        email: authEmail,
        password: vendor.password,
        options: {
          data: {
            role: 'vendor',
            name: vendor.name,
            username: vendor.username,
            businessName: vendor.businessName,
            profileEmail: vendor.email
          }
        }
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create vendor account');
      userId = authData.user.id;
    }

    // Create profile in the users table
    const { error: profileError } = await supabase.from('users').insert({
      id: userId,
      username: vendor.username,
      name: vendor.name,
      email: vendor.email || authEmail,
      phone: vendor.phone,
      role: 'vendor',
      status: vendor.status || 'active',
      business_name: vendor.businessName,
      created_at: new Date().toISOString()
    });

    if (profileError) {
      if (serviceKey && client.auth.admin) {
        await client.auth.admin.deleteUser(userId);
      }
      throw profileError;
    }

    return { id: userId };
  },

  updateVendor: async (vendorId: string, updates: Partial<VendorUser>) => {
    const { error } = await supabase.from('users').update({
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
      business_name: updates.businessName,
      updated_at: new Date().toISOString()
    }).eq('id', vendorId);
    handleError(error);
  }
};

// ============================================================================
// CHAT OPERATIONS
// ============================================================================

export const chatService = {
  getChats: async (userId: string) => {
    const { data, error } = await supabase
      .from('chats')
      .select('*, customer:customer_id(id, name), vendor:vendor_id(id, name, business_name)')
      .or(`customer_id.eq.${userId},vendor_id.eq.${userId}`)
      .order('updated_at', { ascending: false });
    handleError(error);
    return data;
  },

  getMessages: async (chatId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    handleError(error);
    return data;
  },

  sendMessage: async (chatId: string, senderId: string, content: string) => {
    const { data, error } = await supabase.from('chat_messages').insert({
      chat_id: chatId,
      sender_id: senderId,
      content
    }).select().single();
    handleError(error);
    
    // Update last message in chat
    await supabase.from('chats').update({
      last_message: content,
      updated_at: new Date().toISOString()
    }).eq('id', chatId);
    
    return data;
  },

  getOrCreateChat: async (customerId: string, vendorId: string) => {
    const { data, error } = await supabase
      .from('chats')
      .select('*, customer:customer_id(id, name), vendor:vendor_id(id, name, business_name)')
      .eq('customer_id', customerId)
      .eq('vendor_id', vendorId)
      .maybeSingle();
    
    if (data) return data;

    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert({ customer_id: customerId, vendor_id: vendorId })
      .select()
      .single();
    
    handleError(createError);
    return newChat;
  },

  subscribeToMessages: (chatId: string, callback: (message: any) => void) => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `chat_id=eq.${chatId}` 
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }
};

// ============================================================================
// NOTIFICATION OPERATIONS
// ============================================================================

export const notificationService = {
  getUserNotifications: async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    handleError(error);
    return data || [];
  },

  markAsRead: async (id: number) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    handleError(error);
  },

  markAllAsRead: async (userId: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    handleError(error);
  },

  subscribeToNotifications: (userId: string, callback: (notification: any) => void) => {
    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userId}` 
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }
};

export default supabase;

