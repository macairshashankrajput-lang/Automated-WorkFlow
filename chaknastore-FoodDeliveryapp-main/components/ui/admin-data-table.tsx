/**
 * Admin Data Table Component
 * Reusable list with search, filters, pagination, swipe actions
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, Alert, RefreshControl } from 'react-native';
import { useAdminContext } from '@/lib/admin-context';
import { SkeletonLoader } from './skeleton-loader';
import { EmptyState } from './empty-state';
import { IconSymbol } from './icon-symbol';

interface DataTableProps<T> {
    data: T[];
    keyExtractor: (item: T) => string;
    renderItem: ({ item }: { item: T }) => React.ReactElement | null;
    searchKeys?: (keyof T)[];
    filterOptions?: { label: string; value: string }[];
    onRefresh?: () => Promise<void>;
    loading?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
}

export function AdminDataTable<T>({
    data,
    keyExtractor,
    renderItem,
    searchKeys = [],
    filterOptions,
    onRefresh,
    loading = false,
    emptyTitle = 'No Data',
    emptyDescription = 'No items found matching your criteria.'
}: DataTableProps<T>) {
    const { selectedItems, setSelectedItems } = useAdminContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    const filteredData = data.filter(item => {
        if (searchKeys.length === 0) return true;
        const searchValue = searchQuery.toLowerCase();
        return searchKeys.some(key => {
            const value = (item[key as keyof T] as string)?.toLowerCase();
            return value?.includes(searchValue);
        });
    }).filter(item => {
        if (activeFilter === 'all') return true;
        // Assume items have status field; customize per use
        return (item as any).status === activeFilter;
    });

    const handleSelectAll = useCallback(() => {
        if (selectedItems.length === filteredData.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredData.map(keyExtractor));
        }
    }, [filteredData, selectedItems]);

    const handleDeleteSelected = () => {
        Alert.alert(
            'Delete Selected',
            `Delete ${selectedItems.length} items?`,
            [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive' }]
        );
    };

    if (loading) {
        return <SkeletonLoader type="list" count={10} />;
    }

    return (
        <View className="flex-1">
            {/* Search & Filters */}
            <View className="px-4 py-4 bg-surface border-b border-border">
                <TextInput
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 mb-3 text-foreground"
                    placeholder="Search..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {filterOptions && (
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                    >
                        {[{ label: 'All', value: 'all' }, ...filterOptions].map(option => (
                            <TouchableOpacity
                                key={option.value}
                                className={`px-4 py-2 rounded-full ${activeFilter === option.value ? 'bg-primary' : 'bg-background border border-border'
                                    }`}
                                onPress={() => setActiveFilter(option.value)}
                            >
                                <Text className={`text-sm font-semibold capitalize ${activeFilter === option.value ? 'text-white' : 'text-foreground'
                                    }`}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Header & Actions */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-surface border-b border-border">
                <Text className="text-base font-bold text-foreground">
                    {filteredData.length} items
                </Text>
                {selectedItems.length > 0 && (
                    <TouchableOpacity onPress={handleDeleteSelected} className="flex-row items-center gap-1">
                        <IconSymbol name="trash" size={20} color="hsl(var(--error))" />
                        <Text className="text-error font-semibold">Delete ({selectedItems.length})</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={filteredData}
                keyExtractor={keyExtractor}
                renderItem={({ item }) => renderItem({ item })}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
                    ) : undefined
                }
                ListEmptyComponent={
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                }
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

