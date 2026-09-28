import React from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AdminSettingsScreen() {
  const [emailNotif, setEmailNotif] = React.useState(true);
  const [pushNotif, setPushNotif] = React.useState(true);
  const [autoApprove, setAutoApprove] = React.useState(false);

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          <Text className="text-3xl font-bold text-foreground mb-6">System Settings</Text>

          <View className="bg-surface rounded-3xl border border-border p-6 mb-6">
            <Text className="text-lg font-bold text-foreground mb-4">Notifications</Text>
            <SettingRow
              label="Email Notifications"
              description="Receive daily order summaries"
              value={emailNotif}
              onValueChange={setEmailNotif}
            />
            <SettingRow
              label="Push Notifications"
              description="Real-time alerts for new orders"
              value={pushNotif}
              onValueChange={setPushNotif}
            />
          </View>

          <View className="bg-surface rounded-3xl border border-border p-6 mb-6">
            <Text className="text-lg font-bold text-foreground mb-4">Platform Logic</Text>
            <SettingRow
              label="Auto-approve Vendors"
              description="Enable to skip manual verification"
              value={autoApprove}
              onValueChange={setAutoApprove}
            />
          </View>

          <View className="bg-surface rounded-3xl border border-border p-6">
            <Text className="text-lg font-bold text-foreground mb-4">Danger Zone</Text>
            <TouchableOpacity className="bg-error/10 py-4 rounded-2xl items-center">
              <Text className="text-error font-bold">Clear Platform Cache</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SettingRow({ label, description, value, onValueChange }: { label: string; description: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-1 mr-4">
        <Text className="text-foreground font-semibold">{label}</Text>
        <Text className="text-muted text-xs">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#d1d5db', true: '#2563eb' }}
        thumbColor="#ffffff"
      />
    </View>
  );
}
