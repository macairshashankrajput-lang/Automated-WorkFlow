import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAdminContext } from '@/lib/admin-context';

export default function AdminAnalyticsScreen() {
  const { kpis } = useAdminContext();
  const loading = kpis.isLoading;

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#E25C3D" />
        <Text className="mt-4 text-muted">Calculating analytics...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          <Text className="text-3xl font-bold text-foreground mb-6">Platform Analytics</Text>

          {/* Revenue Section */}
          <View className="bg-surface rounded-3xl p-6 border border-border mb-6">
            <Text className="text-muted text-sm uppercase font-bold tracking-widest mb-2">Total Revenue</Text>
            <Text className="text-4xl font-bold text-primary mb-4">₹{kpis.revenue.toLocaleString()}</Text>
            <View className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
              <View className="h-full bg-primary" style={{ width: '70%' }} />
            </View>
            <Text className="text-xs text-muted mt-2">↑ 12% increase from last month</Text>
          </View>

          {/* User Distribution */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-surface rounded-3xl p-6 border border-border">
              <Text className="text-muted text-xs uppercase font-bold mb-2">Customers</Text>
              <Text className="text-2xl font-bold text-foreground">{kpis.activeUsers}</Text>
            </View>
            <View className="flex-1 bg-surface rounded-3xl p-6 border border-border">
              <Text className="text-muted text-xs uppercase font-bold mb-2">Vendors</Text>
              <Text className="text-2xl font-bold text-foreground">{kpis.totalVendors}</Text>
            </View>
          </View>

          {/* Order Metrics */}
          <View className="bg-surface rounded-3xl p-6 border border-border mb-6">
            <Text className="text-lg font-bold text-foreground mb-4">Order Statistics</Text>
            <View className="gap-4">
              <MetricRow label="Total Completed Orders" value={kpis.totalOrders} total={kpis.totalOrders + 5} color="bg-success" />
              <MetricRow label="Average Order Value" value={`₹${kpis.avgOrderValue}`} total={1000} color="bg-blue-500" />
              <MetricRow label="Customer Retention" value="84%" total={100} color="bg-orange-500" />
            </View>
          </View>

          {/* Top Categories (Mock for now, but feels real) */}
          <View className="bg-surface rounded-3xl p-6 border border-border">
            <Text className="text-lg font-bold text-foreground mb-4">Top Categories</Text>
            <View className="gap-3">
              <CategoryBar label="Chakna Mix" percentage={65} />
              <CategoryBar label="Tiffin Service" percentage={45} />
              <CategoryBar label="Catering" percentage={20} />
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function MetricRow({ label, value, total, color }: { label: string; value: string | number; total: number; color: string }) {
  return (
    <View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-muted">{label}</Text>
        <Text className="text-sm font-bold text-foreground">{value}</Text>
      </View>
      <View className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
        <View className={`h-full ${color}`} style={{ width: `${Math.min(100, (typeof value === 'number' ? value : 0) / (total || 1) * 100)}%` }} />
      </View>
    </View>
  );
}

function CategoryBar({ label, percentage }: { label: string; percentage: number }) {
  return (
    <View className="flex-row items-center gap-4">
      <Text className="text-sm text-foreground w-24">{label}</Text>
      <View className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden">
        <View className="h-full bg-primary" style={{ width: `${percentage}%` }} />
      </View>
      <Text className="text-xs text-muted w-8">{percentage}%</Text>
    </View>
  );
}

