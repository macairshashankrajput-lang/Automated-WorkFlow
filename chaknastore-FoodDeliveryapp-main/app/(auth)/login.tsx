/**
 * Login Screen
 * User authentication with username and password
 * Demo credentials available for testing
 */

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';

const appLogo = require('@/applogo.png');

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, state } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const handleLogin = async () => {
    if (!identifier.trim()) {
      Alert.alert('Error', 'Please enter your username or phone number');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(identifier.trim(), password);
      if (result?.user) {
        router.replace('/');
      }
    } catch (error: any) {
      const message = error?.message || state.error || 'Invalid credentials. Try your username and password.';
      Alert.alert('Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
        <View className="px-6">
          {/* Header */}
          <View className="mb-6 items-center">
            <View className="mb-4 items-center justify-center">
              <Image
                source={appLogo}
                style={{ width: 140, height: 140, resizeMode: 'contain' }}
              />
            </View>
            <Text className="text-4xl font-bold text-primary mb-2 text-center">Chakna Store</Text>
            <Text className="text-lg text-foreground mb-1">Welcome Back</Text>
            <Text className="text-base text-muted">Sign in to your account</Text>
          </View>

          {/* Username / Phone Input */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Username or Phone</Text>
            <TextInput
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="username or +91 98765 43210"
              placeholderTextColor="#687076"
              value={identifier}
              onChangeText={setIdentifier}
              editable={!isLoading}
              keyboardType="default"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-semibold text-foreground">Password</Text>
              <TouchableOpacity onPress={() => router.push('./forgot')}>
                <Text className="text-sm text-primary font-semibold">Forgot?</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="••••••••"
              placeholderTextColor="#687076"
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
              secureTextEntry
            />
          </View>

          {/* Error Message */}
          {state.error && (
            <View className="bg-error/10 border border-error rounded-lg px-4 py-3 mb-4">
              <Text className="text-error text-sm">{state.error}</Text>
            </View>
          )}

          {/* Login Button */}
          <TouchableOpacity
            className="w-full bg-primary rounded-lg py-4 items-center mb-4"
            onPress={handleLogin}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.6 : 1 }}
          >
            <Text className="text-background font-bold text-base">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View className="flex-row justify-center items-center mt-6">
            <Text className="text-muted text-sm">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('./register')}>
              <Text className="text-primary font-bold text-sm">Sign Up</Text>
            </TouchableOpacity>
          </View>


          {/* Demo Credentials & Support */}
          <View className="mt-8 pt-6 border-t border-border">
            <Text className="text-xs text-muted text-center mb-2">Demo account is not configured for public builds.</Text>
            <Text className="text-xs text-muted text-center">For customer signup or admin support, contact us.</Text>
          </View>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
