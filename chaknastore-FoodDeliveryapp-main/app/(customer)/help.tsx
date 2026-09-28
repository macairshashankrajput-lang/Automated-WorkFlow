/**
 * Help & Support Screen
 * Provide support resources and contact information.
 */

import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

export default function HelpScreen() {
    const router = useRouter();

    return (
        <ScreenContainer className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6">
                    <View className="flex-row items-center justify-between mb-6">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text className="text-2xl">←</Text>
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-foreground">Help & Support</Text>
                        <View className="w-10" />
                    </View>

                    <View className="bg-surface rounded-3xl border border-border p-5 mb-6">
                        <Text className="text-base text-muted mb-4">Find answers to common questions or contact our support team.</Text>
                        <View className="mb-4 p-4 rounded-3xl bg-background border border-border">
                            <Text className="font-semibold text-foreground mb-1">How do I track my order?</Text>
                            <Text className="text-sm text-muted">Orders are tracked from the Orders screen with live status updates.</Text>
                        </View>
                        <View className="mb-4 p-4 rounded-3xl bg-background border border-border">
                            <Text className="font-semibold text-foreground mb-1">How do I use coupons?</Text>
                            <Text className="text-sm text-muted">Apply coupons from the Coupons & Rewards page during checkout.</Text>
                        </View>
                    </View>

                    <TouchableOpacity className="bg-primary rounded-3xl py-4 items-center mb-4">
                        <Text className="text-background font-bold">Contact Support</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="border border-border rounded-3xl py-4 items-center" onPress={() => router.push('./profile')}>
                        <Text className="text-foreground font-semibold">Back to Profile</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenContainer>
    );
}
