/**
 * Cart Context - Complete Implementation
 * Manages shopping cart state with persistence
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local type definitions
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    available: boolean;
    vendorId: string;


    createdAt: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
    addedAt: string;
}

interface CartState {
    items: CartItem[];
    totals: {
        subtotal: number;
        tax: number; // 5%
        delivery: number; // fixed 50
        total: number;
    };
}

type CartAction =
    | { type: 'INIT'; payload: CartItem[] }
    | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
    | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
    | { type: 'REMOVE_ITEM'; payload: { productId: string } }
    | { type: 'CLEAR_CART' };

const CART_STORAGE_KEY = 'cart_items';
const TAX_RATE = 0.05; // 5%
const DELIVERY_FEE = 50;

const initialState: CartState = {
    items: [],
    totals: { subtotal: 0, tax: 0, delivery: DELIVERY_FEE, total: DELIVERY_FEE },
};

function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case 'INIT':
            return {
                ...state,
                items: action.payload,
                totals: calculateTotals(action.payload),
            };

        case 'ADD_ITEM': {
            const existingIndex = state.items.findIndex(item => item.product.id === action.payload.product.id);
            let newItems: CartItem[];
            if (existingIndex >= 0) {
                newItems = state.items.map((item, index) =>
                    index === existingIndex
                        ? { ...item, quantity: item.quantity + action.payload.quantity }
                        : item
                );
            } else {
                newItems = [
                    ...state.items,
                    {
                        product: action.payload.product,
                        quantity: action.payload.quantity,
                        addedAt: new Date().toISOString(),
                    },
                ];
            }
            return {
                ...state,
                items: newItems,
                totals: calculateTotals(newItems),
            };
        }

        case 'UPDATE_QUANTITY': {
            const newItems = state.items.map(item =>
                item.product.id === action.payload.productId
                    ? { ...item, quantity: action.payload.quantity }
                    : item
            ).filter(item => item.quantity > 0);
            return {
                ...state,
                items: newItems,
                totals: calculateTotals(newItems),
            };
        }

        case 'REMOVE_ITEM': {
            const newItems = state.items.filter(item => item.product.id !== action.payload.productId);
            return {
                ...state,
                items: newItems,
                totals: calculateTotals(newItems),
            };
        }

        case 'CLEAR_CART':
            return initialState;

        default:
            return state;
    }
}

function calculateTotals(items: CartItem[]): CartState['totals'] {
    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = subtotal + tax + DELIVERY_FEE;
    return {
        subtotal: Math.round(subtotal * 100) / 100,
        tax,
        delivery: DELIVERY_FEE,
        total: Math.round(total * 100) / 100
    };
}

interface CartContextType {
    state: CartState;
    addItem: (product: Product, quantity: number) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    removeItem: (productId: string) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(cartReducer, initialState);

    // Persist cart
    useEffect(() => {
        loadCart();
    }, []);

    useEffect(() => {
        if (state.items.length > 0) {
            saveCart(state.items);
        } else {
            AsyncStorage.removeItem(CART_STORAGE_KEY);
        }
    }, [state.items]);

    const loadCart = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
            if (stored) {
                const items: CartItem[] = JSON.parse(stored);
                dispatch({ type: 'INIT', payload: items });
            }
        } catch (e) {
            console.error('Load cart failed:', e);
        }
    }, []);

    const saveCart = useCallback(async (items: CartItem[]) => {
        try {
            const json = JSON.stringify(items);
            await AsyncStorage.setItem(CART_STORAGE_KEY, json);
        } catch (e) {
            console.error('Save cart failed:', e);
        }
    }, []);

    const addItem = useCallback((product: Product, quantity: number) => {
        dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
    }, []);

    const removeItem = useCallback((productId: string) => {
        dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
    }, []);

    const clearCart = useCallback(() => {
        dispatch({ type: 'CLEAR_CART' });
    }, []);

    const value: CartContextType = {
        state,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

