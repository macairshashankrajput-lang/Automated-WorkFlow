/**
 * Customer Home Screen
 * Main entry point for customers with service selection
 */


import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { menuService } from '@/lib/supabase-service';

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
}

const services: ServiceCard[] = [
  {
    id: 'chakna',
    title: 'The Chakna',
    description: 'Browse menu, add to cart, place order',
    emoji: '🍿',
    color: 'bg-orange-500/10',
  },
  {
    id: 'catering',
    title: 'Catering',
    description: 'Event planning and bulk orders',
    emoji: '🍽️',
    color: 'bg-blue-500/10',
  },
  {
    id: 'tiffin',
    title: 'Tiffin System',
    description: 'Monthly subscription + points wallet',
    emoji: '🥡',
    color: 'bg-emerald-500/10',
  },
];

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { state } = useAuth();
  const isMock = menuService.isMockMode();

  const handleServicePress = (serviceId: string) => {
    switch (serviceId) {
      case 'chakna':
        router.push('/chakna-store');
        break;
      case 'catering':
        router.push('/catering');
        break;
      case 'tiffin':
        router.push('/tiffin');
        break;
    }
  };

  const quickActions = [
    { label: 'Orders', icon: '🔍', route: './orders', description: 'Track your orders' },
    { label: 'Favorites', icon: '⭐', route: './favorites', description: 'Saved dishes' },
    { label: 'Coupons', icon: '🎟️', route: './profile', description: 'Offers & rewards' },
  ] as const;

  const navigateToRoute = (route: string) => {
    router.push(route as any);
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {/* Mock Mode Indicator */}
          {isMock && (
            <View className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mb-6 flex-row items-center gap-3">
              <Text className="text-xl">⚠️</Text>
              <View className="flex-1">
                <Text className="text-orange-600 font-bold text-xs uppercase tracking-widest">Offline Mode</Text>
                <Text className="text-orange-500 text-xs">Using local catalog. Changes won't sync.</Text>
              </View>
            </View>
          )}

          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-foreground mb-2">
              Hello, {state.user?.name?.split(' ')[0] || 'Guest'}! 👋
            </Text>
            <Text className="text-base text-muted">What would you like to order today?</Text>
          </View>

          {/* Location Card */}
          <View className="bg-primary/10 border border-primary rounded-lg px-4 py-3 mb-6 flex-row items-center gap-3">
            <Text className="text-2xl">📍</Text>
            <View className="flex-1">
              <Text className="text-xs text-muted">Delivery Location</Text>
              <Text className="text-sm font-semibold text-foreground">Current Location</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('./profile')}>
              <Text className="text-primary font-semibold text-sm">Change</Text>
            </TouchableOpacity>
          </View>

          {/* Service Cards */}
          <View className="gap-4 mb-8">
            {services.map(service => (
              <TouchableOpacity
                key={service.id}
                className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                onPress={() => handleServicePress(service.id)}
              >
                <View className="flex-row items-start gap-4">
                  {/* Icon */}
                  <View className="w-16 h-16 rounded-xl bg-primary/10 items-center justify-center">
                    <Text className="text-3xl">{service.emoji}</Text>
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-foreground mb-1">
                      {service.title}
                    </Text>
                    <Text className="text-sm text-muted leading-relaxed">
                      {service.description}
                    </Text>
                  </View>

                  {/* Arrow */}
                  <Text className="text-2xl">→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-3">Quick Actions</Text>
            <View className="flex-row gap-3">
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  className="flex-1 bg-surface rounded-lg py-3 px-4 items-center border border-border active:opacity-70"
                  onPress={() => navigateToRoute(action.route)}
                >
                  <Text className="text-2xl mb-1">{action.icon}</Text>
                  <Text className="text-xs font-semibold text-foreground text-center">{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Promotional Banner */}
          <View className="bg-primary rounded-2xl p-4 overflow-hidden mb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white font-bold text-lg mb-1">Special Offer</Text>
                <Text className="text-white/90 text-sm">Get 20% off on your first order</Text>
              </View>
              <Text className="text-4xl">🎉</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
