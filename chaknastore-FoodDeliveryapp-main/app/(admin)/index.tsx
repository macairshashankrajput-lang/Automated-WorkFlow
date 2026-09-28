/**
 * Admin Dashboard Screen
 * Overview of platform metrics and management options
 */

import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { useAdminContext } from '@/lib/admin-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  isLoading?: boolean;
}

function StatCard({ label, value, icon, isLoading = false }: StatCardProps) {
  return (
    <View className="bg-surface rounded-3xl border border-border p-4" style={{ width: '48%' }}>
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-muted text-sm">{label}</Text>
          <Text className="text-2xl font-bold text-foreground mt-3">
            {isLoading ? <ActivityIndicator size="small" color="#2563eb" /> : value}
          </Text>
        </View>
        <Text className="text-3xl">{icon}</Text>
      </View>
    </View>
  );
}

interface ActionButtonProps {
  label: string;
  icon: string;
  onPress: () => void;
}

function ActionButton({ label, icon, onPress }: ActionButtonProps) {
  return (
    <TouchableOpacity
      className="bg-surface rounded-3xl border border-border px-4 py-3 flex-row items-center justify-between"
      style={{ width: '48%' }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View className="flex-row items-center gap-3">
        <Text className="text-xl">{icon}</Text>
        <Text className="text-foreground font-semibold">{label}</Text>
      </View>
      <Text className="text-muted">→</Text>
    </TouchableOpacity>
  );
}

interface StatusItemProps {
  title: string;
  subtitle: string;
  note: string;
  onPress?: () => void;
}

function StatusItem({ title, subtitle, note, onPress }: StatusItemProps) {
  return (
    <TouchableOpacity
      className="bg-surface rounded-3xl border border-border px-4 py-4"
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
    >
      <Text className="text-foreground font-semibold mb-1">{title}</Text>
      <Text className="text-sm text-muted mb-2">{subtitle}</Text>
      <Text className="text-xs text-muted">{note}</Text>
    </TouchableOpacity>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { state } = useAuth();
  const { kpis, pendingReviewsCount } = useAdminContext();
  const loading = kpis.isLoading;
  const firstName = state.user?.name?.split(' ')[0] ?? 'Admin';

  const stats = [
    { label: 'Total orders', value: loading ? '...' : kpis.totalOrders, icon: '📦', isLoading: loading },
    { label: 'Revenue', value: loading ? '...' : `₹${kpis.revenue.toLocaleString()}`, icon: '💰', isLoading: loading },
    { label: 'Active users', value: loading ? '...' : kpis.activeUsers, icon: '👥', isLoading: loading },
    { label: 'Vendors', value: loading ? '...' : kpis.totalVendors, icon: '🏪', isLoading: loading },
  ];

  const actions = [
    { icon: '🍽️', label: 'Menu Management', path: './menu' },
    { icon: '⭐', label: 'Reviews', path: './reviews' },
    { icon: '🔔', label: 'Notifications', path: './manage/notifications' },
    { icon: '📤', label: 'Customer Export', path: './manage/export' },
  ] as const;

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          <View className="mb-6">
            <Text className="text-3xl font-bold text-foreground">Hello, {firstName}</Text>
            <Text className="text-muted text-sm mt-1">Your admin workspace is ready. Focus on the most important tasks.</Text>
          </View>

          <View className="mb-6 flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">Today's overview</Text>
              <Text className="text-muted text-sm mt-1">Quick access to the metrics that matter.</Text>
            </View>
            <TouchableOpacity
              className="h-12 w-12 rounded-full bg-primary/10 items-center justify-center"
              onPress={() => router.push('./profile')}
              activeOpacity={0.8}
            >
              <IconSymbol name="person.circle.fill" size={24} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap justify-between gap-3 mb-6">
            {stats.map((card, index) => (
              <StatCard key={index} {...card} />
            ))}
          </View>

          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-foreground">Quick actions</Text>
              <Text className="text-sm text-muted">Tap to navigate</Text>
            </View>
            <View className="flex-row flex-wrap justify-between gap-3">
              {actions.map((action) => (
                <ActionButton
                  key={action.label}
                  icon={action.icon}
                  label={action.label}
                  onPress={() => router.push(action.path)}
                />
              ))}
            </View>
          </View>

          <View className="rounded-3xl bg-surface border border-border p-4">
            <Text className="text-base font-semibold text-foreground mb-3">Priority tasks</Text>
            <View className="space-y-3">
              <StatusItem
                title="Pending reviews"
                subtitle={`${pendingReviewsCount} review${pendingReviewsCount === 1 ? '' : 's'} waiting`}
                note="Review customer feedback and approve or respond quickly."
                onPress={() => router.push('./reviews')}
              />
              <StatusItem
                title="Platform health"
                subtitle={loading ? 'Refreshing metrics…' : 'All systems are up to date'}
                note={loading ? 'Please wait while we sync the latest data.' : 'Your dashboard data is refreshed automatically.'}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

export default function AdminDashboardScreen() {
  return <DashboardContent />;
}
