import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useCart, type Product } from '@/lib/cart-context';
import { orderService } from '@/lib/supabase-service';
import { format } from 'date-fns';

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { addItem } = useCart();
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchOrderDetails();
        }
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            setIsLoading(true);
            const data = await orderService.getOrderDetails(id!);
            setOrder(data);
        } catch (error) {
            console.error('Failed to fetch order details:', error);
            Alert.alert('Error', 'Unable to load order details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOrderAgain = () => {
        if (!order || !order.items) return;

        order.items.forEach((item: any) => {
            const product: Product = {
                id: item.menu_id.toString(),
                name: item.name,
                description: 'Reordered item',
                price: item.price,
                category: 'Reorder',
                available: true,
                vendorId: order.vendor_id || 'chakna-store',
                createdAt: new Date().toISOString(),
            };
            addItem(product, item.quantity);
        });

        Alert.alert('Success', 'Items added to cart!', [
            { text: 'View Cart', onPress: () => router.push('/cart') },
            { text: 'Continue Shopping' }
        ]);
    };

    if (isLoading) {
        return (
            <ScreenContainer className="justify-center items-center">
                <ActivityIndicator size="large" color="#E25C3D" />
            </ScreenContainer>
        );
    }

    if (!order) {
        return (
            <ScreenContainer className="flex-1 bg-background items-center justify-center px-4">
                <Text className="text-2xl font-bold text-foreground mb-3">Order not found</Text>
                <Text className="text-muted text-center mb-6">This order may no longer be available or the link is invalid.</Text>
                <TouchableOpacity className="bg-primary rounded-3xl py-4 px-6" onPress={() => router.push('/orders')}>
                    <Text className="text-background font-bold">Back to Orders</Text>
                </TouchableOpacity>
            </ScreenContainer>
        );
    }

    const statusColors: Record<string, string> = {
        delivered: 'text-green-500',
        pending: 'text-orange-500',
        cooking: 'text-blue-500',
        preparing: 'text-blue-500',
        out_for_delivery: 'text-purple-500',
        cancelled: 'text-red-500',
    };

    return (
        <ScreenContainer className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6">
                    <View className="flex-row items-center justify-between mb-6">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text className="text-2xl">←</Text>
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-foreground">Order Details</Text>
                        <View className="w-10" />
                    </View>

                    <View className="bg-surface rounded-3xl border border-border p-5 mb-6">
                        <Text className="text-2xl font-bold text-foreground mb-2">Order #{String(order.id).slice(-8).toUpperCase()}</Text>
                        <Text className="text-sm text-muted mb-4">Placed on {format(new Date(order.createdAt ?? order.created_at), 'MMMM do, yyyy h:mm a')}</Text>
                        <View className="bg-primary/10 rounded-3xl p-4 mb-4">
                            <Text className={`font-bold mb-1 ${statusColors[order.status] || 'text-muted'}`}>{order.status.replace(/_/g, ' ').toUpperCase()}</Text>
                            <Text className="text-sm text-muted">Your order is currently {order.status.replace(/_/g, ' ').toLowerCase()}.</Text>
                        </View>

                        <View className="mb-4">
                            <Text className="text-base font-semibold text-foreground mb-2">Service Type</Text>
                            <Text className="text-foreground capitalize">{order.type}</Text>
                        </View>

                        <View className="mb-4">
                            <Text className="text-base font-semibold text-foreground mb-2">Delivery Address</Text>
                            <Text className="text-foreground">{order.users?.delivery_location?.address || 'Standard Delivery'}</Text>
                        </View>

                        <View>
                            <Text className="text-base font-semibold text-foreground mb-3">Order items</Text>
                            {order.items?.map((item: any) => (
                                <View key={item.id} className="flex-row justify-between items-center py-3 border-b border-border last:border-b-0">
                                    <View className="flex-1 pr-3">
                                        <Text className="text-foreground font-semibold">{item.name || 'Menu Item'}</Text>
                                        <Text className="text-muted text-sm">Qty {item.quantity}</Text>
                                    </View>
                                    <Text className="font-bold">₹{item.price * item.quantity}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View className="bg-surface rounded-3xl border border-border p-5 mb-6">
                        <Text className="text-base font-semibold text-foreground mb-3">Payment Breakdown</Text>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-muted">Subtotal</Text>
                            <Text>₹{(order.subtotal ?? order.totalPrice ?? 0)}</Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-muted">Tax</Text>
                            <Text>₹{(order.tax ?? 0)}</Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-muted">Delivery Fee</Text>
                            <Text>₹{(order.deliveryFee ?? order.delivery_fee ?? 0)}</Text>
                        </View>
                        <View className="flex-row justify-between pt-3 border-t border-border mt-3">
                            <Text className="font-semibold text-foreground">Total Paid</Text>
                            <Text className="font-semibold text-primary text-xl">₹{order.totalPrice ?? order.total_price}</Text>
                        </View>
                        <View className="mt-4 gap-1">
                            <Text className="text-muted text-sm">Payment Status: <Text className="font-bold text-foreground capitalize">{order.paymentStatus ?? order.payment_status}</Text></Text>
                            <Text className="text-muted text-sm">Payment Method: <Text className="font-bold text-foreground capitalize">{(order.paymentMethod ?? order.payment_method ?? 'cod').replace('_', ' ')}</Text></Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        className="bg-primary rounded-3xl py-4 items-center mb-4"
                        onPress={handleOrderAgain}
                    >
                        <Text className="text-background font-bold text-lg">Order Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="border border-border rounded-3xl py-4 items-center"
                        onPress={() => router.push('/orders')}
                    >
                        <Text className="text-foreground font-semibold">Back to Orders</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenContainer>
    );
}
