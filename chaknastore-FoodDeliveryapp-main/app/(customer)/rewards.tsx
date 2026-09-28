/**
 * Coupons & Rewards Screen
 * Shows live points balance from Supabase and available rewards.
 */

import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-service';
import { useEffect, useState } from 'react';

export default function RewardsScreen() {
    const router = useRouter();
    const { state: authState } = useAuth();
    const [pointsBalance, setPointsBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');

    useEffect(() => {
        if (authState.user?.id) {
            fetchPoints();
        }
    }, [authState.user?.id]);

    const fetchPoints = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('points_balance')
                .eq('id', authState.user!.id)
                .single();
            if (error) throw error;
            setPointsBalance(data?.points_balance ?? 0);
        } catch (err) {
            console.error('Failed to fetch points:', err);
            setPointsBalance(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyCoupon = () => {
        if (!couponCode.trim()) {
            Alert.alert('Error', 'Please enter a coupon code');
            return;
        }
        Alert.alert('Coupon', `Coupon "${couponCode.toUpperCase()}" is not valid or has expired.`);
    };

    return (
        <ScreenContainer className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6">
                    <View className="flex-row items-center justify-between mb-6">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text className="text-2xl">←</Text>
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-foreground">Coupons & Rewards</Text>
                        <View className="w-10" />
                    </View>

                    {/* Points Balance Card */}
                    <View className="bg-primary rounded-3xl p-6 mb-6 items-center">
                        <Text className="text-white/70 text-sm mb-1">Your Points Balance</Text>
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-5xl font-bold text-white">{pointsBalance ?? 0}</Text>
                        )}
                        <Text className="text-white/70 text-sm mt-1">₹1 = 1 Point</Text>
                    </View>

                    {/* How Points Work */}
                    <View className="bg-surface rounded-3xl border border-border p-5 mb-6">
                        <Text className="text-lg font-bold text-foreground mb-3">How it works</Text>
                        <View className="gap-3">
                            {[
                                { icon: '🛒', text: 'Earn points on every order' },
                                { icon: '🎟️', text: 'Use points to subscribe to Tiffin' },
                                { icon: '👥', text: 'Earn 100 points for every referral' },
                            ].map((item, i) => (
                                <View key={i} className="flex-row items-center gap-3">
                                    <Text className="text-2xl">{item.icon}</Text>
                                    <Text className="text-foreground text-sm">{item.text}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Apply Coupon */}
                    <View className="bg-surface rounded-3xl border border-border p-5 mb-6">
                        <Text className="text-lg font-bold text-foreground mb-3">Apply Coupon</Text>
                        <View className="flex-row gap-2">
                            <TextInput
                                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                                placeholder="Enter coupon code"
                                placeholderTextColor="#687076"
                                value={couponCode}
                                onChangeText={setCouponCode}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity
                                className="bg-primary px-4 py-3 rounded-xl items-center justify-center"
                                onPress={handleApplyCoupon}
                            >
                                <Text className="text-white font-bold">Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

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
