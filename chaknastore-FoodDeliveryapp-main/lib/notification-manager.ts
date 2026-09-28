import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase-service';

export const notificationManager = {
    registerForPushNotifications: async (userId: string) => {
        if (Platform.OS === 'web') return;

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

        const token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Push Token:', token);

        // Store token in Supabase users table
        const { error } = await supabase
            .from('users')
            .update({ push_token: token })
            .eq('id', userId);

        if (error) {
            console.error('Error saving push token:', error);
        }

        return token;
    },

    sendLocalNotification: async (title: string, body: string, data: any = {}) => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger: null, // immediate
        });
    }
};

// Configure global notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});
