/**
 * Customer Profile Screen
 * User profile, settings, and account management
 */

import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { ScreenContainer } from '@/components/screen-container';
import { supabase } from '@/lib/supabase-service';
import { useEffect, useState } from 'react';

export default function ProfileScreen() {
  const router = useRouter();
  const { state, signOut } = useAuth();
  const user = state.user;
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [isLoadingPoints, setIsLoadingPoints] = useState(true);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('users')
        .select('points_balance')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setPointsBalance(data?.points_balance ?? 0);
          setIsLoadingPoints(false);
        });
    }
  }, [user?.id]);

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

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {/* Profile Header */}
          <View className="bg-surface rounded-2xl p-6 mb-4 items-center border border-border">
            <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3">
              <Text className="text-4xl">👤</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground mb-1">{user?.name || 'Guest'}</Text>
            {user?.email && <Text className="text-muted text-sm">{user.email.replace('@chakna.app', '')}</Text>}
            {user?.phone && <Text className="text-muted text-sm mb-4">{user.phone}</Text>}
            
            <TouchableOpacity 
              onPress={() => router.push('/(customer)/edit-profile')}
              className="bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mt-2"
            >
              <Text className="text-primary font-bold text-xs">Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Points Balance Card */}
          <TouchableOpacity
            className="bg-primary rounded-2xl px-5 py-4 mb-6 flex-row items-center justify-between"
            onPress={() => router.push('/(customer)/rewards')}
          >
            <View>
              <Text className="text-white/70 text-xs mb-1">Points Balance</Text>
              {isLoadingPoints ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white text-2xl font-bold">{pointsBalance ?? 0} pts</Text>
              )}
            </View>
            <View className="items-end">
              <Text className="text-white text-2xl">🏆</Text>
              <Text className="text-white/70 text-xs mt-1">View Rewards →</Text>
            </View>
          </TouchableOpacity>

          {/* Menu Items */}
          <View className="gap-2 mb-6">
            <ProfileMenuItem icon="📋" label="Order History" onPress={() => router.push('/orders')} />
            <ProfileMenuItem icon="📍" label="Delivery Addresses" onPress={() => router.push('/(customer)/addresses')} />
            <ProfileMenuItem icon="🎟️" label="Coupons & Rewards" onPress={() => router.push('/(customer)/rewards')} />
            <ProfileMenuItem icon="⭐" label="Referral Program" onPress={() => router.push('/(customer)/referral')} />
            <ProfileMenuItem icon="🔔" label="Notifications" onPress={() => router.push('/(customer)/notifications')} />
            <ProfileMenuItem icon="⚙️" label="Settings" onPress={() => router.push('/(customer)/settings')} />
            <ProfileMenuItem icon="❓" label="Help & Support" onPress={() => router.push('/(customer)/help')} />
            <ProfileMenuItem icon="⚖️" label="Terms of Service" onPress={() => router.push('/(customer)/terms')} />
            <ProfileMenuItem icon="🛡️" label="Privacy Policy" onPress={() => router.push('/(customer)/privacy')} />
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
            <Text className="text-muted text-xs">Chakna Store v1.0.0</Text>
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
      className="bg-surface rounded-xl px-4 py-3 flex-row items-center justify-between border border-border active:opacity-70"
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
