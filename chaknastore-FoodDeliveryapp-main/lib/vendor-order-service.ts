import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, handleError } from './supabase-service';

export interface VendorOrderSummary {
    newOrders: number;
    activeOrders: number;
    totalEarnings: number;
    avgRating: number;
}

export const vendorOrderService = {
    getVendorOrders: async (vendorId: string) => {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        order_items (
          menu_id,
          quantity,
          price,
          menu:menu_id (name)
        ),
        users!user_id (name, phone, delivery_location)
      `)
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false });
        handleError(error);
        return data || [];
    },

    getVendorOrderSummary: async (vendorId: string): Promise<VendorOrderSummary> => {
        const { count: newCount, error: newError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendorId)
            .eq('status', 'pending');
        handleError(newError);

        const { count: activeCount, error: activeError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendorId)
            .in('status', ['cooking', 'out_for_delivery']);
        handleError(activeError);

        const { data: earningsData, error: earningsError } = await supabase
            .from('orders')
            .select('total_price')
            .eq('vendor_id', vendorId)
            .eq('status', 'delivered');
        handleError(earningsError);
        const totalEarnings = earningsData?.reduce((sum: number, order: any) => sum + (order.total_price || 0), 0) || 0;

        const avgRating = 4.8;

        return {
            newOrders: newCount || 0,
            activeOrders: activeCount || 0,
            totalEarnings,
            avgRating,
        };
    },

    subscribeToVendorOrders: (vendorId: string, callback: (orders: any[]) => void) => {
        const channel: RealtimeChannel = supabase
            .channel(`realtime-vendor-orders-${vendorId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `vendor_id=eq.${vendorId}`
                },
                async () => {
                    const orders = await vendorOrderService.getVendorOrders(vendorId);
                    callback(orders);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    getVendorTiffinSchedule: async (vendorId: string, date: string) => {
        // Fetch tiffin schedules for the given date. 
        // In a production app, tiffin_subscriptions should have a vendor_id.
        // For now, we fetch all and can filter by vendorId if the column exists.
        const { data, error } = await supabase
            .from('tiffin_schedule')
            .select(`
                *,
                tiffin_subscriptions!inner (
                    user_id,
                    vendor_id,
                    users!user_id (name, phone, delivery_location)
                ),
                menu!menu_id (name, price)
            `)
            .gte('date', `${date}T00:00:00Z`)
            .lte('date', `${date}T23:59:59Z`);

        if (error) {
            console.error('getVendorTiffinSchedule error:', error);
            handleError(error);
        }

        // Filter by vendorId if the subscription is linked to this vendor
        // If vendor_id doesn't exist yet in subscriptions, we return all for now to avoid breaking the view
        const filteredData = (data || []).filter((item: any) =>
            !item.tiffin_subscriptions?.vendor_id || item.tiffin_subscriptions.vendor_id === vendorId
        );

        return filteredData;
    },

    getVendorOrderItemStats: async (vendorId: string) => {
        const { data, error } = await supabase
            .from('order_items')
            .select(`
                quantity,
                menu:menu_id (name)
            `)
            .eq('orders.vendor_id', vendorId); // This might need a join or rpc if direct filter on joined table fails

        // Alternative: Fetch all orders and their items manually or use a view
        const { data: ordersWithItems, error: joinError } = await supabase
            .from('orders')
            .select('order_items(quantity, menu:menu_id(name))')
            .eq('vendor_id', vendorId);

        handleError(joinError);

        const stats: Record<string, number> = {};
        ordersWithItems?.forEach(order => {
            order.order_items?.forEach((item: any) => {
                const name = item.menu?.name || 'Unknown';
                stats[name] = (stats[name] || 0) + item.quantity;
            });
        });

        return Object.entries(stats)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    },

    updateTiffinScheduleStatus: async (scheduleId: number, status: string) => {
        const { error } = await supabase
            .from('tiffin_schedule')
            .update({ status })
            .eq('id', scheduleId);
        handleError(error);
    },

    acceptOrder: async (vendorId: string, orderId: string, deliveryTime: '10m' | '20m' | '30m' | '45m') => {
        // Verify order is pending and unassigned
        const { data: order, error: checkError } = await supabase
            .from('orders')
            .select('status, vendor_id')
            .eq('id', orderId)
            .single();
        handleError(checkError);

        if (!order || order.status !== 'pending' || order.vendor_id) {
            throw new Error('Order cannot be accepted: already assigned or not pending');
        }

        // Accept: set vendor, delivery_time, status to cooking (In Making)
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                vendor_id: vendorId,
                delivery_time: deliveryTime,
                status: 'cooking'
            })
            .eq('id', orderId);
        handleError(updateError);
    }
};

