/**
 * Vendor Profile Screen
 * Vendor account and settings
 */

import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { ScreenContainer } from '@/components/screen-container';

export default function VendorProfileScreen() {
  const router = useRouter();
  const { state, signOut } = useAuth();
  const user = state.user;

  const [isOnline, setIsOnline] = useState(true);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await signOut();
        },
        style: 'destructive',
      },
    ]);
  };

  const toggleShopStatus = () => {
    setIsOnline(!isOnline);
    Alert.alert('Shop Status', `Your shop is now ${!isOnline ? 'Online' : 'Offline'}`);
    // In a real app, update the 'users' table or a 'vendors' table status field
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {/* Profile Header */}
          <View className="bg-surface rounded-2xl p-6 mb-6 items-center border border-border">
            <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-4">
              <Text className="text-4xl">👨‍💼</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground mb-1">{user?.name || 'Vendor'}</Text>
            <Text className="text-muted text-sm mb-4">{user?.businessName || 'Chakna Shop'}</Text>
            
            <TouchableOpacity 
              onPress={toggleShopStatus}
              className={`flex-row items-center gap-2 px-6 py-2 rounded-full border ${isOnline ? 'bg-success/10 border-success' : 'bg-muted/10 border-muted'}`}
            >
              <View className={`w-3 h-3 rounded-full ${isOnline ? 'bg-success' : 'bg-muted'}`} />
              <Text className={`font-bold ${isOnline ? 'text-success' : 'text-muted'}`}>
                {isOnline ? 'OPEN' : 'CLOSED'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/(vendor)/edit-profile')}
              className="bg-primary/10 border border-primary/20 rounded-full px-6 py-2 mt-4"
            >
              <Text className="text-primary font-bold text-xs">Edit Business Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View className="gap-2 mb-6">
            <ProfileMenuItem icon="📊" label="Analytics" onPress={() => router.push('./analytics')} />
            <ProfileMenuItem icon="📋" label="Active Orders" onPress={() => router.push('./orders')} />
            <ProfileMenuItem icon="🍽️" label="Menu Management" onPress={() => router.push('./menu')} />
            <ProfileMenuItem icon="⭐" label="Ratings & Reviews" onPress={() => Alert.alert('Reviews', 'Customer reviews for your shop.')} />
            <ProfileMenuItem icon="🔔" label="Notifications" onPress={() => Alert.alert('Notifications', 'Notification settings.')} />
            <ProfileMenuItem icon="⚙️" label="Settings" onPress={() => Alert.alert('Settings', 'Vendor settings.')} />
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            className="w-full bg-error/10 border border-error rounded-xl py-4 items-center"
            onPress={handleLogout}
          >
            <Text className="text-error font-bold text-base">Logout</Text>
          </TouchableOpacity>

          {/* App Version */}
          <View className="mt-6 items-center">
            <Text className="text-muted text-xs">Chakna Store Vendor v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

interface ProfileMenuItemProps {
  icon: string;
  label: string;
  onPress?: () => void;
}

function ProfileMenuItem({ icon, label, onPress }: ProfileMenuItemProps) {
  return (
    <TouchableOpacity 
      className="bg-surface rounded-lg px-4 py-3 flex-row items-center justify-between border border-border active:opacity-70"
      onPress={onPress}
    >
      <View className="flex-row items-center gap-3">
        <Text className="text-2xl">{icon}</Text>
        <Text className="text-foreground font-semibold">{label}</Text>
      </View>
      <Text className="text-muted text-lg">→</Text>
    </TouchableOpacity>
  );
}
