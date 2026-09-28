import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { ScreenContainer } from '@/components/screen-container';
import { userService, supabase } from '@/lib/supabase-service';

export default function VendorEditProfileScreen() {
    const router = useRouter();
    const { state, restoreToken } = useAuth();
    const user = state.user;

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        businessName: user?.businessName || '',
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
            } as any);

            // Update business name separately if it's in the users table
            // In our schema, business_name is on the users table for vendors
            const { error: bizError } = await supabase
                .from('users')
                .update({ business_name: formData.businessName })
                .eq('id', user.id);
            
            if (bizError) throw bizError;
            
            await restoreToken();
            
            Alert.alert('Success', 'Business profile updated successfully', [
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
                        <Text className="text-3xl font-bold text-foreground">Edit Business</Text>
                    </View>

                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-foreground mb-2">Business Name</Text>
                        <TextInput
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                            value={formData.businessName}
                            onChangeText={(v) => setFormData(prev => ({ ...prev, businessName: v }))}
                            placeholder="Your Shop Name"
                        />
                    </View>

                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-foreground mb-2">Owner Name</Text>
                        <TextInput
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                            value={formData.name}
                            onChangeText={(v) => setFormData(prev => ({ ...prev, name: v }))}
                            placeholder="Your Name"
                        />
                    </View>

                    <View className="mb-8">
                        <Text className="text-sm font-semibold text-foreground mb-2">Contact Phone</Text>
                        <TextInput
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                            value={formData.phone}
                            onChangeText={(v) => setFormData(prev => ({ ...prev, phone: v }))}
                            placeholder="Phone Number"
                            keyboardType="phone-pad"
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
