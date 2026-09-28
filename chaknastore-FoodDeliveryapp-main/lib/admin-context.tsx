/**
 * Admin Context for shared state
 * Selected items, filters, etc.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { orderService, reviewService, userService } from './supabase-service';

interface KPIStats {
    totalOrders: number;
    revenue: number;
    avgOrderValue: number;
    activeUsers: number;
    totalVendors: number;
    isLoading: boolean;
    error: string | null;
}

interface AdminContextType {
    selectedItems: string[];
    setSelectedItems: (items: string[]) => void;
    bulkActions: {
        delete: () => void;
        approveAll: () => Promise<void>;
        rejectAll: () => Promise<void>;
    };
    filters: Record<string, string>;
    setFilter: (key: string, value: string) => void;
    pendingReviewsCount: number;
    setPendingReviewsCount: (count: number) => void;
    kpis: KPIStats;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [pendingReviewsCount, setPendingReviewsCount] = useState(0);

    const [kpis, setKpis] = useState<KPIStats>({
        totalOrders: 0,
        revenue: 0,
        avgOrderValue: 0,
        activeUsers: 0,
        totalVendors: 0,
        isLoading: true,
        error: null,
    });

    const setFilter = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const bulkActions = {
        delete: () => {

            setSelectedItems([]);
        },
        approveAll: async () => {

        },
        rejectAll: async () => {

        },
    };

    useEffect(() => {
        let customerInterval: ReturnType<typeof setInterval>;

        const loadKPIs = async () => {
            try {
                setKpis((prev) => ({ ...prev, isLoading: true, error: null }));

                const [ordersResult, customerCountResult, vendorCountResult, reviewsResult] = await Promise.allSettled([
                    orderService.getAllOrders(),
                    userService.getCustomerCount(),
                    userService.getActiveVendorCount(),
                    reviewService.getAllReviews(),
                ]);

                const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : [];
                const totalOrders = orders.length;
                // totalPrice is reliably set by getAllOrders() camelCase mapper
                const revenue = orders.reduce((sum, order) => sum + (order.totalPrice ?? 0), 0);
                const avgOrderValue = totalOrders > 0 ? Math.round(revenue / totalOrders) : 0;
                const activeUsers = customerCountResult.status === 'fulfilled' ? customerCountResult.value : 0;
                const totalVendors = vendorCountResult.status === 'fulfilled' ? vendorCountResult.value : 0;
                const pendingReviewsCount = reviewsResult.status === 'fulfilled'
                    ? reviewsResult.value.filter((review) => review.status === 'pending').length
                    : 0;

                setPendingReviewsCount(pendingReviewsCount);
                setKpis({
                    totalOrders,
                    revenue,
                    avgOrderValue,
                    activeUsers,
                    totalVendors,
                    isLoading: false,
                    error: null,
                });
            } catch (error: any) {
                setKpis((prev) => ({ ...prev, isLoading: false, error: error.message || 'Failed to load data' }));
            }
        };

        loadKPIs();
        customerInterval = setInterval(loadKPIs, 30000);

        return () => {
            if (customerInterval) clearInterval(customerInterval);
        };
    }, []);

    return (
        <AdminContext.Provider
            value={{
                selectedItems,
                setSelectedItems,
                bulkActions,
                filters,
                setFilter,
                pendingReviewsCount,
                setPendingReviewsCount,
                kpis,
            }}
        >
            {children}
        </AdminContext.Provider>
    );
}

export function useAdminContext() {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdminContext must be used within AdminProvider');
    }
    return context;
}

