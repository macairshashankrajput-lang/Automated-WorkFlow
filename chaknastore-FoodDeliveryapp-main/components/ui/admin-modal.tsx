/**
 * Admin Modal / Bottom Sheet
 * For forms, confirmations, CRUD operations
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { IconSymbol } from './icon-symbol';

interface AdminModalProps {
    isVisible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    actionButton?: { label: string; onPress: () => void; variant?: 'primary' | 'destructive' };
}

export function AdminModal({ isVisible, onClose, title, children, actionButton }: AdminModalProps) {
    return (
        <View className={`absolute inset-0 bg-black/50 z-50 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
            <View className="bg-surface rounded-t-3xl p-6 shadow-2xl" style={{ maxHeight: '90%' }}>
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                    <View>
                        <Text className="text-2xl font-bold text-foreground">{title}</Text>
                        <View className="h-1 w-12 bg-primary rounded-full mt-1" />
                    </View>
                    <TouchableOpacity onPress={onClose} className="p-2 bg-muted/10 rounded-full">
                        <IconSymbol name="xmark" size={20} color="hsl(var(--foreground))" />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView 
                    className="flex-none" 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    {children}
                </ScrollView>

                {/* Actions */}
                {actionButton && (
                    <View className="flex-row gap-3 mt-6 pt-4 border-t border-border">
                        <TouchableOpacity
                            className="flex-1 bg-background border border-border rounded-lg py-3 items-center"
                            onPress={onClose}
                        >
                            <Text className="text-foreground font-semibold">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`flex-1 rounded-lg py-3 items-center ${actionButton.variant === 'destructive'
                                ? 'bg-error'
                                : 'bg-primary'
                                }`}
                            onPress={actionButton.onPress}
                        >
                            <Text className={`font-bold ${actionButton.variant === 'destructive' ? 'text-white' : 'text-white'
                                }`}>
                                {actionButton.label}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

