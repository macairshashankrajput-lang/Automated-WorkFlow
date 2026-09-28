/**
 * Admin Reminder System Screen
 * Auto-suggest past similar orders based on dates and event types
 */

import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useState } from 'react';

interface PastOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  eventType: string;
  orderDate: string;
  guestCount: number;
  items: string[];
  totalAmount: number;
  daysAgo: number;
}

const pastOrders: PastOrder[] = [
  {
    id: '1',
    customerName: 'Rajesh Kumar',
    customerPhone: '9876543210',
    eventType: 'Wedding',
    orderDate: '2025-05-15',
    guestCount: 150,
    items: ['Samosa', 'Chivda', 'Namkeen Mix'],
    totalAmount: 75000,
    daysAgo: 365,
  },
  {
    id: '2',
    customerName: 'Priya Singh',
    customerPhone: '9123456789',
    eventType: 'Birthday',
    orderDate: '2025-04-20',
    guestCount: 50,
    items: ['Chivda', 'Peanuts'],
    totalAmount: 15000,
    daysAgo: 354,
  },
  {
    id: '3',
    customerName: 'Amit Patel',
    customerPhone: '9988776655',
    eventType: 'Anniversary',
    orderDate: '2025-03-10',
    guestCount: 75,
    items: ['Samosa', 'Namkeen Mix', 'Chivda'],
    totalAmount: 35000,
    daysAgo: 395,
  },
];

export const unstable_settings = {
  preserveState: true
};

export default function AdminRemindersScreen() {
  const [reminders, setReminders] = useState(pastOrders);
  const [contacted, setContacted] = useState<string[]>([]);

  const handleContactCustomer = (orderId: string, customerPhone: string) => {
    Alert.alert(
      'Contact Customer',
      `Call ${customerPhone} to remind about their order?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Contacted',
          onPress: () => {
            setContacted([...contacted, orderId]);
            Alert.alert('Success', 'Customer marked as contacted');
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-foreground mb-2">Reminder System</Text>
            <Text className="text-muted text-sm">
              Past similar orders - Contact customers for repeat orders
            </Text>
          </View>

          {/* Info Card */}
          <View className="bg-primary/10 border border-primary rounded-lg p-4 mb-6">
            <Text className="text-sm text-foreground leading-relaxed">
              These customers ordered similar items on similar dates last year. Contact them to remind about their upcoming events.
            </Text>
          </View>

          {/* Past Orders List */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">
              Suggested Reminders ({reminders.length})
            </Text>
            {reminders.map(order => (
              <View
                key={order.id}
                className="bg-surface rounded-lg p-4 mb-3 border border-border"
              >
                {/* Order Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground">
                      {order.customerName}
                    </Text>
                    <Text className="text-sm text-muted">{order.eventType} - {order.daysAgo} days ago</Text>
                  </View>
                  <View
                    className={`px-2 py-1 rounded ${contacted.includes(order.id) ? 'bg-success/20' : 'bg-warning/20'
                      }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${contacted.includes(order.id) ? 'text-success' : 'text-warning'
                        }`}
                    >
                      {contacted.includes(order.id) ? 'Contacted' : 'Pending'}
                    </Text>
                  </View>
                </View>

                {/* Order Details */}
                <View className="gap-2 mb-3 pb-3 border-b border-border">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-muted">Phone</Text>
                    <Text className="text-sm text-foreground font-semibold">{order.customerPhone}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-muted">Guests</Text>
                    <Text className="text-sm text-foreground font-semibold">{order.guestCount}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-muted">Amount</Text>
                    <Text className="text-sm text-primary font-bold">₹{order.totalAmount}</Text>
                  </View>
                </View>

                {/* Items */}
                <View className="mb-3">
                  <Text className="text-xs text-muted mb-1">Previous Items</Text>
                  <View className="flex-row flex-wrap gap-1">
                    {order.items.map((item, idx) => (
                      <View key={idx} className="bg-primary/10 rounded px-2 py-1">
                        <Text className="text-xs text-primary font-semibold">{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Contact Button */}
                <TouchableOpacity
                  className={`w-full rounded-lg py-2 items-center ${contacted.includes(order.id)
                      ? 'bg-success/20'
                      : 'bg-primary'
                    }`}
                  onPress={() => handleContactCustomer(order.id, order.customerPhone)}
                  disabled={contacted.includes(order.id)}
                >
                  <Text
                    className={`font-bold text-sm ${contacted.includes(order.id) ? 'text-success' : 'text-white'
                      }`}
                  >
                    {contacted.includes(order.id) ? '✓ Contacted' : 'Contact Customer'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
