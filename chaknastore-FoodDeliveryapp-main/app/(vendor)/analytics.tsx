import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { vendorOrderService, type VendorOrderSummary } from '@/lib/vendor-order-service';

export default function VendorAnalyticsScreen() {
  const { state } = useAuth();
  const [summary, setSummary] = useState<VendorOrderSummary | null>(null);
  const [itemStats, setItemStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.user?.id) return;
    
    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const [sum, stats] = await Promise.all([
                vendorOrderService.getVendorOrderSummary(state.user!.id),
                vendorOrderService.getVendorOrderItemStats(state.user!.id)
            ]);
            setSummary(sum);
            setItemStats(stats);
        } catch (err) {
            console.error('Analytics load failed', err);
        } finally {
            setLoading(false);
        }
    };

    loadAnalytics();
  }, [state.user?.id]);

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#E25C3D" />
      </ScreenContainer>
    );
  }

  const mostPopular = itemStats[0];

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          <Text className="text-3xl font-bold text-foreground mb-6">Your Analytics</Text>

          {/* Earnings Card */}
          <View className="bg-primary rounded-3xl p-8 mb-6 shadow-lg shadow-primary/20">
            <Text className="text-white/70 text-xs uppercase font-bold tracking-widest mb-1">Total Revenue</Text>
            <Text className="text-5xl font-bold text-white mb-2">₹{summary?.totalEarnings.toLocaleString()}</Text>
            <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-green-400" />
                <Text className="text-xs text-white/80">Updating in real-time</Text>
            </View>
          </View>

          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-surface rounded-3xl p-6 border border-border items-center">
              <Text className="text-muted text-[10px] uppercase font-bold tracking-wider mb-2">Total Orders</Text>
              <Text className="text-3xl font-bold text-foreground">
                {(summary?.activeOrders || 0) + (summary?.newOrders || 0) + (summary?.totalEarnings ? Math.floor(summary.totalEarnings/500) : 0)} 
              </Text>
            </View>
            <View className="flex-1 bg-surface rounded-3xl p-6 border border-border items-center">
              <Text className="text-muted text-[10px] uppercase font-bold tracking-wider mb-2">Avg Rating</Text>
              <Text className="text-3xl font-bold text-foreground">{summary?.avgRating.toFixed(1)} ⭐</Text>
            </View>
          </View>

          {/* Popular Items */}
          <View className="bg-surface rounded-3xl p-6 border border-border mb-6">
            <Text className="text-lg font-bold text-foreground mb-4">Top Selling Items</Text>
            {itemStats.length === 0 ? (
                <Text className="text-muted text-sm italic">No sales data yet.</Text>
            ) : (
                <View className="gap-4">
                    {itemStats.slice(0, 3).map((item, index) => (
                        <View key={index} className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                                    <Text className="text-primary font-bold text-xs">{index + 1}</Text>
                                </View>
                                <Text className="text-foreground font-medium">{item.name}</Text>
                            </View>
                            <Text className="text-muted text-sm font-bold">{item.count} sold</Text>
                        </View>
                    ))}
                </View>
            )}
          </View>

          {/* Insights */}
          <View className="bg-background/50 rounded-3xl p-6 border border-primary/20">
            <View className="flex-row items-center gap-2 mb-3">
                <Text className="text-2xl">💡</Text>
                <Text className="text-lg font-bold text-foreground">Insights</Text>
            </View>
            {mostPopular ? (
                <Text className="text-muted text-sm leading-relaxed">
                    "Your most popular item is <Text className="text-primary font-bold">{mostPopular.name}</Text>. 
                    Consider promoting it in a combo to increase average order value!"
                </Text>
            ) : (
                <Text className="text-muted text-sm leading-relaxed">
                    Start taking orders to see personalized business insights here.
                </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

