import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { adminOrderService } from '@/lib/admin-order-service';
import { vendorService } from '@/lib/supabase-service';
import { format } from 'date-fns';

export default function AdminMasterTiffinScreen() {
    const [plans, setPlans] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [filter, setFilter] = useState<'customer' | 'upcoming' | 'assigned'>('customer');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPlans();
        loadVendors();
    }, []);

    const loadPlans = async () => {
        setIsLoading(true);
        try {
            const data = await adminOrderService.getTiffinPlans();
            setPlans(data);
        } catch (err) {
            Alert.alert('Error', 'Failed to load tiffin plans');
        } finally {
            setIsLoading(false);
        }
    };

    const loadVendors = async () => {
        const data = await vendorService.getAllVendors();
        setVendors(data);
    };

    const assignVendor = (subscriptionId: number) => {
        Alert.alert('Assign Vendor', 'Choose vendor:', vendors.map(v => ({
            text: v.name,
            onPress: () => {
                adminOrderService.assignTiffinVendor(subscriptionId, v.id);
                Alert.alert('Assigned', 'Vendor updated');
                loadPlans();
            }
        })), { cancelable: true });
    };

    if (isLoading) {
        return <ScreenContainer><Text>Loading tiffin plans...</Text></ScreenContainer>;
    }

    const filteredPlans = plans.filter(p => {
        if (filter === 'upcoming') return new Date(p.start_date) > new Date();
        if (filter === 'assigned') return p.vendor_id;
        return true;
    });

    return (
        <ScreenContainer className="flex-1">
            <View className="px-4 py-6">
                <Text className="text-3xl font-bold mb-6">Master Tiffin Management</Text>
                <View className="flex-row mb-6">
                    <TouchableOpacity className={`flex-1 p-3 rounded-xl mr-2 ${filter === 'customer' ? 'bg-primary' : 'bg-surface'}`} onPress={() => setFilter('customer')}>
                        <Text className={filter === 'customer' ? 'text-white' : 'text-foreground'}>Customer Wise</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className={`flex-1 p-3 rounded-xl ${filter === 'upcoming' ? 'bg-primary' : 'bg-surface'}`} onPress={() => setFilter('upcoming')}>
                        <Text className={filter === 'upcoming' ? 'text-white' : 'text-foreground'}>Upcoming</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className={`flex-1 p-3 rounded-xl ml-2 ${filter === 'assigned' ? 'bg-primary' : 'bg-surface'}`} onPress={() => setFilter('assigned')}>
                        <Text className={filter === 'assigned' ? 'text-white' : 'text-foreground'}>Vendor Assigned</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView>
                    {filteredPlans.map(plan => (
                        <View key={plan.subscription_id} className="bg-surface rounded-3xl p-6 mb-6 border">
                            <Text className="text-xl font-bold mb-2">{plan.customer_name}</Text>
                            <Text>Phone: {plan.phone}</Text>
                            <Text>Period: {format(new Date(plan.start_date), 'MMM d')} - {format(new Date(plan.end_date), 'MMM d')}</Text>
                            <Text>Frequency: {plan.frequency} shifts/day | Meals: {plan.scheduled_meals} | Delivered: {plan.delivered}</Text>
                            <Text>Vendor: {plan.vendor_id || 'Unassigned'}</Text>
                            <TouchableOpacity className="bg-primary p-3 rounded-xl mt-4" onPress={() => assignVendor(plan.subscription_id)}>
                                <Text className="text-white font-bold text-center">Edit/Assign Vendor</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </ScreenContainer>
    );
}
