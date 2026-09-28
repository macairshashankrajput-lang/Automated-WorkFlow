import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { chatService } from '@/lib/supabase-service';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function VendorMessagesScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!state.user?.id) {
      setIsLoading(false);
      return;
    }
    const loadChats = async () => {
      try {
        const data = await chatService.getChats(state.user!.id);
        setChats(data || []);
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadChats();
  }, [state.user?.id]);

  const renderChatItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        className="bg-surface rounded-2xl p-4 mb-3 border border-border flex-row items-center gap-4 active:opacity-80"
        onPress={() => router.push({ pathname: '/(customer)/chat/[vendorId]', params: { vendorId: item.customer_id } })}
      >
        <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
          <Text className="text-xl">👤</Text>
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">{item.customer?.name || 'Customer'}</Text>
          <Text className="text-sm text-muted" numberOfLines={1}>{item.last_message || 'No messages yet'}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[10px] text-muted">{new Date(item.updated_at).toLocaleDateString()}</Text>
          <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#E25C3D" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 bg-background">
      <View className="flex-1 px-4 py-6">
        <Text className="text-3xl font-bold text-foreground mb-6">Messages</Text>

        {chats.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-5xl mb-4">💬</Text>
            <Text className="text-lg font-semibold text-foreground">No messages yet</Text>
            <Text className="text-muted text-center">Customer messages will appear here.</Text>
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={item => item.id}
            renderItem={renderChatItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
