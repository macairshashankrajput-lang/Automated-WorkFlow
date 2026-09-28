import { Stack } from 'expo-router';

export default function HiddenCustomerStack() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="checkout" />
            <Stack.Screen name="favorites" />
        </Stack>
    );
}
