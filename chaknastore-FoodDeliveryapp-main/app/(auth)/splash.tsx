/**
 * Splash Screen
 * Initial loading screen with app logo and branding
 */

import { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

const appLogo = require('@/applogo.png');

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Simulate loading and then navigate to login
    const timer = setTimeout(() => {
      // Always navigate to login - auth context will handle routing based on token
      router.replace('./login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <ScreenContainer className="flex-1 items-center justify-center bg-background">
      <View className="items-center gap-4">
        <View className="items-center justify-center">
          <Image
            source={appLogo}
            style={{ width: 160, height: 160, resizeMode: 'contain' }}
          />
        </View>

        <Text className="text-3xl font-bold text-foreground text-center">
          Chakna Store
        </Text>

        {/* Tagline */}
        <Text className="text-base text-muted text-center mt-2">
          Your Favorite Food, Delivered Fresh
        </Text>

        {/* Loading Indicator */}
        <View className="mt-8">
          <Text className="text-sm text-muted">Loading...</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
