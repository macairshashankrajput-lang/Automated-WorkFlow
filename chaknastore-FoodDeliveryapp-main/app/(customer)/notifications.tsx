import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { notificationService } from '@/lib/supabase-service';
import { format } from 'date-fns';

export default function NotificationsScreen() {
    const router = useRouter();
    const { state: authState } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadNotifications = async () => {
        if (!authState.user?.id) return;
        try {
            const data = await notificationService.getUserNotifications(authState.user.id);
            setNotifications(data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadNotifications();

        if (authState.user?.id) {
            const unsubscribe = notificationService.subscribeToNotifications(authState.user.id, (newNotif) => {
                setNotifications(prev => [newNotif, ...prev]);
            });
            return unsubscribe;
        }
    }, [authState.user?.id]);

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!authState.user?.id) return;
        try {
            await notificationService.markAllAsRead(authState.user.id);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        loadNotifications();
    };

    const renderNotification = ({ item }: { item: any }) => (
        <TouchableOpacity 
            className={`p-5 rounded-3xl mb-4 border ${item.isRead ? 'bg-surface border-border' : 'bg-primary/5 border-primary shadow-sm'}`}
            onPress={() => handleMarkAsRead(item.id)}
            activeOpacity={0.7}
        >
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                    <Text className={`text-lg font-bold ${item.isRead ? 'text-foreground' : 'text-primary'}`}>
                        {item.title}
                    </Text>
                    <Text className="text-xs text-muted font-semibold uppercase tracking-widest mt-1">
                        {format(new Date(item.createdAt), 'MMM d, h:mm a')}
                    </Text>
                </View>
                {!item.isRead && <View className="w-2 h-2 rounded-full bg-primary" />}
            </View>
            <Text className={`text-sm leading-relaxed ${item.isRead ? 'text-muted' : 'text-foreground'}`}>
                {item.message}
            </Text>
        </TouchableOpacity>
    );

    return (
        <ScreenContainer className="flex-1 bg-background">
            <View className="flex-1 px-4 py-6">
                <View className="flex-row items-center justify-between mb-6">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text className="text-2xl text-primary font-bold">←</Text>
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-foreground">Notifications</Text>
                    <TouchableOpacity onPress={handleMarkAllAsRead}>
                        <Text className="text-xs font-bold text-primary uppercase">Read All</Text>
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#E25C3D" />
                    </View>
                ) : notifications.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-12">
                        <Text className="text-6xl mb-4">📭</Text>
                        <Text className="text-xl font-bold text-foreground mb-2">No notifications yet</Text>
                        <Text className="text-muted text-center px-10">We'll notify you about your order updates and special offers.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        renderItem={renderNotification}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#E25C3D" />
                        }
                    />
                )}
            </View>
        </ScreenContainer>
    );
}

