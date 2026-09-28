import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase-service';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

export const notificationService = {
  registerForPushNotificationsAsync: async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push Token:', token);

    return token;
  },

  saveTokenToSupabase: async (userId: string, token: string) => {
    // This assumes a 'push_tokens' table exists or adds to user profile
    const { error } = await supabase.from('users').update({
        raw_app_meta_data: { push_token: token }
    }).eq('id', userId);
    
    if (error) console.error('Error saving push token:', error);
  },

  sendLocalNotification: async (title: string, body: string, data = {}) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // immediate
    });
  }
};
