/**
 * Authentication Context
 * Manages user authentication state, role-based routing, and Supabase integration
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as customAuth from '@/lib/_core/auth';
import { DEFAULT_ADMIN_CREDENTIALS } from './default-credentials';
import * as supabaseAuth from './supabase-auth';
import { notificationManager } from './notification-manager';

export type UserRole = 'customer' | 'vendor' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  deliveryLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  referralCode?: string;
  businessName?: string;
  createdAt: string;
}

export interface AuthState {
  isLoading: boolean;
  isSignout: boolean;
  user: User | null;
  userToken: string | null;
  error: string | null;
}

export type AuthAction =
  | { type: 'RESTORE_TOKEN'; payload: { token: string | null; user: User | null } }
  | { type: 'SIGN_IN_SUCCESS'; payload: { token: string; user: User } }
  | { type: 'SIGN_UP_SUCCESS'; payload: { token: string; user: User } }
  | { type: 'SIGN_OUT' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  isLoading: true,
  isSignout: false,
  user: null,
  userToken: null,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        isLoading: false,
        userToken: action.payload.token,
        user: action.payload.user,
      };
    case 'SIGN_IN_SUCCESS':
      return {
        ...state,
        isSignout: false,
        userToken: action.payload.token,
        user: action.payload.user,
        error: null,
      };
    case 'SIGN_UP_SUCCESS':
      return {
        ...state,
        isSignout: false,
        userToken: action.payload.token,
        user: action.payload.user,
        error: null,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        isSignout: true,
        userToken: null,
        user: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  signIn: (identifier: string, password: string) => Promise<{ token: string; user: User }>;
  signUp: (userData: Omit<User, 'id' | 'createdAt' | 'email'> & { password: string; email?: string }) => Promise<{ token: string | null; user: User }>;
  forgotPassword: (identifier: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  restoreToken: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const restoreToken = useCallback(async () => {
    try {
      let token = await AsyncStorage.getItem('userToken');
      let user = null;
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        user = JSON.parse(userJson);
      }

      if (!token || !user) {
        const oauthToken = await customAuth.getSessionToken();
        const oauthUserInfo = await customAuth.getUserInfo();
        if (oauthToken && oauthUserInfo?.openId) {
          const appUser = await supabaseAuth.getUserByOpenId(oauthUserInfo.openId);
          if (appUser) {
            token = oauthToken;
            user = appUser;
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));
          }
        }
      }

      if ((!token || !user) && !user) {
        const sessionResult = await supabaseAuth.getCurrentSession();
        if (sessionResult.user) {
          token = token || sessionResult.token;
          user = sessionResult.user;
          if (token) {
            await AsyncStorage.setItem('userToken', token);
          }
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }
      }

      dispatch({ type: 'RESTORE_TOKEN', payload: { token, user } });
    } catch (e) {
      console.error('Failed to restore token:', e);
      dispatch({ type: 'RESTORE_TOKEN', payload: { token: null, user: null } });
    }
  }, []);

  useEffect(() => {
    restoreToken();
  }, [restoreToken]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      const result = await supabaseAuth.signIn(identifier, password);
      await Promise.all([
        AsyncStorage.setItem('userToken', result.token),
        AsyncStorage.setItem('user', JSON.stringify(result.user)),
      ]);
      dispatch({ type: 'SIGN_IN_SUCCESS', payload: { token: result.token, user: result.user } });
      
      // Register for push notifications in the background
      setTimeout(() => {
        notificationManager.registerForPushNotifications(result.user.id).catch(console.error);
      }, 1000);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const signUp = useCallback(async (userData: Omit<User, 'id' | 'createdAt' | 'email'> & { password: string; email?: string }) => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      const { email, password, phone, referralCode, name, username, deliveryLocation } = userData;
      const result = await supabaseAuth.signUpCustomer(username, password, name, email, phone, referralCode, deliveryLocation);
      if (result.token) {
        await Promise.all([
          AsyncStorage.setItem('userToken', result.token),
          AsyncStorage.setItem('user', JSON.stringify(result.user)),
        ]);
        dispatch({ type: 'SIGN_UP_SUCCESS', payload: { token: result.token, user: result.user } });
      }
      return { token: result.token, user: result.user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const forgotPassword = useCallback(async (identifier: string) => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      await supabaseAuth.resetPassword(identifier);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      await supabaseAuth.signInWithGoogle();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabaseAuth.signOutUser();
      dispatch({ type: 'SIGN_OUT' });
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextType = {
    state,
    signIn,
    signUp,
    forgotPassword,
    signInWithGoogle,
    signOut,
    restoreToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function getDefaultAdminCredentials() {
  return DEFAULT_ADMIN_CREDENTIALS;
}
