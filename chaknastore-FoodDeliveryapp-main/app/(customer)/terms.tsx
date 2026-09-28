import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

export default function TermsOfServiceScreen() {
    const router = useRouter();

    return (
        <ScreenContainer className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View className="px-6 py-8">
                    <View className="flex-row items-center mb-8">
                        <TouchableOpacity onPress={() => router.back()} className="mr-4">
                            <Text className="text-2xl text-primary font-bold">←</Text>
                        </TouchableOpacity>
                        <Text className="text-3xl font-bold text-foreground">Terms of Service</Text>
                    </View>

                    <Text className="text-muted mb-6">Last updated: April 22, 2026</Text>

                    <Section title="1. Acceptance of Terms">
                        By accessing or using the Chakna Store mobile application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.
                    </Section>

                    <Section title="2. Account Registration">
                        To use certain features of the app, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                    </Section>

                    <Section title="3. Food Ordering and Delivery">
                        Chakna Store facilitates ordering from third-party vendors and our own kitchen. While we strive for accuracy, menu items, prices, and availability are subject to change without notice. Delivery times are estimates and may vary due to traffic or weather.
                    </Section>

                    <Section title="4. Tiffin Subscriptions">
                        Tiffin subscriptions are billed in advance. Points added to your wallet are non-refundable but can be used for any meal within the subscription period. One complimentary date change per month is allowed.
                    </Section>

                    <Section title="5. Cancellations and Refunds">
                        Orders can be cancelled before the vendor starts cooking. Refunds for cancelled orders will be processed to the original payment method within 5-7 business days.
                    </Section>

                    <Section title="6. User Conduct">
                        Users agree not to misuse the application, harass delivery personnel, or provide false information during registration or checkout.
                    </Section>

                    <Section title="7. Limitation of Liability">
                        Chakna Store shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the service.
                    </Section>

                    <View className="mt-8 pb-10">
                        <Text className="text-center text-muted text-xs">
                            © 2026 Chakna Store. All rights reserved.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </ScreenContainer>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View className="mb-8">
            <Text className="text-xl font-bold text-foreground mb-3">{title}</Text>
            <Text className="text-base text-muted leading-relaxed">{children}</Text>
        </View>
    );
}
