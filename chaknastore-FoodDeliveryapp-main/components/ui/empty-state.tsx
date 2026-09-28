import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface EmptyStateProps {
    emoji: string;
    title: string;
    description: string;
    buttonLabel?: string;
    onButtonPress?: () => void;
}

export function EmptyState({ emoji, title, description, buttonLabel, onButtonPress }: EmptyStateProps) {
    return (
        <View className="flex-1 items-center justify-center py-12 px-8">
            <Text className="text-6xl mb-4">{emoji}</Text>
            <Text className="text-xl font-bold text-foreground text-center mb-2">{title}</Text>
            <Text className="text-base text-muted text-center mb-8 leading-relaxed">
                {description}
            </Text>
            
            {buttonLabel && onButtonPress && (
                <TouchableOpacity 
                    onPress={onButtonPress}
                    className="bg-primary px-8 py-4 rounded-2xl shadow-md"
                >
                    <Text className="text-background font-bold text-base">{buttonLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
