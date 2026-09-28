import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { forgotPassword } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async () => {
        if (!identifier.trim()) {
            Alert.alert('Error', 'Please enter your username, email or phone number');
            return;
        }

        setIsLoading(true);
        try {
            await forgotPassword(identifier.trim());
            Alert.alert(
                'Reset Link Sent',
                'If an account exists, a password reset link has been sent to the associated email.',
                [{ text: 'Back to Login', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to request reset');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScreenContainer className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6">
                <View className="mb-8">
                    <Text className="text-3xl font-bold text-foreground mb-2">Reset Password</Text>
                    <Text className="text-muted">Enter your username or phone to receive a reset link.</Text>
                </View>

                <View className="mb-6">
                    <Text className="text-sm font-semibold text-foreground mb-2">Username, Email or Phone</Text>
                    <TextInput
                        className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                        placeholder="your identifier"
                        value={identifier}
                        onChangeText={setIdentifier}
                        autoCapitalize="none"
                        editable={!isLoading}
                    />
                </View>

                <TouchableOpacity
                    className="w-full bg-primary rounded-xl py-4 items-center mb-4"
                    onPress={handleReset}
                    disabled={isLoading}
                    style={{ opacity: isLoading ? 0.6 : 1 }}
                >
                    <Text className="text-white font-bold text-lg">
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-primary text-center font-semibold">Back to Login</Text>
                </TouchableOpacity>
            </ScrollView>
        </ScreenContainer>
    );
}
