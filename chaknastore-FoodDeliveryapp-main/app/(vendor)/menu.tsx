import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, TextInput, Switch } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { menuService } from '@/lib/supabase-service';

export default function VendorMenuScreen() {
    const { state } = useAuth();
    const vendorId = state.user?.id;
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMenu = useCallback(async () => {
        if (!vendorId) return;
        try {
            const data = await menuService.getVendorMenu(vendorId);
            setMenuItems(data);
        } catch (error) {
            console.error('Failed to fetch menu:', error);
        } finally {
            setIsLoading(false);
        }
    }, [vendorId]);

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);

    const handleToggleAvailability = async (itemId: string | number, currentStatus: boolean) => {
        try {
            await menuService.updateMenuItem(itemId, { available: !currentStatus });
            setMenuItems(items => items.map(item => item.id === itemId ? { ...item, available: !currentStatus } : item));
        } catch (error) {
            Alert.alert('Error', 'Failed to update item status');
        }
    };

    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        price: '',
        category: 'Tiffins',
        description: '',
        type: 'veg' as 'veg' | 'non-veg'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.price) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await menuService.addMenuItem({
                name: newItem.name,
                price: parseInt(newItem.price),
                category: newItem.category,
                description: newItem.description,
                type: newItem.type,
                image: null,
                ingredients: '',
                vendorId: vendorId
            });
            Alert.alert('Success', 'Item added to menu');
            setIsAddModalVisible(false);
            setNewItem({ name: '', price: '', category: 'Tiffins', description: '', type: 'veg' });
            fetchMenu();
        } catch (error) {
            Alert.alert('Error', 'Failed to add item');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <ScreenContainer className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color="#E25C3D" />
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <Text className="text-3xl font-bold text-foreground">Menu</Text>
                            <Text className="text-muted text-sm">Manage your shop items</Text>
                        </View>
                        <TouchableOpacity 
                            className="bg-primary px-4 py-2 rounded-lg"
                            onPress={() => setIsAddModalVisible(true)}
                        >
                            <Text className="text-white font-bold">+ Add Item</Text>
                        </TouchableOpacity>
                    </View>

                    {menuItems.length === 0 ? (
                        <View className="items-center py-20">
                            <Text className="text-6xl mb-4">🍲</Text>
                            <Text className="text-xl font-bold text-foreground mb-2">No items in menu</Text>
                            <Text className="text-muted text-center px-10">Add items to start selling on Chakna Store.</Text>
                        </View>
                    ) : (
                        menuItems.map(item => (
                            <View key={item.id} className="bg-surface rounded-2xl p-4 mb-4 border border-border flex-row gap-4">
                                <View className="w-20 h-20 bg-muted rounded-xl overflow-hidden">
                                    {item.image ? (
                                        <Image source={{ uri: item.image }} className="w-full h-full" />
                                    ) : (
                                        <View className="w-full h-full items-center justify-center bg-primary/10">
                                            <Text className="text-2xl">🍽️</Text>
                                        </View>
                                    )}
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row justify-between items-start">
                                        <View className="flex-1">
                                            <Text className="text-lg font-bold text-foreground">{item.name}</Text>
                                            <Text className="text-sm text-primary font-bold">₹{item.price}</Text>
                                        </View>
                                        <Switch
                                            value={item.isActive ?? item.is_active}
                                            onValueChange={() => handleToggleAvailability(item.id, item.isActive ?? item.is_active)}
                                            trackColor={{ false: '#767577', true: '#E25C3D' }}
                                        />
                                    </View>
                                    <Text className="text-xs text-muted mt-1" numberOfLines={2}>{item.description}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Add Item Modal */}
            {isAddModalVisible && (
                <View className="absolute inset-0 bg-black/50 justify-end">
                    <View className="bg-surface rounded-t-3xl p-6 pb-10">
                        <Text className="text-2xl font-bold text-foreground mb-6">Add New Item</Text>
                        
                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-muted mb-2 uppercase">Item Name</Text>
                            <TextInput 
                                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                                placeholder="Enter item name"
                                value={newItem.name}
                                onChangeText={text => setNewItem(n => ({ ...n, name: text }))}
                            />
                        </View>

                        <View className="flex-row gap-4 mb-4">
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-muted mb-2 uppercase">Price (₹)</Text>
                                <TextInput 
                                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                                    placeholder="239"
                                    keyboardType="numeric"
                                    value={newItem.price}
                                    onChangeText={text => setNewItem(n => ({ ...n, price: text }))}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-muted mb-2 uppercase">Type</Text>
                                <View className="flex-row bg-background border border-border rounded-xl overflow-hidden">
                                    <TouchableOpacity 
                                        className={`flex-1 py-3 items-center ${newItem.type === 'veg' ? 'bg-primary' : ''}`}
                                        onPress={() => setNewItem(n => ({ ...n, type: 'veg' }))}
                                    >
                                        <Text className={newItem.type === 'veg' ? 'text-white font-bold' : 'text-foreground'}>Veg</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        className={`flex-1 py-3 items-center ${newItem.type === 'non-veg' ? 'bg-primary' : ''}`}
                                        onPress={() => setNewItem(n => ({ ...n, type: 'non-veg' }))}
                                    >
                                        <Text className={newItem.type === 'non-veg' ? 'text-white font-bold' : 'text-foreground'}>Non-Veg</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-muted mb-2 uppercase">Category</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {['Tiffins', 'Chakna', 'Beverages', 'Desserts'].map(cat => (
                                    <TouchableOpacity 
                                        key={cat}
                                        onPress={() => setNewItem(n => ({ ...n, category: cat }))}
                                        className={`px-4 py-2 rounded-full border ${newItem.category === cat ? 'bg-primary/10 border-primary' : 'border-border'}`}
                                    >
                                        <Text className={newItem.category === cat ? 'text-primary font-bold' : 'text-muted'}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View className="mb-6">
                            <Text className="text-sm font-semibold text-muted mb-2 uppercase">Description</Text>
                            <TextInput 
                                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                                placeholder="Describe the item..."
                                multiline
                                numberOfLines={3}
                                value={newItem.description}
                                onChangeText={text => setNewItem(n => ({ ...n, description: text }))}
                                style={{ textAlignVertical: 'top' }}
                            />
                        </View>

                        <View className="flex-row gap-4">
                            <TouchableOpacity 
                                className="flex-1 bg-muted/20 py-4 rounded-xl items-center"
                                onPress={() => setIsAddModalVisible(false)}
                            >
                                <Text className="text-foreground font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                className="flex-[2] bg-primary py-4 rounded-xl items-center shadow-lg shadow-primary/20"
                                onPress={handleAddItem}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Add Item</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </ScreenContainer>
    );
}
