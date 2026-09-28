/**
 * Admin Profile Screen
 * Admin account and settings
 */

import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AdminProfileScreen() {
  const router = useRouter();
  const { state, signOut } = useAuth();
  const user = state.user;

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
          <View className="bg-surface rounded-3xl border border-border p-6 mb-6">
            <View className="flex-row items-center gap-4 mb-4">
              <View className="w-20 h-20 rounded-full bg-primary items-center justify-center">
                <IconSymbol name="person.circle.fill" size={36} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground">{user?.name || 'Admin'}</Text>
                <Text className="text-muted text-sm mt-1">{user?.email}</Text>
                <Text className="text-muted text-sm">{user?.phone}</Text>
              </View>
            </View>
            <Text className="text-muted text-sm">Manage your account, platform access, and support resources from one place.</Text>
          </View>

          <View className="space-y-3 mb-6">
            <ProfileMenuItem icon="👥" label="User Management" onPress={() => router.push('./manage/vendors')} />
            <ProfileMenuItem icon="🏪" label="Vendor Management" onPress={() => router.push('./manage/vendors')} />
            <ProfileMenuItem icon="📊" label="Platform Analytics" onPress={() => router.push('./manage/analytics')} />
            <ProfileMenuItem icon="⚙️" label="System Settings" onPress={() => router.push('./manage/settings')} />
            <ProfileMenuItem icon="🔐" label="Security" onPress={() => router.push({ pathname: './manage/info', params: { type: 'security' } })} />
            <ProfileMenuItem icon="❓" label="Help & Support" onPress={() => router.push({ pathname: './manage/info', params: { type: 'support' } })} />
          </View>

          <TouchableOpacity
            className="w-full bg-error rounded-3xl py-4 items-center"
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text className="text-background font-bold text-base">Logout</Text>
          </TouchableOpacity>

          <View className="mt-6 items-center">
            <Text className="text-muted text-xs">Chakna Store Admin v1.0.0</Text>
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
      className="bg-surface rounded-3xl px-4 py-4 flex-row items-center justify-between border border-border active:opacity-80"
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View className="flex-row items-center gap-3">
        <Text className="text-2xl">{icon}</Text>
        <Text className="text-foreground font-semibold">{label}</Text>
      </View>
      <IconSymbol name="chevron.right" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
}
