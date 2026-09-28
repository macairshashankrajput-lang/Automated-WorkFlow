/**
 * Admin Layout Shell
 * Provides centralized admin state and responsive navigation.
 */

import { Slot, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/lib/auth-context';
import { AdminProvider, useAdminContext } from '@/lib/admin-context';

const adminNavItems = [
  { label: 'Overview', route: './', icon: 'house.fill' },
  { label: 'Order Management', route: './orders', icon: 'cart.fill' },
  { label: 'Menu Management', route: './menu', icon: 'fork.knife' },
  { label: 'Vendor Management', route: './manage/vendors', icon: 'building.2.fill' },
  { label: 'Reviews', route: './reviews', icon: 'star.fill' },
  { label: 'Notifications', route: './manage/notifications', icon: 'bell.fill' },
  { label: 'Export', route: './manage/export', icon: 'square.and.arrow.up' },
  { label: 'Catering', route: './manage/catering', icon: 'leaf.fill' },
  { label: 'Reminders', route: './manage/reminders', icon: 'bell.badge.fill' },
  { label: 'Analytics', route: './manage/analytics', icon: 'chart.bar.fill' },
  { label: 'Profile', route: './profile', icon: 'person.fill' },
];

function AdminShell() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { kpis, pendingReviewsCount } = useAdminContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isWide = width >= 768;

  const handleNavigate = (route: string) => {
    setDrawerOpen(false);
    router.push(route as any);
  };

  const navigationPanel = (
    <ScrollView
      contentContainerStyle={{ padding: 20 }}
      className={`${isWide ? 'w-80 border-r border-border bg-surface' : 'w-full bg-surface'} flex-none`}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-2xl font-bold text-foreground mb-3">Admin Panel</Text>
      <Text className="text-sm text-muted mb-6">Centralized control for vendors, menu, orders, and reviews.</Text>

      <View className="space-y-2">
        {adminNavItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            className="flex-row items-center gap-3 rounded-3xl border border-border bg-background px-4 py-3"
            onPress={() => handleNavigate(item.route)}
            activeOpacity={0.8}
          >
            <IconSymbol name={item.icon as any} size={20} color="#2563eb" />
            <Text className="text-sm font-semibold text-foreground">{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="mt-8 rounded-3xl border border-border bg-background p-4">
        <Text className="text-base font-semibold text-foreground mb-3">KPI Summary</Text>
        <View className="space-y-3">
          <View className="rounded-3xl bg-surface p-3">
            <Text className="text-xs text-muted">Orders</Text>
            <Text className="text-lg font-bold text-foreground">{kpis.totalOrders}</Text>
          </View>
          <View className="rounded-3xl bg-surface p-3">
            <Text className="text-xs text-muted">Revenue</Text>
            <Text className="text-lg font-bold text-foreground">₹{kpis.revenue.toLocaleString()}</Text>
          </View>
          <View className="rounded-3xl bg-surface p-3">
            <Text className="text-xs text-muted">Active Users</Text>
            <Text className="text-lg font-bold text-foreground">{kpis.activeUsers}</Text>
          </View>
          <View className="rounded-3xl bg-surface p-3 flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-muted">Pending Reviews</Text>
              <Text className="text-lg font-bold text-foreground">{pendingReviewsCount}</Text>
            </View>
            <IconSymbol name="star.fill" size={22} color="#f59e0b" />
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View className="flex-1 bg-background">
      {!isWide && (
        <View className="flex-row items-center justify-between border-b border-border bg-surface px-4 py-3">
          <View>
            <Text className="text-lg font-bold text-foreground">Admin</Text>
            <Text className="text-sm text-muted">Tap the menu button to navigate.</Text>
          </View>
          <TouchableOpacity
            className="rounded-full bg-primary/10 px-4 py-2"
            onPress={() => setDrawerOpen((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text className="text-primary font-semibold">{drawerOpen ? 'Close' : 'Menu'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View className={`${isWide ? 'flex-row' : 'flex-1'} flex-1`}>
        {isWide && navigationPanel}

        <View className="flex-1 bg-background">
          <Slot />
          
          {/* Mobile Drawer Overlay */}
          {!isWide && drawerOpen && (
            <View className="absolute inset-0 z-20 flex-row">
              <Pressable
                className="flex-1 bg-black/40"
                onPress={() => setDrawerOpen(false)}
              />
              <View className="w-64 border-l border-border bg-surface shadow-xl">
                {navigationPanel}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function AdminLayout() {
  const router = useRouter();
  const { state } = useAuth();

  useEffect(() => {
    if (!state.user || state.user.role !== 'admin') {
      router.replace('/login');
    }
  }, [router, state.user]);

  if (!state.user || state.user.role !== 'admin') {
    return null;
  }

  return (
    <AdminProvider>
      <AdminShell />
    </AdminProvider>
  );
}
