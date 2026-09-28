import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { chatService } from '@/lib/supabase-service';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ChatScreen() {
  const { vendorId } = useLocalSearchParams<{ vendorId: string }>();
  const { state } = useAuth();
  const router = useRouter();
  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!state.user?.id || !vendorId) return;

    const initChat = async () => {
      try {
        // Determine role to correctly identify customer and vendor IDs
        let customerId, targetVendorId;
        if (state.user?.role === 'vendor') {
          customerId = vendorId; // In vendor panel, the param 'vendorId' is actually the customer's ID
          targetVendorId = state.user.id;
        } else {
          customerId = state.user?.id;
          targetVendorId = vendorId;
        }

        const chatData = await chatService.getOrCreateChat(customerId, targetVendorId);
        setChat(chatData);
        const msgs = await chatService.getMessages(chatData.id);
        setMessages(msgs || []);
        
        // Subscribe to real-time updates
        const unsubscribe = chatService.subscribeToMessages(chatData.id, (msg) => {
          // Prevent duplicate messages if the insert trigger also sends a real-time event
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        });

        return unsubscribe;
      } catch (error) {
        console.error('Failed to init chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    let unsubscribe: any;
    initChat().then(unsub => { unsubscribe = unsub; });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [vendorId, state.user?.id, state.user?.role]);

  const handleSend = async () => {
    if (!newMessage.trim() || !chat || !state.user?.id) return;

    const content = newMessage.trim();
    setNewMessage('');
    try {
      await chatService.sendMessage(chat.id, state.user.id, content);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === state.user?.id;
    return (
      <View className={`mb-3 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
        <View className={`rounded-2xl px-4 py-2 ${isMe ? 'bg-primary' : 'bg-surface border border-border'}`}>
          <Text className={isMe ? 'text-white' : 'text-foreground'}>{item.content}</Text>
        </View>
        <Text className="text-[10px] text-muted mt-1 px-1">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
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
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center py-4 border-b border-border mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <IconSymbol name="chevron.left" size={24} color="#E25C3D" />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-bold text-foreground">
              {state.user?.role === 'vendor' ? (chat?.customer?.name || 'Customer') : (chat?.vendor?.business_name || chat?.vendor?.name || 'Vendor')}
            </Text>
            <Text className="text-xs text-muted">Real-time Messaging</Text>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          className="pb-4"
        >
          <View className="flex-row items-center gap-2">
            <TextInput
              className="flex-1 bg-surface border border-border rounded-full px-4 py-3 text-foreground"
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity
              onPress={handleSend}
              className="w-12 h-12 bg-primary rounded-full items-center justify-center"
              activeOpacity={0.8}
            >
              <Text className="text-white text-lg">Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ScreenContainer>
  );
}
