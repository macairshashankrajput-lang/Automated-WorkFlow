/**
 * Vendor Management Screen
 * List and manage vendor status from Supabase.
 */

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { AdminModal } from '@/components/ui/admin-modal';
import { vendorService, type VendorUser } from '@/lib/supabase-service';

export default function AdminVendorManagementScreen() {
  const [vendors, setVendors] = useState<VendorUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedVendor, setSelectedVendor] = useState<VendorUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    businessName: '',
  });

  const loadVendors = async () => {
    try {
      setIsLoading(true);
      const data = await vendorService.getAllVendors();
      setVendors(data);
    } catch (err) {
      console.error('Failed to load vendors', err);
      setError('Unable to load vendor list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const toggleStatus = async (vendor: VendorUser) => {
    const nextStatus = vendor.status === 'active' ? 'inactive' : 'active';
    Alert.alert(
      'Change status',
      `Switch ${vendor.name} to ${nextStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await vendorService.updateVendorStatus(vendor.id, nextStatus);
              setVendors((prev) =>
                prev.map((item) =>
                  item.id === vendor.id ? { ...item, status: nextStatus } : item,
                ),
              );
            } catch (err) {
              console.error('Vendor status update failed', err);
              Alert.alert('Error', 'Unable to update vendor status.');
            }
          },
        },
      ],
    );
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedVendor(null);
    setFormData({ username: '', password: '', name: '', email: '', phone: '', businessName: '' });
    setIsModalVisible(true);
  };

  const openEditModal = (vendor: VendorUser) => {
    setModalMode('edit');
    setSelectedVendor(vendor);
    setFormData({
      username: vendor.username || '',
      password: '', // Leave empty on edit unless changing
      name: vendor.name || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      businessName: vendor.businessName || '',
    });
    setIsModalVisible(true);
  };

  const handleDelete = (vendor: VendorUser) => {
    Alert.alert(
      'Delete Vendor',
      `Are you sure you want to permanently delete ${vendor.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await vendorService.deleteVendor(vendor.id);
              setVendors(vendors.filter(v => v.id !== vendor.id));
              Alert.alert('Success', 'Vendor deleted successfully.');
            } catch (err) {
              console.error('Delete failed', err);
              Alert.alert('Error', 'Failed to delete vendor.');
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.username) {
      Alert.alert('Error', 'Name, Username, and Email are required.');
      return;
    }
    
    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        if (!formData.password) {
            Alert.alert('Error', 'Password is required for new vendors.');
            setIsSaving(false);
            return;
        }
        await vendorService.createVendor({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: 'vendor',
          status: 'pending',
          businessName: formData.businessName,
        });
        Alert.alert('Success', 'Vendor created successfully.');
      } else if (selectedVendor) {
        const updates: Partial<VendorUser> = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          businessName: formData.businessName,
        };
        await vendorService.updateVendor(selectedVendor.id, updates);
        Alert.alert('Success', 'Vendor updated successfully.');
      }
      setIsModalVisible(false);
      loadVendors();
    } catch (err: any) {
      console.error('Save failed', err);
      Alert.alert('Error', err.message || 'Failed to save vendor details.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && vendors.length === 0) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#2563eb" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-3xl font-bold text-foreground">Vendors</Text>
            <TouchableOpacity onPress={openCreateModal} className="bg-primary px-4 py-2 rounded-full">
                <Text className="text-white font-bold text-sm">+ Add New</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-muted text-sm mb-6">Manage vendor accounts and businesses.</Text>

          {error ? (
            <View className="bg-error/10 border border-error rounded-3xl p-4 mb-4">
              <Text className="text-error">{error}</Text>
            </View>
          ) : null}

          {vendors.length === 0 && !isLoading ? (
            <View className="bg-surface rounded-3xl border border-border p-6 items-center">
              <Text className="text-foreground text-base">No vendors found.</Text>
            </View>
          ) : (
            vendors.map((vendor) => (
              <View
                key={vendor.id}
                className="bg-surface rounded-3xl border border-border p-4 mb-4"
              >
                <View className="flex-row items-start justify-between gap-4 mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-foreground">{vendor.name}</Text>
                    <Text className="text-sm text-muted">{vendor.businessName || 'No Business Name'}</Text>
                    <Text className="text-sm text-muted mt-1">{vendor.email}</Text>
                    <Text className="text-sm text-muted">{vendor.phone}</Text>
                  </View>
                  <View className="rounded-full bg-primary/10 px-3 py-1">
                    <Text className="text-xs font-semibold text-primary capitalize">{vendor.status}</Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className={`flex-1 rounded-3xl py-3 items-center ${vendor.status === 'active' ? 'bg-error/10' : 'bg-primary/10'}`}
                    onPress={() => toggleStatus(vendor)}
                    activeOpacity={0.8}
                  >
                    <Text className={vendor.status === 'active' ? 'text-error font-semibold' : 'text-primary font-semibold'}>
                        {vendor.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-surface border border-border rounded-3xl py-3 items-center"
                    onPress={() => openEditModal(vendor)}
                    activeOpacity={0.8}
                  >
                    <Text className="text-foreground font-semibold">Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-none bg-error/10 rounded-3xl px-4 py-3 items-center justify-center"
                    onPress={() => handleDelete(vendor)}
                    activeOpacity={0.8}
                  >
                    <Text className="text-error font-semibold">Del</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <AdminModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        title={modalMode === 'create' ? 'Add New Vendor' : 'Edit Vendor'}
        actionButton={{
          label: isSaving ? 'Saving...' : 'Save',
          onPress: handleSave,
        }}
      >
        <View className="pb-8">
            <Text className="text-sm font-semibold text-foreground mb-2">Username</Text>
            <TextInput
                className="w-full bg-background border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
                value={formData.username}
                onChangeText={(v) => setFormData(prev => ({ ...prev, username: v }))}
                placeholder="vendor_username"
                autoCapitalize="none"
                editable={modalMode === 'create'}
            />

            {modalMode === 'create' && (
                <>
                    <Text className="text-sm font-semibold text-foreground mb-2">Password</Text>
                    <TextInput
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
                        value={formData.password}
                        onChangeText={(v) => setFormData(prev => ({ ...prev, password: v }))}
                        placeholder="Secure password"
                        secureTextEntry
                    />
                </>
            )}

            <Text className="text-sm font-semibold text-foreground mb-2">Full Name</Text>
            <TextInput
                className="w-full bg-background border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
                value={formData.name}
                onChangeText={(v) => setFormData(prev => ({ ...prev, name: v }))}
                placeholder="Vendor owner name"
            />

            <Text className="text-sm font-semibold text-foreground mb-2">Business Name</Text>
            <TextInput
                className="w-full bg-background border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
                value={formData.businessName}
                onChangeText={(v) => setFormData(prev => ({ ...prev, businessName: v }))}
                placeholder="Shop or business name"
            />

            <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
            <TextInput
                className="w-full bg-background border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
                value={formData.email}
                onChangeText={(v) => setFormData(prev => ({ ...prev, email: v }))}
                placeholder="vendor@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <Text className="text-sm font-semibold text-foreground mb-2">Phone</Text>
            <TextInput
                className="w-full bg-background border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
                value={formData.phone}
                onChangeText={(v) => setFormData(prev => ({ ...prev, phone: v }))}
                placeholder="1234567890"
                keyboardType="phone-pad"
            />
        </View>
      </AdminModal>
    </ScreenContainer>
  );
}
