/**
 * Skeleton Loading Animation
 */

import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface SkeletonLoaderProps {
    type?: 'card' | 'list' | 'table';
    count?: number;
}

export function SkeletonLoader({ type = 'card', count = 5 }: SkeletonLoaderProps) {
    return (
        <View className="flex-1 p-4">
            {Array.from({ length: count }).map((_, i) => (
                <Animated.View
                    key={i}
                    entering={FadeIn.delay(i * 100)}
                    className={`bg-surface/50 rounded-lg p-4 mb-3 animate-pulse ${type === 'list' ? 'h-20' : type === 'table' ? 'h-16' : 'h-24'
                        }`}
                    style={{ borderWidth: 1, borderColor: 'hsl(var(--border))' }}
                >
                    <View className="h-4 bg-surface/20 rounded w-3/4 mb-2" />
                    <View className="h-3 bg-surface/20 rounded w-1/2" />
                </Animated.View>
            ))}
        </View>
    );
}

