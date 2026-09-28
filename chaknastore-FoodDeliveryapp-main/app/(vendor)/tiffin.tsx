import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { vendorOrderService } from '@/lib/vendor-order-service';
import { format, addDays, subDays } from 'date-fns';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function VendorTiffinScreen() {
  const { state } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSchedule = async () => {
    if (!state.user?.id) return;
    try {
      setIsLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const data = await vendorOrderService.getVendorTiffinSchedule(state.user.id, dateStr);
      setSchedule(data);
    } catch (err) {
      console.error('Failed to load tiffin schedule', err);
      Alert.alert('Error', 'Unable to load tiffin schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [selectedDate, state.user?.id]);

  const mealTypeIcons: Record<string, string> = {
    breakfast: '🍳',
    lunch: '🍱',
    dinner: '🍛',
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <View className="flex-1 px-4 py-6">
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Tiffin Management</Text>
          <Text className="text-muted text-sm mt-1">Prepare and deliver recurring meals.</Text>
        </View>

        {/* Date Selector */}
        <View className="flex-row items-center justify-between bg-surface rounded-3xl p-4 border border-border mb-6">
          <TouchableOpacity onPress={() => setSelectedDate(subDays(selectedDate, 1))}>
            <Text className="text-2xl text-primary font-bold">‹</Text>
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-foreground font-bold">{format(selectedDate, 'EEEE')}</Text>
            <Text className="text-muted text-xs">{format(selectedDate, 'MMM do, yyyy')}</Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, 1))}>
            <Text className="text-2xl text-primary font-bold">›</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#E25C3D" />
          </View>
        ) : schedule.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-5xl mb-4">📅</Text>
            <Text className="text-lg font-semibold text-foreground mb-2">No Meals Scheduled</Text>
            <Text className="text-muted text-center">There are no tiffin deliveries for this date.</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-4">
              {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                const meals = schedule.filter(s => s.meal_type === mealType);
                if (meals.length === 0) return null;

                return (
                  <View key={mealType}>
                    <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-3 ml-1">
                      {mealType} ({meals.length})
                    </Text>
                    {meals.map((item) => (
                      <View 
                        key={item.id}
                        className="bg-surface rounded-3xl p-5 border border-border mb-3 shadow-sm"
                      >
                        <View className="flex-row justify-between items-start mb-3">
                          <View className="flex-1">
                            <Text className="text-lg font-bold text-foreground">
                                {item.tiffin_subscriptions?.users?.name || 'Customer'}
                            </Text>
                            <Text className="text-sm text-primary font-semibold">
                                {item.menu?.name || 'Standard Menu'}
                            </Text>
                          </View>
                          <Text className="text-2xl">{mealTypeIcons[mealType]}</Text>
                        </View>

                        <View className="bg-background/50 rounded-2xl p-4 mb-4 border border-border/50">
                            <Text className="text-xs text-muted mb-1">📍 Delivery Address</Text>
                            <Text className="text-sm text-foreground font-medium" numberOfLines={2}>
                                {item.tiffin_subscriptions?.users?.delivery_location?.address || 'N/A'}
                            </Text>
                            <TouchableOpacity className="mt-2" onPress={() => Alert.alert('Call', `Calling ${item.tiffin_subscriptions?.users?.phone}`)}>
                                <Text className="text-xs text-primary font-bold">📞 {item.tiffin_subscriptions?.users?.phone || 'No Phone'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row gap-2">
                            <TouchableOpacity 
                                className={`flex-1 py-3 rounded-2xl items-center ${item.status === 'preparing' ? 'bg-primary/20 border border-primary' : 'bg-primary/10'}`}
                                onPress={async () => {
                                    try {
                                        await vendorOrderService.updateTiffinScheduleStatus(item.id, 'preparing');
                                        loadSchedule();
                                        Alert.alert('Success', 'Meal is now being prepared.');
                                    } catch (err) {
                                        Alert.alert('Error', 'Failed to update status.');
                                    }
                                }}
                                disabled={item.status === 'delivered'}
                            >
                                <Text className="text-primary font-bold text-xs">
                                    {item.status === 'preparing' ? 'Preparing...' : 'Prepare'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                className={`flex-1 py-3 rounded-2xl items-center ${item.status === 'delivered' ? 'bg-success/20 border border-success' : 'bg-success/10'}`}
                                onPress={async () => {
                                    try {
                                        await vendorOrderService.updateTiffinScheduleStatus(item.id, 'delivered');
                                        loadSchedule();
                                        Alert.alert('Success', 'Meal marked as delivered!');
                                    } catch (err) {
                                        Alert.alert('Error', 'Failed to update status.');
                                    }
                                }}
                                disabled={item.status === 'delivered'}
                            >
                                <Text className="text-success font-bold text-xs">
                                    {item.status === 'delivered' ? 'Delivered ✅' : 'Deliver'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}

