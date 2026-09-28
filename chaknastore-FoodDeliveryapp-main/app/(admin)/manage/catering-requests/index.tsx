import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { AdminDataTable } from '@/components/ui/admin-data-table';
import { cateringService, type CateringRequest } from '@/lib/supabase-service';
import { format } from 'date-fns';

function CateringRequestsContent() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await cateringService.getAllRequests();
            setRequests(data);
        } catch (err) {
            console.error('Failed to load catering requests', err);
            Alert.alert('Error', 'Unable to load catering requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const updateStatus = async (id: number | string, newStatus: string) => {
        try {
            await cateringService.updateRequestStatus(id, newStatus);
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
            Alert.alert('Success', `Request marked as ${newStatus}`);
        } catch (err) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleAction = (item: any) => {
        Alert.alert(
            'Manage Request',
            `Update status for ${item.users?.name || 'Customer'}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', onPress: () => updateStatus(item.id, 'confirmed') },
                { text: 'Complete', onPress: () => updateStatus(item.id, 'completed') },
                { text: 'Reject', style: 'destructive', onPress: () => updateStatus(item.id, 'cancelled') },
            ]
        );
    };

    const renderRequest = ({ item }: { item: any }) => (
        <TouchableOpacity 
            className="p-5 border-b border-border bg-surface rounded-3xl mb-4 shadow-sm"
            onPress={() => handleAction(item)}
            activeOpacity={0.7}
        >
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                    <Text className="text-xl font-bold text-foreground mb-1">
                        {item.users?.name || 'Guest User'}
                    </Text>
                    <Text className="text-sm text-primary font-semibold">
                        {item.users?.phone || 'No Phone'}
                    </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${
                    item.status === 'pending' ? 'bg-orange-500/10' :
                    item.status === 'confirmed' ? 'bg-blue-500/10' :
                    item.status === 'completed' ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}>
                    <Text className={`text-[10px] font-bold uppercase ${
                        item.status === 'pending' ? 'text-orange-500' :
                        item.status === 'confirmed' ? 'text-blue-500' :
                        item.status === 'completed' ? 'text-green-500' : 'text-red-500'
                    }`}>
                        {item.status}
                    </Text>
                </View>
            </View>
            
            <View className="bg-background/50 rounded-2xl p-4 mb-3 border border-border/50">
                <View className="flex-row items-center gap-2 mb-2">
                    <Text className="text-lg">📅</Text>
                    <Text className="text-sm text-foreground font-medium">
                        {format(new Date(item.event_date), 'MMMM do, yyyy')}
                    </Text>
                </View>
                <View className="flex-row items-center gap-2 mb-2">
                    <Text className="text-lg">👥</Text>
                    <Text className="text-sm text-muted">Guests: {item.guest_count}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <Text className="text-lg">📍</Text>
                    <Text className="text-sm text-muted" numberOfLines={1}>{item.location}</Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center">
                <View>
                    <Text className="text-[10px] text-muted uppercase font-bold tracking-wider">Estimated Budget</Text>
                    <Text className="text-xl font-bold text-success">₹{item.budget?.toLocaleString() || 'N/A'}</Text>
                </View>
                <TouchableOpacity 
                    className="bg-primary/10 px-4 py-2 rounded-full"
                    onPress={() => handleAction(item)}
                >
                    <Text className="text-primary text-xs font-bold">Manage</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 px-4 py-6">
            <View className="mb-6">
                <Text className="text-3xl font-bold text-foreground">Catering Requests</Text>
                <Text className="text-muted text-sm mt-1">Review and manage upcoming event inquiries.</Text>
            </View>
            <AdminDataTable
                data={requests}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderRequest}
                filterOptions={[
                    { label: 'Pending', value: 'pending' },
                    { label: 'Confirmed', value: 'confirmed' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Cancelled', value: 'cancelled' },
                ]}
                onRefresh={loadRequests}
                loading={loading}
                emptyTitle="No Catering Requests"
                emptyDescription="No catering requests to review at the moment."
                searchKeys={['location', 'users.name'] as any}
            />
        </View>
    );
}

export default function AdminCateringRequestsScreen() {
    return (
        <ScreenContainer className="flex-1 bg-background">
            <CateringRequestsContent />
        </ScreenContainer>
    );
}


