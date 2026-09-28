/**
 * Cart Screen
 * Quantity controls, checkout
 */

import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useCart } from '@/lib/cart-context';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { EmptyState } from '@/components/ui/empty-state';

export default function CartScreen() {
    const { state, updateQuantity, removeItem, clearCart } = useCart();
    const router = useRouter();

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-surface rounded-xl p-4 mb-4 shadow-md border border-border">
            <View className="flex-row items-center gap-4">
                <View className="w-16 h-16 bg-primary/10 rounded-lg items-center justify-center">
                    <IconSymbol name="utensils" color="#FF6B35" size={20} />
                </View>
                <View className="flex-1">
                    <Text className="font-bold text-foreground">{item.product.name}</Text>
                    <Text className="text-sm text-muted">{item.product.description}</Text>
                </View>
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
                        <View className="w-8 h-8 bg-border rounded-full items-center justify-center">
                            <Text className="font-bold text-foreground">-</Text>
                        </View>
                    </TouchableOpacity>
                    <Text className="text-lg font-bold">{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
                        <View className="w-8 h-8 bg-primary rounded-full items-center justify-center">
                            <Text className="text-background font-bold">+</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removeItem(item.product.id)}>
                    <IconSymbol name="trash" color="#EF4444" size={20} />
                </TouchableOpacity>
            </View>
            <Text className="text-right font-bold text-lg mt-2">₹{(item.product.price * item.quantity).toFixed(0)}</Text>
        </View>
    );

    const handleCheckout = () => {
        router.push('/checkout');
    };

    return (
        <ScreenContainer className="flex-1 bg-background">
            <View className="flex-1 px-4 pt-6">
                <Text className="text-3xl font-bold text-foreground mb-6">Your Cart ({state.items.length})</Text>
                
                <View className="flex-1">
                    {state.items.length === 0 ? (
                        <EmptyState 
                            emoji="🛒"
                            title="Your cart is empty"
                            description="Add delicious chakna and meals from the menu to get started with your order."
                            buttonLabel="Browse Menu"
                            onButtonPress={() => router.push('/chakna-store')}
                        />
                    ) : (
                        <FlatList
                            data={state.items}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.product.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    )}
                </View>

                {state.items.length > 0 && (
                    <View className="bg-surface border border-border p-6 rounded-3xl shadow-xl mb-4 mt-2">
                        <View className="flex-row justify-between mb-4">
                            <Text className="text-lg text-muted">Subtotal</Text>
                            <Text className="text-xl font-bold text-foreground">₹{state.totals.subtotal.toFixed(0)}</Text>
                        </View>
                        <TouchableOpacity 
                            className="bg-primary rounded-2xl py-4 px-6 items-center shadow-lg active:scale-95 shadow-primary/30" 
                            onPress={handleCheckout}
                        >
                            <Text className="text-white font-bold text-lg">Checkout • ₹{state.totals.total.toFixed(0)}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScreenContainer>
    );
}

