import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useState } from 'react';
import { menuCatalog } from '@/lib/menu-data';
import { cateringService } from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';

export default function CateringScreen() {
  const router = useRouter();
  const { state: authState } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    guestCount: '',
    eventType: 'Wedding',
    budget: '',
    location: '',
    specialRequests: '',
  });

  const eventTypes = ['Wedding', 'Birthday', 'Corporate', 'Anniversary', 'Other'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSubmit = async () => {
    if (!authState.user?.id) {
      Alert.alert('Error', 'You must be logged in to submit a request');
      return;
    }
    if (!formData.eventName || !formData.eventDate || !formData.guestCount || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find item names from selected IDs
      const itemNames = menuCatalog
        .flatMap(cat => cat.items)
        .filter(item => selectedItems.includes(item.id))
        .map(item => item.name)
        .join(', ');

      await cateringService.submitRequest({
        userId: authState.user.id,
        eventDate: new Date(formData.eventDate).toISOString(),
        guestCount: parseInt(formData.guestCount),
        location: formData.location,
        budget: formData.budget ? parseInt(formData.budget) : null,
        menuPreferences: `Event: ${formData.eventType}. Selected Items: ${itemNames || 'None selected'}. ${formData.specialRequests}`,
        notes: formData.specialRequests,
      });

      Alert.alert('Success', 'Catering request submitted! Our team will contact you soon.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit catering request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-foreground mb-2">Catering Services</Text>
            <Text className="text-muted text-sm">Plan your special event with us</Text>
          </View>

          {/* Form */}
          <View className="bg-surface rounded-3xl p-6 border border-border mb-6">
            <Text className="text-lg font-bold text-foreground mb-4">Event Details</Text>
            
            <View className="mb-4">
              <Text className="text-xs font-bold text-muted mb-2 uppercase">Event Name *</Text>
              <TextInput
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="e.g., Wedding Reception"
                placeholderTextColor="#687076"
                value={formData.eventName}
                onChangeText={value => handleInputChange('eventName', value)}
              />
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-muted mb-2 uppercase">Event Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2 px-2">
                {eventTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    className={`px-4 py-2 rounded-full mx-1 border ${formData.eventType === type
                      ? 'bg-primary border-primary'
                      : 'bg-background border-border'
                      }`}
                    onPress={() => handleInputChange('eventType', type)}
                  >
                    <Text
                      className={`font-bold text-xs ${formData.eventType === type ? 'text-white' : 'text-foreground'
                        }`}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-bold text-muted mb-2 uppercase">Date *</Text>
                <TextInput
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#687076"
                  value={formData.eventDate}
                  onChangeText={value => handleInputChange('eventDate', value)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-muted mb-2 uppercase">Guests *</Text>
                <TextInput
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Count"
                  placeholderTextColor="#687076"
                  value={formData.guestCount}
                  onChangeText={value => handleInputChange('guestCount', value)}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-muted mb-2 uppercase">Location *</Text>
              <TextInput
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Enter venue address"
                placeholderTextColor="#687076"
                value={formData.location}
                onChangeText={value => handleInputChange('location', value)}
              />
            </View>
          </View>

          {/* Menu Selection */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-foreground mb-4">Select Menu Items</Text>
            <Text className="text-xs text-muted mb-4">Browse our menu and select items you'd like to include in your catering package.</Text>
            
            {menuCatalog.map((category) => (
              <View key={category.category} className="mb-6">
                <Text className="text-sm font-bold text-primary mb-3 uppercase tracking-widest">{category.category}</Text>
                <View className="gap-3">
                  {category.items.map((item) => {
                    const isSelected = selectedItems.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        className={`flex-row items-center justify-between p-4 rounded-2xl border ${isSelected ? 'bg-primary/5 border-primary shadow-sm' : 'bg-surface border-border'}`}
                        onPress={() => toggleItemSelection(item.id)}
                      >
                        <View className="flex-1 mr-4">
                          <Text className="text-base font-bold text-foreground">{item.name}</Text>
                          <Text className="text-xs text-muted" numberOfLines={1}>{item.description}</Text>
                        </View>
                        <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}>
                          {isSelected && <Text className="text-white text-[10px] font-bold">✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          {/* Special Requests */}
          <View className="bg-surface rounded-3xl p-6 border border-border mb-6">
            <Text className="text-xs font-bold text-muted mb-2 uppercase">Special Requests & Notes</Text>
            <TextInput
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="Any dietary restrictions or specific requirements?"
              placeholderTextColor="#687076"
              value={formData.specialRequests}
              onChangeText={value => handleInputChange('specialRequests', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className="w-full bg-primary rounded-2xl py-4 items-center mb-8 shadow-lg shadow-primary/30"
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={{ opacity: isSubmitting ? 0.6 : 1 }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Send Catering Inquiry</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
