import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { ActivityIndicator, View, Text } from 'react-native';

export default function Index() {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 13, fontWeight: 'bold' }}>
          Loading Chakna Store...
        </Text>
      </View>
    );
  }

  if (!state.user || !state.userToken) {
    return <Redirect href="/(auth)/login" />;
  }

  if (state.user.role === 'customer') {
    return <Redirect href="/(customer)/(tabs)" />;
  }

  if (state.user.role === 'vendor') {
    return <Redirect href="/(vendor)/(tabs)" />;
  }

  if (state.user.role === 'admin') {
    return <Redirect href="/(admin)/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
