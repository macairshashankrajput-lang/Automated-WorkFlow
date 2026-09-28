import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

export default function PrivacyPolicyScreen() {
    const router = useRouter();

    return (
        <ScreenContainer className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View className="px-6 py-8">
                    <View className="flex-row items-center mb-8">
                        <TouchableOpacity onPress={() => router.back()} className="mr-4">
                            <Text className="text-2xl text-primary font-bold">←</Text>
                        </TouchableOpacity>
                        <Text className="text-3xl font-bold text-foreground">Privacy Policy</Text>
                    </View>

                    <Text className="text-muted mb-6">Last updated: April 22, 2026</Text>

                    <Section title="1. Information We Collect">
                        We collect information you provide directly to us, such as your name, email address, phone number, and delivery address. We also collect transaction details related to your orders.
                    </Section>

                    <Section title="2. How We Use Your Information">
                        We use the information we collect to:
                        - Process and fulfill your orders
                        - Send you transaction-related communications
                        - Improve our services and app experience
                        - Detect and prevent fraudulent activity
                    </Section>

                    <Section title="3. Sharing of Information">
                        We share your name, phone number, and delivery address with vendors and delivery personnel only for the purpose of fulfilling your orders. We do not sell your personal data to third parties.
                    </Section>

                    <Section title="4. Data Security">
                        We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
                    </Section>

                    <Section title="5. Your Choices">
                        You can update your profile information at any time through the app settings. You may also request the deletion of your account by contacting our support team.
                    </Section>

                    <Section title="6. Cookies & Tracking">
                        Our app may use cookies and similar technologies to enhance your experience and analyze app usage.
                    </Section>

                    <Section title="7. Changes to This Policy">
                        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
                    </Section>

                    <View className="mt-8 pb-10">
                        <Text className="text-center text-muted text-xs">
                            If you have any questions about this Privacy Policy, please contact us at privacy@chakna.app
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
