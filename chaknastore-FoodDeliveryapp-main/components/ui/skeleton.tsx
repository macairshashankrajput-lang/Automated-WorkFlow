import React, { useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height: number;
    borderRadius?: number;
    className?: string;
}

export function Skeleton({ width = '100%', height, borderRadius = 8, className = "" }: SkeletonProps) {
    const opacity = new Animated.Value(0.3);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View 
            className={`bg-muted/20 ${className}`}
            style={{ 
                width, 
                height, 
                borderRadius,
                opacity 
            }} 
        />
    );
}
