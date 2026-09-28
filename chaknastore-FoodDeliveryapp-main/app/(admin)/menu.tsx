import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, TextInput, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { menuService, MenuItem } from '@/lib/supabase-service';
import { useRouter } from 'expo-router';

export default function AdminMenuScreen() {
    const router = useRouter();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchMenu = useCallback(async () => {
        try {
            const data = await menuService.getAllMenuItems();
            setMenuItems(data);
        } catch (error) {
            console.error('Failed to fetch menu:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);

    const filteredItems = menuItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDeleteItem = (id: string) => {
        Alert.alert('Delete Item', 'Are you sure you want to delete this menu item?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        await menuService.deleteMenuItem(id);
                        setMenuItems(prev => prev.filter(item => item.id !== id));
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete item');
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: MenuItem }) => (
        <View className="bg-surface rounded-2xl p-4 mb-3 border border-border flex-row items-center gap-4">
            <View className="w-16 h-16 bg-muted rounded-xl items-center justify-center">
                {item.image ? (
                    <Image source={{ uri: item.image }} className="w-full h-full rounded-xl" />
                ) : (
                    <Text className="text-2xl">🍲</Text>
                )}
            </View>
            <View className="flex-1">
                <Text className="text-foreground font-bold">{item.name}</Text>
                <Text className="text-muted text-xs capitalize">{item.category} • {item.type}</Text>
                <Text className="text-primary font-bold mt-1">₹{item.price}</Text>
            </View>
            <View className="flex-row gap-2">
                <TouchableOpacity 
                    className="p-2 rounded-full bg-primary/10"
                    onPress={() => Alert.alert('Edit', 'Edit functionality coming soon')}
                >
                    <Text className="text-primary text-xs font-bold">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    className="p-2 rounded-full bg-error/10"
                    onPress={() => handleDeleteItem(item.id)}
                >
                    <Text className="text-error text-xs font-bold">Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <ScreenContainer className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#E25C3D" />
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer className="flex-1 bg-background">
            <View className="px-4 py-6 flex-1">
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-3xl font-bold text-foreground">Menu Control</Text>
                        <Text className="text-muted text-sm">Global menu management</Text>
                    </View>
                    <TouchableOpacity 
                        className="bg-primary px-4 py-2 rounded-xl"
                        onPress={() => Alert.alert('Add', 'Add item functionality coming soon')}
                    >
                        <Text className="text-white font-bold">+ New Item</Text>
                    </TouchableOpacity>
                </View>

                <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-6"
                    placeholder="Search menu items..."
                    placeholderTextColor="#687076"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />

                <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View className="items-center py-10">
                            <Text className="text-muted">No items found</Text>
                        </View>
                    }
                />
            </View>
        </ScreenContainer>
    );
}
