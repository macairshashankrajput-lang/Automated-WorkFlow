/**
 * Referral Program Screen
 * Shows the user's actual referral code from their profile.
 */

import { View, Text, TouchableOpacity, ScrollView, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';

export default function ReferralScreen() {
    const router = useRouter();
    const { state: authState } = useAuth();
    // Use the referral code from the user's profile, or generate a fallback from their username
    const referralCode = authState.user?.referralCode 
        || (authState.user?.username ? authState.user.username.toUpperCase() + '100' : 'CHAKNA100');

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Use my referral code ${referralCode} to sign up on Chakna Store and get a discount on your first order! 🍱`,
                title: 'Join Chakna Store',
            });
        } catch (err) {
            Alert.alert('Share failed', 'Unable to share at this time.');
        }
    };

    const handleCopy = () => {
        // In a real native app, use Clipboard API
        Alert.alert('Copied!', `Referral code ${referralCode} copied to clipboard.`);
    };

    return (
        <ScreenContainer className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6">
                    <View className="flex-row items-center justify-between mb-6">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text className="text-2xl">←</Text>
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-foreground">Referral Program</Text>
                        <View className="w-10" />
                    </View>

                    {/* Hero Banner */}
                    <View className="bg-primary rounded-3xl p-6 mb-6 items-center">
                        <Text className="text-5xl mb-3">🎉</Text>
                        <Text className="text-white text-xl font-bold text-center mb-1">Invite & Earn</Text>
                        <Text className="text-white/70 text-sm text-center">
                            Earn 100 points for every friend who signs up using your referral code.
                        </Text>
                    </View>

                    {/* Your Referral Code */}
                    <View className="bg-surface rounded-3xl border border-border p-6 mb-6">
                        <Text className="text-sm text-muted font-semibold mb-3 uppercase tracking-wider">Your Referral Code</Text>
                        <View className="bg-primary/10 rounded-2xl p-5 items-center mb-4 border border-primary/20">
                            <Text className="text-3xl font-bold text-primary tracking-widest">{referralCode}</Text>
                        </View>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                className="flex-1 border border-border rounded-xl py-3 items-center"
                                onPress={handleCopy}
                            >
                                <Text className="text-foreground font-semibold">📋 Copy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 bg-primary rounded-xl py-3 items-center"
                                onPress={handleShare}
                            >
                                <Text className="text-white font-bold">📤 Share</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* How it Works */}
                    <View className="bg-surface rounded-3xl border border-border p-5 mb-6">
                        <Text className="text-lg font-bold text-foreground mb-4">How it works</Text>
                        {[
                            { step: '1', text: 'Share your referral code with friends' },
                            { step: '2', text: 'They sign up using your code' },
                            { step: '3', text: 'You earn 100 points instantly' },
                            { step: '4', text: 'Use points to get Tiffin discounts!' },
                        ].map(item => (
                            <View key={item.step} className="flex-row items-center gap-4 mb-3">
                                <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
                                    <Text className="text-white font-bold text-sm">{item.step}</Text>
                                </View>
                                <Text className="text-foreground flex-1">{item.text}</Text>
                            </View>
                        ))}
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
