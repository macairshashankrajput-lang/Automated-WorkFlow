/**
 * Admin Catering Requests Screen
 * View and manage customer catering service requests
 */

import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useState, useEffect, useCallback } from 'react';
import { cateringService } from '@/lib/supabase-service';

export default function AdminCateringScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchRequests = useCallback(async () => {
    try {
      const data = await cateringService.getAllRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch catering requests:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchRequests();
  };

  const filteredRequests = requests.filter(req =>
    filterStatus === 'all' ? true : req.status === filterStatus
  );

  const handleApprove = (id: string | number) => {
    Alert.alert('Approve Request', 'Send approval to customer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await cateringService.updateRequestStatus(id, 'approved');
            setRequests(requests.map(r => r.id === id ? { ...r, status: 'approved' } : r));
            Alert.alert('Success', 'Request approved and customer notified');
          } catch (error) {
            Alert.alert('Error', 'Failed to update request status');
          }
        },
      },
    ]);
  };

  const handleReject = (id: string | number) => {
    Alert.alert('Reject Request', 'Are you sure? Customer will be notified.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        onPress: async () => {
          try {
            await cateringService.updateRequestStatus(id, 'rejected');
            setRequests(requests.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
            Alert.alert('Success', 'Request rejected');
          } catch (error) {
            Alert.alert('Error', 'Failed to update request status');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-foreground mb-2">Catering Requests</Text>
            <Text className="text-muted text-sm">Customer catering service requests</Text>
          </View>

          {/* Filter Buttons */}
          <View className="flex-row gap-2 mb-6 flex-wrap">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
              <TouchableOpacity
                key={status}
                className={`px-4 py-2 rounded-full ${filterStatus === status ? 'bg-primary' : 'bg-surface border border-border'
                  }`}
                onPress={() => setFilterStatus(status)}
              >
                <Text
                  className={`text-sm font-semibold capitalize ${filterStatus === status ? 'text-white' : 'text-foreground'
                    }`}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Requests List */}
          <View>
            {isLoading ? (
              <View className="items-center py-20">
                <ActivityIndicator size="large" color="#E25C3D" />
                <Text className="text-muted mt-4">Loading requests...</Text>
              </View>
            ) : filteredRequests.length > 0 ? (
              filteredRequests.map(request => (
                <View
                  key={request.id}
                  className="bg-surface rounded-lg p-4 mb-3 border border-border"
                >
                  {/* Request Header */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground">
                        {request.menu_preferences || 'Catering Request'}
                      </Text>
                      <Text className="text-sm text-muted">{request.users?.name || 'Unknown'}</Text>
                    </View>
                    <View
                      className={`px-2 py-1 rounded ${request.status === 'approved'
                          ? 'bg-success/20'
                          : request.status === 'rejected'
                            ? 'bg-error/20'
                            : 'bg-warning/20'
                        }`}
                    >
                      <Text
                        className={`text-xs font-semibold capitalize ${request.status === 'approved'
                            ? 'text-success'
                            : request.status === 'rejected'
                               ? 'text-error'
                               : 'text-warning'
                          }`}
                      >
                        {request.status}
                      </Text>
                    </View>
                  </View>

                  {/* Request Details */}
                  <View className="gap-2 mb-3 pb-3 border-b border-border">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted">Phone</Text>
                      <Text className="text-sm text-foreground font-semibold">{request.users?.phone || 'N/A'}</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted">Event Date</Text>
                      <Text className="text-sm text-foreground font-semibold">
                        {request.event_date ? new Date(request.event_date).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted">Guests</Text>
                      <Text className="text-sm text-foreground font-semibold">{request.guest_count || 0}</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted">Budget</Text>
                      <Text className="text-sm text-primary font-bold">₹{request.budget || 0}</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted">Location</Text>
                      <Text className="text-sm text-foreground font-semibold text-right flex-1 ml-4" numberOfLines={1}>{request.location || 'N/A'}</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted">Submitted</Text>
                      <Text className="text-sm text-foreground font-semibold">
                        {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  {request.status === 'pending' && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="flex-1 bg-success/20 rounded-lg py-2 items-center"
                        onPress={() => handleApprove(request.id)}
                      >
                        <Text className="text-success font-bold text-sm">Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 bg-error/20 rounded-lg py-2 items-center"
                        onPress={() => handleReject(request.id)}
                      >
                        <Text className="text-error font-bold text-sm">Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View className="items-center py-8">
                <Text className="text-muted text-base">No requests found</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
