/**
 * Chakna Menu Screen
 * Single-store menu with search, categories, and add-to-cart.
 */

import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useState, useEffect } from 'react';
import { menuService, type MenuItem } from '@/lib/supabase-service';
import { useCart } from '@/lib/cart-context';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function ChaknaStoreListingScreen() {
  const router = useRouter();
  const { state, addItem } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => { };

    const loadMenu = async () => {
      try {
        setLoading(true);
        const items = await menuService.getAllMenuItems();
        setMenuItems(items);
        unsubscribe = menuService.subscribeToMenu(setMenuItems);
      } catch (err) {
        console.error('Failed to load menu items', err);
        setError('Unable to load menu items right now.');
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
    return () => unsubscribe();
  }, []);

  const categories = ['All', ...new Set(menuItems.map((item) => item.category))];

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (item: MenuItem) => {
    const product: any = {
      ...item,
      description: item.description || '',
      category: item.category || 'General',
      available: item.isActive,
      vendorId: 'chakna-store',
    };
    addItem(product, 1);
  };

  const handleViewDetails = (itemId: string) => {
    router.push(`./store/${itemId}`);
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          <View className="mb-6">
            <Text className="text-3xl font-bold text-foreground mb-2">Chakna Menu</Text>
            <Text className="text-sm text-muted">
              One kitchen, one menu — delivered by 12 local packing vendors across the city.
            </Text>
          </View>

          <View className="mb-4">
            <TextInput
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="Search menu items..."
              placeholderTextColor="#687076"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-4 px-4">
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                className={`px-4 py-2 rounded-full mr-2 border ${selectedCategory === category
                  ? 'bg-primary border-primary'
                  : 'bg-surface border-border'
                  }`}
                onPress={() => setSelectedCategory(category || 'All')}
              >
                <Text className={`font-semibold text-sm ${selectedCategory === category ? 'text-background' : 'text-foreground'}`}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {error ? (
            <View className="bg-error/10 border border-error rounded-3xl p-4 mb-6">
              <Text className="text-error text-sm">{error}</Text>
            </View>
          ) : null}

          <View className="gap-6 mb-32">
            {loading ? (
              [1, 2, 3].map((i) => (
                <View key={i} className="bg-surface rounded-3xl p-5 border border-border shadow-sm">
                  <View className="flex-row justify-between mb-4">
                    <View className="flex-1 mr-4">
                      <Skeleton width={100} height={12} className="mb-2" />
                      <Skeleton width="80%" height={24} className="mb-2" />
                      <Skeleton width="100%" height={40} />
                    </View>
                    <Skeleton width={80} height={50} borderRadius={16} />
                  </View>
                  <View className="flex-row gap-3">
                    <Skeleton height={50} className="flex-[2]" borderRadius={16} />
                    <Skeleton height={50} className="flex-1" borderRadius={16} />
                  </View>
                </View>
              ))
            ) : filteredItems.length === 0 ? (
              <EmptyState 
                emoji="🍕"
                title="No items found"
                description="We couldn't find any menu items matching your search or category."
                buttonLabel="Clear Filters"
                onButtonPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
              />
            ) : (
              filteredItems.map((item) => (
                <View key={item.id} className="bg-surface rounded-3xl p-5 border border-border shadow-sm">
                  <View className="flex-row justify-between mb-4">
                    <View className="flex-1 mr-4">
                      <View className="flex-row items-center mb-2">
                        <View className={`w-3 h-3 rounded-full mr-2 ${item.type === 'veg' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <Text className="text-xs font-bold text-muted uppercase tracking-wider">{item.category}</Text>
                      </View>
                      <Text className="text-xl font-bold text-foreground mb-1">{item.name}</Text>
                      <Text className="text-sm text-muted leading-snug" numberOfLines={2}>{item.description}</Text>
                    </View>
                    <View className="bg-primary/5 p-3 rounded-2xl items-center justify-center min-w-[80px]">
                      <Text className="text-primary font-bold text-lg">₹{item.price}</Text>
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      className="flex-[2] bg-primary rounded-2xl py-4 items-center shadow-md shadow-primary/20"
                      onPress={() => handleAddToCart(item)}
                    >
                      <Text className="text-white font-bold text-base">Add to Cart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 bg-surface border border-border rounded-2xl py-4 items-center"
                      onPress={() => handleViewDetails(item.id)}
                    >
                      <Text className="text-foreground font-semibold">Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {cartCount > 0 && (
        <View className="absolute bottom-10 left-6 right-6">
          <TouchableOpacity
            className="bg-foreground flex-row items-center justify-between px-8 py-5 rounded-full shadow-2xl"
            onPress={() => router.push('/cart')}
          >
            <View className="flex-row items-center">
              <View className="bg-primary w-8 h-8 rounded-full items-center justify-center mr-3">
                <Text className="text-white font-bold text-xs">{cartCount}</Text>
              </View>
              <Text className="text-background font-bold text-lg">View Cart</Text>
            </View>
            <Text className="text-background/80 font-semibold text-base">₹{state.totals.total}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenContainer>
  );
}
