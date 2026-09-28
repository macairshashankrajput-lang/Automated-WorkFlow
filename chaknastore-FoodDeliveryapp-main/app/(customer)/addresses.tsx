/**
 * Delivery Addresses Screen
 * Shows and allows editing of the user's saved delivery address from Supabase.
 */

import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-service';
import { useEffect, useState } from 'react';

export default function DeliveryAddressesScreen() {
    const router = useRouter();
    const { state: authState } = useAuth();
    const [address, setAddress] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authState.user?.id) {
            fetchAddress();
        }
    }, [authState.user?.id]);

    const fetchAddress = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('delivery_location')
                .eq('id', authState.user!.id)
                .single();
            if (error) throw error;
            const loc = data?.delivery_location;
            if (loc && typeof loc === 'object' && loc.address) {
                setAddress(loc.address);
            } else if (typeof loc === 'string') {
                setAddress(loc);
            }
        } catch (err) {
            console.error('Failed to fetch address:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!address.trim()) {
            Alert.alert('Error', 'Please enter a delivery address');
            return;
        }
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ delivery_location: { address: address.trim(), latitude: 0, longitude: 0 } })
                .eq('id', authState.user!.id);
            if (error) throw error;
            setIsEditing(false);
            Alert.alert('Saved', 'Your delivery address has been updated.');
        } catch (err) {
            Alert.alert('Error', 'Failed to save address. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScreenContainer className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6">
                    <View className="flex-row items-center justify-between mb-6">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text className="text-2xl">←</Text>
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-foreground">Delivery Address</Text>
                        <View className="w-10" />
                    </View>

                    {isLoading ? (
                        <View className="items-center py-20">
                            <ActivityIndicator size="large" color="#E25C3D" />
                        </View>
                    ) : (
                        <>
                            {/* Current Address Card */}
                            <View className="bg-surface rounded-3xl border border-border p-5 mb-6">
                                <View className="flex-row items-start justify-between mb-3">
                                    <View className="flex-row items-center gap-2">
                                        <Text className="text-xl">🏠</Text>
                                        <Text className="text-base font-bold text-foreground">Home Address</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                                        <Text className="text-primary text-sm font-semibold">{isEditing ? 'Cancel' : 'Edit'}</Text>
                                    </TouchableOpacity>
                                </View>

                                {isEditing ? (
                                    <View className="gap-3">
                                        <TextInput
                                            className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                                            placeholder="Enter your full delivery address"
                                            placeholderTextColor="#687076"
                                            value={address}
                                            onChangeText={setAddress}
                                            multiline
                                            numberOfLines={3}
                                            textAlignVertical="top"
                                        />
                                        <TouchableOpacity
                                            className="bg-primary rounded-xl py-3 items-center"
                                            onPress={handleSave}
                                            disabled={isSaving}
                                            style={{ opacity: isSaving ? 0.6 : 1 }}
                                        >
                                            {isSaving ? (
                                                <ActivityIndicator color="white" />
                                            ) : (
                                                <Text className="text-white font-bold">Save Address</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <Text className="text-foreground text-sm leading-relaxed">
                                        {address || 'No address saved yet. Tap Edit to add one.'}
                                    </Text>
                                )}
                            </View>

                            {/* Info Note */}
                            <View className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
                                <Text className="text-primary text-xs font-semibold mb-1">📍 Location Note</Text>
                                <Text className="text-muted text-xs leading-relaxed">
                                    This address will be used as your default delivery location for all orders. You can change it at any time.
                                </Text>
                            </View>
                        </>
                    )}

                    <TouchableOpacity
                        className="border border-border rounded-3xl py-4 items-center"
                        onPress={() => router.back()}
                    >
                        <Text className="text-foreground font-semibold">Back to Profile</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenContainer>
    );
}
