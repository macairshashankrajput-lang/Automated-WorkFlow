import { Stack } from 'expo-router';

export default function CateringRequestsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: 'Catering Requests' }} />
        </Stack>
    );
}

