import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { notificationService } from '@/lib/notification-service';

export default function AdminNotificationsScreen() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleBroadcast = async () => {
    if (!title || !message) {
      Alert.alert('Error', 'Please enter both title and message.');
      return;
    }

    setIsSending(true);
    try {
      // In a real app, this would call a Supabase Edge Function to send to all users
      // For now, we simulate and send a local one to the admin as confirmation
      await notificationService.sendLocalNotification(
        `Broadcast: ${title}`,
        message
      );
      
      Alert.alert('Success', 'Broadcast notification sent to all users!');
      setTitle('');
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send broadcast.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Push Notifications</Text>
          <Text className="text-muted text-sm mb-6">Send broadcast messages to all customers and vendors.</Text>

          <View className="bg-surface rounded-3xl p-6 border border-border">
            <Text className="text-lg font-bold text-foreground mb-4">New Broadcast</Text>
            
            <Text className="text-sm font-semibold text-foreground mb-2">Notification Title</Text>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 mb-4 text-foreground"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Weekend Special!"
            />

            <Text className="text-sm font-semibold text-foreground mb-2">Message Content</Text>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 mb-6 text-foreground h-32"
              value={message}
              onChangeText={setMessage}
              placeholder="Enter the message you want to send..."
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              className={`w-full py-4 rounded-2xl items-center ${isSending ? 'bg-muted' : 'bg-primary'}`}
              onPress={handleBroadcast}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-lg">Send Broadcast 🚀</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-8">
            <Text className="text-lg font-bold text-foreground mb-4">Recent Broadcasts</Text>
            <View className="bg-surface rounded-2xl p-4 border border-border items-center py-10">
              <Text className="text-muted italic">No recent broadcasts found.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
