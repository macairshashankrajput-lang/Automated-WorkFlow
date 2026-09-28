import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { ScreenContainer } from '@/components/screen-container';
import { userService } from '@/lib/supabase-service';

export default function EditProfileScreen() {
    const router = useRouter();
    const { state, restoreToken } = useAuth();
    const user = state.user;

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        address: user?.deliveryLocation?.address || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }
        if (!user?.id) return;

        setIsSaving(true);
        try {
            await userService.updateUserProfile(user.id, {
                name: formData.name,
                phone: formData.phone,
                deliveryLocation: formData.address ? { 
                    address: formData.address,
                    latitude: user.deliveryLocation?.latitude || 0,
                    longitude: user.deliveryLocation?.longitude || 0
                } : null
            } as any);
            
            // Refresh local state
            await restoreToken();
            
            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScreenContainer className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View className="px-6 py-8">
                    <View className="flex-row items-center mb-8">
                        <TouchableOpacity onPress={() => router.back()} className="mr-4">
                            <Text className="text-2xl text-primary font-bold">←</Text>
                        </TouchableOpacity>
                        <Text className="text-3xl font-bold text-foreground">Edit Profile</Text>
                    </View>

                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-foreground mb-2">Full Name</Text>
                        <TextInput
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                            value={formData.name}
                            onChangeText={(v) => setFormData(prev => ({ ...prev, name: v }))}
                            placeholder="Your Name"
                        />
                    </View>

                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-foreground mb-2">Phone Number</Text>
                        <TextInput
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                            value={formData.phone}
                            onChangeText={(v) => setFormData(prev => ({ ...prev, phone: v }))}
                            placeholder="Phone Number"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View className="mb-8">
                        <Text className="text-sm font-semibold text-foreground mb-2">Default Address</Text>
                        <TextInput
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                            value={formData.address}
                            onChangeText={(v) => setFormData(prev => ({ ...prev, address: v }))}
                            placeholder="Delivery Address"
                            multiline
                            numberOfLines={3}
                            style={{ textAlignVertical: 'top' }}
                        />
                    </View>

                    <TouchableOpacity 
                        className={`w-full bg-primary rounded-xl py-4 items-center shadow-lg ${isSaving ? 'opacity-70' : ''}`}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-background font-bold text-lg">Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenContainer>
    );
}
