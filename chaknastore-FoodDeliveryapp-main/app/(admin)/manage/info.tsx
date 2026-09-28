import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AdminInfoScreen() {
  const { type } = useLocalSearchParams<{ type: 'security' | 'support' }>();
  const router = useRouter();

  const isSecurity = type === 'security';

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <IconSymbol name="chevron.left" size={24} color="#2563eb" />
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground">
              {isSecurity ? 'Security & Privacy' : 'Help & Support'}
            </Text>
          </View>

          {isSecurity ? (
            <View className="gap-6">
              <InfoCard
                title="Account Security"
                description="Your admin account is protected by Supabase Auth with encrypted sessions."
                icon="lock.fill"
              />
              <InfoCard
                title="Data Privacy"
                description="Platform data is stored in a secure PostgreSQL database with Row Level Security (RLS) enabled."
                icon="shield.fill"
              />
              <InfoCard
                title="Audit Logs"
                description="All administrative actions are logged for security and compliance."
                icon="list.bullet.rectangle.fill"
              />
            </View>
          ) : (
            <View className="gap-6">
              <InfoCard
                title="Contact Support"
                description="Email us at support@chaknastore.app for technical assistance."
                icon="envelope.fill"
                onPress={() => Linking.openURL('mailto:support@chaknastore.app')}
              />
              <InfoCard
                title="Documentation"
                description="Read our platform guides and operational procedures."
                icon="doc.text.fill"
              />
              <InfoCard
                title="FAQs"
                description="Find quick answers to common questions about vendor management."
                icon="questionmark.circle.fill"
              />
            </View>
          )}

          <View className="mt-8 p-6 bg-surface rounded-3xl border border-border items-center">
            <Text className="text-muted text-xs">Version 1.0.0 (Production Build)</Text>
            <Text className="text-muted text-[10px] mt-1">© 2026 Chakna Store App</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoCard({ title, description, icon, onPress }: { title: string; description: string; icon: string; onPress?: () => void }) {
  return (
    <TouchableOpacity
      className="bg-surface rounded-3xl p-6 border border-border flex-row items-start gap-4 active:opacity-80"
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center">
        <IconSymbol name={icon as any} size={24} color="#2563eb" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-foreground mb-1">{title}</Text>
        <Text className="text-sm text-muted leading-relaxed">{description}</Text>
      </View>
    </TouchableOpacity>
  );
}
