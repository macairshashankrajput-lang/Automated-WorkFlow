import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { adminOrderService } from '@/lib/admin-order-service';
import { vendorService } from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';

export default function AdminOrdersPreviewScreen() {
    const [orders, setOrders] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [tab, setTab] = useState<'live' | 'past'>('live');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
        loadVendors();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await adminOrderService.getAllOrders();
            setOrders(data);
        } catch (err) {
            Alert.alert('Error', 'Failed to load orders');
        } finally {
            setIsLoading(false);
        }
    };

    const loadVendors = async () => {
        const data = await vendorService.getAllVendors();
        setVendors(data);
    };

    const reassignOrder = (orderId: string) => {
        Alert.alert('Reassign Order', 'Move to vendor:', vendors.map(v => ({
            text: `${v.name} (${v.businessName})`,
            onPress: () => {
                adminOrderService.reassignOrder(orderId, v.id);
                Alert.alert('Reassigned', 'Vendor updated');
                loadData();
            }
        })), { cancelable: true });
    };

    const liveOrders = orders.filter(o => ['pending', 'cooking', 'out_for_delivery'].includes(o.status));
    const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

    if (isLoading) {
        return <ScreenContainer><Text>Loading...</Text></ScreenContainer>;
    }

    return (
        <ScreenContainer className="flex-1">
            <View className="px-4 py-6">
                <Text className="text-3xl font-bold mb-6">Order Preview (Full Access)</Text>
                <View className="flex-row mb-6">
                    <TouchableOpacity className={`flex-1 p-3 rounded-xl ${tab === 'live' ? 'bg-primary' : 'bg-surface border'}`} onPress={() => setTab('live')}>
                        <Text className={tab === 'live' ? 'text-white font-bold' : 'text-foreground'}>Live ({liveOrders.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className={`flex-1 p-3 rounded-xl ml-2 ${tab === 'past' ? 'bg-primary' : 'bg-surface border'}`} onPress={() => setTab('past')}>
                        <Text className={tab === 'past' ? 'text-white font-bold' : 'text-foreground'}>Past ({pastOrders.length})</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView>
                    {(tab === 'live' ? liveOrders : pastOrders).map(order => (
                        <View key={order.id} className="bg-surface rounded-3xl p-6 mb-6 border">
                            <Text className="text-xl font-bold mb-2">#{order.id} - {order.status.toUpperCase()}</Text>
                            <Text>Customer: {order.users.name} ({order.users.phone})</Text>
                            <Text>Vendor: {order.users_by_vendor_id?.name || 'Unassigned'}</Text>
                            <Text>Total: ₹{order.total_price}</Text>
                            <TouchableOpacity className="bg-primary p-3 rounded-xl mt-4" onPress={() => reassignOrder(order.id)}>
                                <Text className="text-white font-bold text-center">Reassign Vendor</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </ScreenContainer>
    );
}
