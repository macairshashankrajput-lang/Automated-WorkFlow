import { supabase, handleError } from './supabase-service';

export const adminOrderService = {
    // Admin preview all live/past orders
    getAllOrders: async () => {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        order_items (*),
        users!user_id (*),
        users!vendor_id (name, business_name, phone)
      `)
            .order('created_at', { ascending: false });
        handleError(error);
        return data || [];
    },

    // Override/reassign order to vendor
    reassignOrder: async (orderId: string, vendorId: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ vendor_id: vendorId })
            .eq('id', orderId);
        handleError(error);
    },

    // Update any order field (full access)
    updateOrder: async (orderId: string, updates: any) => {
        const { error } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', orderId);
        handleError(error);
    },

    // Revenue history
    getRevenueHistory: async (vendorId?: string, fromDate?: string, toDate?: string) => {
        let query = supabase.from('order_revenue').select('*');
        if (vendorId) query = query.eq('vendor_id', vendorId);
        if (fromDate) query = query.gte('date', fromDate);
        if (toDate) query = query.lte('date', toDate);
        const { data, error } = await query.order('date', { ascending: false });
        handleError(error);
        return data || [];
    },

    // Tiffin master management: Customer wise/upcoming/vendor assigned
    getTiffinPlans: async (customerId?: string, upcoming = true, assigned = true) => {
        let query = supabase.from('tiffin_customer_view').select('*');
        if (customerId) query = query.eq('customer_name ilike.*customerId*', `%${customerId}%`); // fuzzy
        if (upcoming) query = query.gte('start_date', new Date().toISOString());
        // Filter assigned if needed
        const { data, error } = await query.order('start_date');
        handleError(error);
        return data || [];
    },

    // Admin edit tiffin order/assign vendor
    assignTiffinVendor: async (subscriptionId: number, vendorId: string) => {
        const { error } = await supabase
            .from('tiffin_subscriptions')
            .update({ vendor_id: vendorId })
            .eq('id', subscriptionId);
        handleError(error);
    },

    // Catering status update (already in cateringService)
};

export default adminOrderService;
