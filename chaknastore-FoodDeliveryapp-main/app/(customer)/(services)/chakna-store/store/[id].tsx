/**
 * Menu Item Detail Screen
 * Single store menu item details and add-to-cart.
 */

import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useState, useEffect } from 'react';
import { menuService, type MenuItem } from '@/lib/supabase-service';
import { useCart } from '@/lib/cart-context';

export default function MenuItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state, addItem } = useCart();
  const cartCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    let unsubscribe = () => { };

    const loadItem = async () => {
      try {
        setLoading(true);
        const items = await menuService.getAllMenuItems();
        setMenuItem(items.find((item) => item.id === id) ?? null);
        unsubscribe = menuService.subscribeToMenu((items) => {
          setMenuItem(items.find((item) => item.id === id) ?? null);
        });
      } catch (err) {
        console.error('Failed to load menu item', err);
        setError('Unable to load item details.');
      } finally {
        setLoading(false);
      }
    };

    loadItem();
    return () => unsubscribe();
  }, [id]);

  const handleAddToCart = (item: MenuItem) => {
    addItem({ 
      ...item, 
      available: item.isActive,
      description: item.description || '',
      category: item.category || 'General',
      vendorId: 'chakna-store' 
    }, 1);
    router.push('/cart');
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground text-lg">Loading item details...</Text>
      </ScreenContainer>
    );
  }

  if (error || !menuItem) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center bg-background px-4">
        <Text className="text-foreground text-xl font-bold mb-3">Item not found</Text>
        <Text className="text-muted text-center mb-6">This menu item may no longer be available.</Text>
        <TouchableOpacity className="bg-primary rounded-lg py-3 px-6" onPress={() => router.push('..')}>
          <Text className="text-background font-bold">Back to menu</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          <View className="mb-6 flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-2xl">←</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground flex-1 text-center">Menu Item</Text>
            {cartCount > 0 ? (
              <View className="bg-primary px-3 py-1 rounded-full">
                <Text className="text-background font-bold text-sm">{cartCount}</Text>
              </View>
            ) : (
              <View className="w-12" />
            )}
          </View>

          <View className="bg-surface rounded-3xl border border-border p-6 mb-6">
            <Text className="text-3xl font-bold text-foreground mb-3">{menuItem.name}</Text>
            <Text className="text-sm text-muted mb-4">{menuItem.category}</Text>
            <Text className="text-lg text-primary font-bold mb-4">₹{menuItem.price}</Text>
            <Text className="text-base text-foreground leading-relaxed mb-6">{menuItem.description}</Text>
            <View className="rounded-3xl bg-primary/10 p-4">
              <Text className="text-sm text-foreground font-semibold mb-2">Delivered by our vendor network</Text>
              <Text className="text-sm text-muted">Packed and delivered by one of 12 local vendors serving your area.</Text>
            </View>
          </View>

          <TouchableOpacity
            className="bg-primary rounded-3xl py-4 items-center mb-4"
            onPress={() => handleAddToCart(menuItem)}
          >
            <Text className="text-background font-bold text-lg">Add to Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity className="border border-border rounded-3xl py-4 items-center" onPress={() => router.push('/chakna-store')}>
            <Text className="text-foreground font-semibold">Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
