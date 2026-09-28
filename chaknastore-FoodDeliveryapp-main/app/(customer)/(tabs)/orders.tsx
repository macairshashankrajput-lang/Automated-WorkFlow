/**
 * Customer Orders Screen
 * View order history and status
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { orderService, Order } from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';

export default function OrdersScreen() {
  const router = useRouter();
  const { state: authState } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!authState.user?.id) return;
    try {
      const data = await orderService.getUserOrders(authState.user.id);
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [authState.user?.id]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchOrders();
  };

  const statusColors: Record<string, string> = {
    delivered: 'bg-green-500/10 border-green-500 text-green-500',
    pending: 'bg-orange-500/10 border-orange-500 text-orange-500',
    cooking: 'bg-blue-500/10 border-blue-500 text-blue-500',
    preparing: 'bg-blue-500/10 border-blue-500 text-blue-500',
    out_for_delivery: 'bg-purple-500/10 border-purple-500 text-purple-500',
    cancelled: 'bg-red-500/10 border-red-500 text-red-500',
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      className="bg-surface rounded-2xl p-5 mb-4 border border-border shadow-sm active:opacity-90"
      onPress={() => router.push(`./order/${item.id}`)}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-lg font-bold text-foreground">#ORD-{item.id}</Text>
          <Text className="text-xs text-muted uppercase tracking-wider font-bold">{item.type}</Text>
        </View>
        <Text className="text-primary font-bold text-2xl">₹{item.totalPrice}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-muted text-sm">{format(new Date(item.createdAt), 'MMM d, h:mm a')}</Text>
        <View className={`px-3 py-1 rounded-full border ${statusColors[item.status] || 'bg-muted/10 border-muted text-muted'}`}>
          <Text className="text-xs font-bold capitalize">{item.status.replace(/_/g, ' ')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#E25C3D" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 bg-background">
      <View className="px-4 py-6 flex-1">
        <Text className="text-3xl font-bold text-foreground mb-6">Your Orders</Text>
        {orders.length === 0 ? (
          <EmptyState 
            emoji="📦"
            title="No orders yet"
            description="Looks like you haven't placed any orders yet. Start exploring our delicious menu and place your first order!"
            buttonLabel="Browse Menu"
            onButtonPress={() => router.push('/')}
          />
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrder}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#E25C3D" />
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}
