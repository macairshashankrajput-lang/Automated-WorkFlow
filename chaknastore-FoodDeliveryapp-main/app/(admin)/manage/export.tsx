import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAdminContext } from '@/lib/admin-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AdminExportScreen() {
  const { kpis } = useAdminContext();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = (type: string) => {
    setIsExporting(type);
    // Simulate export delay
    setTimeout(() => {
      setIsExporting(null);
      Alert.alert('Export Successful', `${type} data has been exported to CSV.`);
    }, 2000);
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Export Data</Text>
          <Text className="text-muted text-sm mb-6">Download your platform data for offline analysis.</Text>

          <View className="gap-4">
            <ExportCard
              title="Customer Database"
              description={`${kpis.activeUsers} active customers`}
              icon="person.2.fill"
              onPress={() => handleExport('Customers')}
              loading={isExporting === 'Customers'}
            />
            <ExportCard
              title="Order History"
              description={`${kpis.totalOrders} total orders`}
              icon="cart.fill"
              onPress={() => handleExport('Orders')}
              loading={isExporting === 'Orders'}
            />
            <ExportCard
              title="Financial Report"
              description={`Total revenue: ₹${kpis.revenue.toLocaleString()}`}
              icon="creditcard.fill"
              onPress={() => handleExport('Financial')}
              loading={isExporting === 'Financial'}
            />
            <ExportCard
              title="Vendor List"
              description={`${kpis.totalVendors} active vendors`}
              icon="briefcase.fill"
              onPress={() => handleExport('Vendors')}
              loading={isExporting === 'Vendors'}
            />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function ExportCard({ title, description, icon, onPress, loading }: { title: string; description: string; icon: string; onPress: () => void; loading: boolean }) {
  return (
    <TouchableOpacity
      className="bg-surface rounded-3xl p-6 border border-border flex-row items-center gap-4 active:opacity-80"
      onPress={onPress}
      disabled={loading}
    >
      <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center">
        <IconSymbol name={icon as any} size={24} color="#2563eb" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-foreground">{title}</Text>
        <Text className="text-sm text-muted">{description}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color="#2563eb" />
      ) : (
        <IconSymbol name="chevron.right" size={20} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );
}
