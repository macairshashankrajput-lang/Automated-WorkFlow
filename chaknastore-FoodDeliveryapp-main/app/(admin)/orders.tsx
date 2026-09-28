import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { AdminDataTable } from '@/components/ui/admin-data-table';
import { orderService, type Order } from '@/lib/supabase-service';

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders', error);
      Alert.alert('Error', 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const unsubscribe = orderService.subscribeToOrders((newOrders) => {
      setOrders(newOrders);
    });
    return () => unsubscribe();
  }, []);

  const renderOrder = ({ item }: { item: Order }) => {
    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A';
    return (
      <View className="p-5 bg-surface rounded-[32px] border border-border mb-4 shadow-sm">
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text className="font-bold text-foreground text-xl">Order #ORD-{item.id}</Text>
            <Text className="text-sm text-muted mt-0.5">{date}</Text>
          </View>
          <View className={`px-4 py-1.5 rounded-full ${getStatusColor(item.status)}`}>
            <Text className="text-[11px] font-bold uppercase tracking-wider">{item.status.replace(/_/g, ' ')}</Text>
          </View>
        </View>
        
        <View className="mb-4 bg-background/50 rounded-2xl p-3 flex-row justify-between items-center">
          <View>
            <Text className="text-xs text-muted uppercase font-bold mb-1">Total Amount</Text>
            <Text className="text-xl font-bold text-primary">₹{item.totalPrice}</Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-muted uppercase font-bold mb-1">Service Type</Text>
            <Text className="text-sm font-semibold text-foreground capitalize">{item.type}</Text>
          </View>
        </View>

        <TouchableOpacity 
          className="bg-primary rounded-2xl py-3.5 items-center shadow-sm"
          onPress={() => Alert.alert('Order Detail', `Viewing details for Order ${item.id}`)}
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-sm">Manage Order</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-success/10 text-success';
      case 'cancelled': return 'bg-error/10 text-error';
      case 'pending': return 'bg-warning/10 text-warning';
      default: return 'bg-blue-500/10 text-blue-500';
    }
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <AdminDataTable
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder as any}
        filterOptions={[
          { label: 'All', value: 'all' },
          { label: 'Pending', value: 'pending' },
          { label: 'Delivered', value: 'delivered' },
          { label: 'Cancelled', value: 'cancelled' },
        ]}
        searchKeys={['id', 'status', 'type'] as any}
        loading={loading}
        onRefresh={loadOrders}
        emptyTitle="No Orders Found"
        emptyDescription="Orders placed by customers will appear here."
      />
    </ScreenContainer>
  );
}
