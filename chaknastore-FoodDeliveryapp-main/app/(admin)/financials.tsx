import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { adminOrderService } from '@/lib/admin-order-service';

export default function AdminFinancialsScreen() {
    const [revenueHistory, setRevenueHistory] = useState<any[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadRevenue();
    }, []);

    const loadRevenue = async () => {
        setIsLoading(true);
        try {
            const data = await adminOrderService.getRevenueHistory();
            setRevenueHistory(data);
            const total = data.reduce((sum, r) => sum + r.revenue, 0);
            setTotalRevenue(total);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <ScreenContainer><Text>Loading financials...</Text></ScreenContainer>;
    }

    return (
        <ScreenContainer className="flex-1">
            <View className="px-4 py-6">
                <Text className="text-3xl font-bold mb-6">Financials - Order History</Text>
                <View className="bg-primary p-6 rounded-3xl mb-6 items-center">
                    <Text className="text-4xl font-bold text-white mb-2">₹{totalRevenue.toLocaleString()}</Text>
                    <Text className="text-white/80 text-lg">Total Revenue</Text>
                </View>
                <ScrollView>
                    {revenueHistory.map((row, idx) => (
                        <View key={idx} className="bg-surface rounded-2xl p-5 mb-4 border">
                            <View className="flex-row justify-between">
                                <Text className="text-lg font-bold">{row.date}</Text>
                                <Text className="text-2xl font-bold text-primary">₹{row.revenue.toLocaleString()}</Text>
                            </View>
                            <Text className="text-muted">Orders: {row.order_count} | Vendor: {row.vendor_id || 'All'}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </ScreenContainer>
    );
}
