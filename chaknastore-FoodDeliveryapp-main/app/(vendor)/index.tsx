import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { vendorOrderService, type VendorOrderSummary } from '@/lib/vendor-order-service';

export default function VendorDashboardScreen() {
  const router = useRouter();
  const { state } = useAuth();
  const [summary, setSummary] = useState<VendorOrderSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!state.user?.id) return;
    const vendorId = state.user.id;

    const loadData = async () => {
      try {
        const sum = await vendorOrderService.getVendorOrderSummary(vendorId);
        setSummary(sum);
        const orders = await vendorOrderService.getVendorOrders(vendorId);
        setRecentOrders(orders.slice(0, 3)); // Only show top 3
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const unsubscribe = vendorOrderService.subscribeToVendorOrders(vendorId, (orders) => {
      setRecentOrders(orders.slice(0, 3));
      // Re-fetch summary quietly
      vendorOrderService.getVendorOrderSummary(vendorId).then(setSummary).catch(console.error);
    });

    return () => unsubscribe();
  }, [state.user?.id]);

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#E25C3D" />
      </ScreenContainer>
    );
  }

  const kpiCards = summary ? [
    { label: 'New Orders', value: summary.newOrders.toString(), icon: 'box', color: 'bg-blue-100' },
    { label: 'Active Orders', value: summary.activeOrders.toString(), icon: 'truck', color: 'bg-orange-100' },
    { label: 'Earnings', value: `₹${summary.totalEarnings}`, icon: 'rupee', color: 'bg-green-100' },
    { label: 'Rating', value: summary.avgRating.toFixed(1), icon: 'star', color: 'bg-yellow-100' },
  ] : [];

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-foreground mb-1">
                Welcome, {state.user?.name?.split(' ')[0] || 'Vendor'}
              </Text>
              <Text className="text-muted text-sm">{state.user?.businessName || 'Vendor Dashboard'}</Text>
            </View>
            <TouchableOpacity className="bg-success rounded-full px-4 py-2">
              <Text className="text-white font-semibold text-sm">Online</Text>
            </TouchableOpacity>
          </View>

          <View className="gap-3 mb-8">
            {kpiCards.map((card, index) => (
              <View
                key={index}
                className="bg-surface rounded-lg p-4 border border-border flex-row items-center justify-between"
              >
                <View className="flex-1">
                  <Text className="text-muted text-sm mb-1">{card.label}</Text>
                  <Text className="text-2xl font-bold text-foreground">{card.value}</Text>
                </View>
                <Text className="text-3xl">{card.icon}</Text>
              </View>
            ))}
          </View>

          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-3">Quick Actions</Text>
            <View className="gap-2">
              <QuickActionButton icon="list" label="View Orders" onPress={() => router.push('./orders')} />
              <QuickActionButton icon="calendar" label="Tiffin Schedule" onPress={() => router.push('./tiffin')} />
              <QuickActionButton icon="chart" label="Analytics" onPress={() => router.push('./analytics')} />
              <QuickActionButton icon="settings" label="Settings" onPress={() => router.push('./profile')} />
            </View>
          </View>

          <View>
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-bold text-foreground">Recent Orders</Text>
                <TouchableOpacity onPress={() => router.push('./orders')}>
                    <Text className="text-primary font-semibold text-sm">See all</Text>
                </TouchableOpacity>
            </View>
            
            {recentOrders.length === 0 ? (
                <View className="bg-surface rounded-lg p-4 border border-border items-center justify-center py-8">
                <Text className="text-4xl mb-2">📭</Text>
                <Text className="text-muted text-sm">No recent orders</Text>
                </View>
            ) : (
                recentOrders.map(order => (
                    <View key={order.id} className="bg-surface rounded-lg p-4 border border-border mb-3 flex-row justify-between items-center">
                        <View>
                            <Text className="font-semibold text-foreground">Order #{order.id}</Text>
                            <Text className="text-sm text-muted">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • ₹{order.totalPrice}</Text>
                        </View>
                        <View className="bg-primary/10 px-3 py-1 rounded-full">
                            <Text className="text-primary text-xs font-semibold capitalize">{order.status}</Text>
                        </View>
                    </View>
                ))
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

interface QuickActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
}

function QuickActionButton({ icon, label, onPress }: QuickActionButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} className="bg-surface rounded-lg px-4 py-3 flex-row items-center gap-3 border border-border active:opacity-70">
      <Text className="text-2xl">{icon}</Text>
      <Text className="text-foreground font-semibold flex-1">{label}</Text>
      <Text className="text-muted">›</Text>
    </TouchableOpacity>
  );
}
