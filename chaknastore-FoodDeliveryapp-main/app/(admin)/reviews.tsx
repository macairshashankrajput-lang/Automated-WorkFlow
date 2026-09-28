/**
 * Admin Reviews Screen - Refactored with DataTable
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { AdminDataTable } from '@/components/ui/admin-data-table';
import { AdminProvider, useAdminContext } from '@/lib/admin-context';
import { reviewService, type Review } from '@/lib/supabase-service';
import { IconSymbol } from '@/components/ui/icon-symbol';

function ReviewsContent() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { bulkActions, selectedItems, setPendingReviewsCount } = useAdminContext();

  useEffect(() => {
    // Real-time listener for all reviews
    const unsubscribe = reviewService.subscribeToReviews((fetchedReviews) => {
      setReviews(fetchedReviews);
      const count = fetchedReviews.filter(r => r.status === 'pending').length;
      setPendingReviewsCount(count);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (reviewId: string) => {
    try {
      await reviewService.updateReviewStatus(reviewId, 'approved');
      Alert.alert('Success', 'Review approved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve review');
    }
  };

  const handleReject = async (reviewId: string) => {
    Alert.alert(
      'Reject Review',
      'Are you sure you want to reject this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            reviewService.updateReviewStatus(reviewId, 'rejected').catch(() => Alert.alert('Error', 'Failed to reject'));
          }
        }
      ]
    );
  };

  const renderReview = ({ item }: { item: Review }) => {
    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A';
    return (
      <View className="p-4 bg-surface rounded-lg border border-border mb-2">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="font-bold text-foreground">{item.userName || 'Anonymous'}</Text>
          <Text className="text-yellow-400 font-bold">{'★'.repeat(item.rating)}</Text>
        </View>
        <Text className="text-sm text-muted mb-2">{date}</Text>
        <Text className="text-foreground mb-3">{item.comment || 'No comment'}</Text>
        <View className="flex-row gap-2 mb-3">
          <Text className={`px-2 py-1 rounded text-xs font-semibold capitalize ${item.status === 'approved' ? 'bg-success/20 text-success' :
            item.status === 'rejected' ? 'bg-error/20 text-error' :
              'bg-warning/20 text-warning'
            }`}>
            {item.status || 'pending'}
          </Text>
        </View>
        {/* Action Buttons */}
        {item.status === 'pending' && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 bg-success/20 border border-success/30 rounded-lg p-2 items-center"
              onPress={() => handleApprove(item.id.toString())}
            >
              <IconSymbol name="checkmark.circle.fill" color="hsl(var(--success))" size={20} />
              <Text className="text-success text-xs font-semibold mt-1">Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-error/20 border border-error/30 rounded-lg p-2 items-center"
              onPress={() => handleReject(item.id.toString())}
            >
              <IconSymbol name="xmark.circle.fill" color="hsl(var(--error))" size={20} />
              <Text className="text-error text-xs font-semibold mt-1">Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const freshReviews = await reviewService.getAllReviews();
      setReviews(freshReviews);
      const count = freshReviews.filter(r => r.status === 'pending').length;
      setPendingReviewsCount(count);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Bulk approve selected pending reviews
  const handleBulkApprove = async () => {
    const pendingSelected = selectedItems.filter(id =>
      reviews.find(r => r.id.toString() === id && r.status === 'pending')
    );
    if (pendingSelected.length === 0) {
      Alert.alert('No Action', 'Select pending reviews to approve.');
      return;
    }
    try {
      await Promise.all(
        pendingSelected.map(id => reviewService.updateReviewStatus(id, 'approved'))
      );
      Alert.alert('Success', `${pendingSelected.length} reviews approved!`);
      bulkActions.delete(); // Clear selection
    } catch (error) {
      Alert.alert('Error', 'Bulk approve failed');
    }
  };

  return (
    <AdminDataTable
      data={reviews}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderReview as any}
      filterOptions={[
        { label: 'All', value: 'all' },
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ]}
      searchKeys={['customerName', 'itemName', 'comment'] as any}
      loading={loading}
      onRefresh={handleRefresh}
      emptyTitle="No Reviews"
      emptyDescription="No customer reviews to moderate. Reviews will appear here when customers submit them."
    />
  );
}

export default function AdminReviewsScreen() {
  return (
    <ScreenContainer className="flex-1 bg-background">
      <ReviewsContent />
    </ScreenContainer>
  );
}

