import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { tiffinService, menuService, MenuItem, TiffinSubscription, TiffinSchedule } from '@/lib/supabase-service';
import { format, addDays, isAfter, differenceInDays } from 'date-fns';

type PlanDetails = {
  startDate: string;
  duration: '7' | '30' | '90';
  frequency: '1' | '2' | '3';
  meals: { breakfast: boolean; lunch: boolean; dinner: boolean };
  excludeWeekends: boolean;
  skipDates: string[];
  defaultMenuId: string;
  address: string;
};

export default function TiffinScreen() {
  const router = useRouter();
  const { state: authState } = useAuth();
  const [subscription, setSubscription] = useState<TiffinSubscription | null>(null);
  const [schedule, setSchedule] = useState<TiffinSchedule[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  // Planning State
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningStep, setPlanningStep] = useState(1);
  const [plan, setPlan] = useState<PlanDetails>({
    startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    duration: '30',
    frequency: '3',
    meals: { breakfast: true, lunch: true, dinner: true },
    excludeWeekends: false,
    skipDates: [],
    defaultMenuId: '',
    address: authState.user?.deliveryLocation?.address || '123 Biryani Street, City Center', 
  });

  useEffect(() => {
    loadTiffinData();
  }, [authState.user?.id]);

  const loadTiffinData = async () => {
    if (!authState.user?.id) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const [sub, items] = await Promise.all([
        tiffinService.getSubscription(authState.user.id),
        menuService.getAllMenuItems()
      ]);
      setSubscription(sub);
      
      // Better filtering for tiffin menus
      const tiffinMenus = items.filter(i => 
        i.category?.toLowerCase()?.includes('tiffin')
      );
      setMenuItems(tiffinMenus);
      
      if (tiffinMenus.length > 0 && !plan.defaultMenuId) {
        setPlan(prev => ({ ...prev, defaultMenuId: tiffinMenus[0].id }));
      }
      
      if (sub) {
        const sched = await tiffinService.getSchedule(sub.id);
        setSchedule(sched);
      }
    } catch (error) {
      console.error('Failed to load tiffin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!authState.user?.id) return;
    setIsSubscribing(true);
    try {
      const start = new Date(plan.startDate);
      const daysCount = parseInt(plan.duration);
      const end = addDays(start, daysCount);
      
      const sub = await tiffinService.createSubscription({
        userId: authState.user.id,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalPoints: calculateTotalPoints(),
        meals: plan.meals,
        defaultMenuId: plan.defaultMenuId,
        excludeWeekends: plan.excludeWeekends,
        skipDates: plan.skipDates,
      });
      
      setSubscription(sub);
      setIsPlanning(false);
      loadTiffinData(); // Reload to get schedule
      Alert.alert('Subscribed!', 'Your tiffin subscription is active. Your meal calendar is now ready.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create subscription');
    } finally {
      setIsSubscribing(false);
    }
  };

  const calculateTotalPoints = () => {
    const activeMeals = Object.values(plan.meals).filter(Boolean).length;
    const days = parseInt(plan.duration);
    
    // Simple logic for points calculation
    const menuPrice = menuItems.find(i => i.id === plan.defaultMenuId)?.price || 239;
    return activeMeals * days * menuPrice;
  };

  const getDayMeals = (date: string) => {
    return schedule.filter(item => format(new Date(item.date), 'yyyy-MM-dd') === date);
  };

  const canEdit = (date: string) => {
    const deliveryDate = new Date(date);
    const deadline = addDays(new Date(), 2);
    return isAfter(deliveryDate, deadline);
  };

  const renderPlanningUI = () => {
    return (
      <View className="flex-1">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => setPlanningStep(Math.max(1, planningStep - 1))}>
            <Text className="text-2xl mr-4 text-primary">←</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Create Tiffin Plan</Text>
        </View>

        <View className="flex-row mb-8">
          {[1, 2, 3].map(s => (
            <View key={s} className={`h-1.5 flex-1 mx-1 rounded-full ${s <= planningStep ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </View>

        {planningStep === 1 && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-lg font-bold text-foreground mb-4">1. Delivery Preferences</Text>
            
            <View className="bg-surface rounded-3xl p-6 border border-border mb-6">
              <Text className="text-sm font-bold text-muted mb-4 uppercase tracking-wider">Frequency</Text>
              <View className="flex-row gap-2">
                {(['1', '2', '3'] as const).map(freq => (
                  <TouchableOpacity 
                    key={freq}
                    onPress={() => setPlan(p => ({ ...p, frequency: freq }))}
                    className={`flex-1 py-3 rounded-xl border items-center ${plan.frequency === freq ? 'bg-primary border-primary' : 'bg-background border-border'}`}
                  >
                    <Text className={`font-bold ${plan.frequency === freq ? 'text-white' : 'text-foreground'}`}>{freq}x / day</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="bg-surface rounded-3xl p-6 border border-border mb-6">
              <Text className="text-sm font-bold text-muted mb-4 uppercase tracking-wider">Which Meals?</Text>
              {(['breakfast', 'lunch', 'dinner'] as const).map(meal => (
                <TouchableOpacity 
                  key={meal}
                  onPress={() => setPlan(p => ({ ...p, meals: { ...p.meals, [meal]: !p.meals[meal] } }))}
                  className={`flex-row items-center justify-between py-4 border-b border-border/50 last:border-0`}
                >
                  <Text className="capitalize text-foreground font-semibold text-base">{meal}</Text>
                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${plan.meals[meal] ? 'bg-primary border-primary' : 'border-border'}`}>
                    {plan.meals[meal] && <Text className="text-white text-xs font-bold">✓</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View className="bg-surface rounded-3xl p-6 border border-border mb-6">
              <Text className="text-sm font-bold text-muted mb-4 uppercase tracking-wider">Schedule Options</Text>
              <TouchableOpacity 
                onPress={() => setPlan(p => ({ ...p, excludeWeekends: !p.excludeWeekends }))}
                className="flex-row items-center justify-between py-2"
              >
                <Text className="text-foreground font-semibold">Exclude Weekends</Text>
                <View className={`w-12 h-6 rounded-full p-1 ${plan.excludeWeekends ? 'bg-primary' : 'bg-muted'}`}>
                  <View className={`w-4 h-4 rounded-full bg-white ${plan.excludeWeekends ? 'translate-x-6' : ''}`} />
                </View>
              </TouchableOpacity>
            </View>

            <View className="bg-surface rounded-3xl p-6 border border-border mb-6">
              <Text className="text-sm font-bold text-muted mb-4 uppercase tracking-wider">Start Date</Text>
              <View className="flex-row flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map(offset => {
                  const date = format(addDays(new Date(), offset), 'yyyy-MM-dd');
                  const isSelected = plan.startDate === date;
                  return (
                    <TouchableOpacity 
                      key={date}
                      onPress={() => setPlan(p => ({ ...p, startDate: date }))}
                      className={`px-4 py-3 rounded-xl border ${isSelected ? 'bg-primary border-primary' : 'bg-background border-border'}`}
                    >
                      <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-foreground'}`}>
                        {format(addDays(new Date(), offset), 'MMM d')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="bg-surface rounded-3xl p-6 border border-border mb-6">
              <Text className="text-sm font-bold text-muted mb-4 uppercase tracking-wider">Skip Specific Dates</Text>
              <Text className="text-xs text-muted mb-4">Select dates you want to skip delivery (e.g., travel days)</Text>
              <Calendar
                onDayPress={day => {
                  const date = day.dateString;
                  setPlan(p => ({
                    ...p,
                    skipDates: p.skipDates.includes(date)
                      ? p.skipDates.filter(d => d !== date)
                      : [...p.skipDates, date]
                  }));
                }}
                markedDates={plan.skipDates.reduce((acc, date) => {
                  acc[date] = { selected: true, selectedColor: '#687076', disabled: true };
                  return acc;
                }, {} as any)}
                theme={{
                  selectedDayBackgroundColor: '#687076',
                  todayTextColor: '#E25C3D',
                  arrowColor: '#E25C3D',
                }}
              />
            </View>

            <TouchableOpacity 
              className="bg-primary py-4 rounded-2xl items-center shadow-lg shadow-primary/20 mb-8"
              onPress={() => setPlanningStep(2)}
            >
              <Text className="text-white font-bold text-lg">Next: Choose Menu</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {planningStep === 2 && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-lg font-bold text-foreground mb-4">2. Choose Default Menu</Text>
            {menuItems.length === 0 ? (
              <View className="p-10 items-center">
                <Text className="text-muted text-center">No Tiffin menus found. Please check back later or contact support.</Text>
                <TouchableOpacity onPress={loadTiffinData} className="mt-4 bg-primary/10 px-6 py-3 rounded-full">
                  <Text className="text-primary font-bold">Retry Loading</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-4 mb-6">
                {menuItems.map(item => (
                  <TouchableOpacity 
                    key={item.id}
                    onPress={() => setPlan(p => ({ ...p, defaultMenuId: item.id }))}
                    className={`p-5 rounded-3xl border ${plan.defaultMenuId === item.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-surface border-border'}`}
                  >
                    <View className="flex-row justify-between mb-3">
                      <View className="flex-1 mr-4">
                        <Text className="text-xl font-bold text-foreground mb-1">{item.name}</Text>
                        <Text className="text-xs font-bold text-primary uppercase tracking-wider">{item.category}</Text>
                      </View>
                      <View className="bg-primary/10 px-3 py-1 rounded-full h-8 items-center justify-center">
                        <Text className="text-primary font-bold">₹{item.price}</Text>
                      </View>
                    </View>
                    <Text className="text-sm text-muted mb-3 leading-relaxed">{item.description}</Text>
                    <View className="bg-background/50 p-3 rounded-xl border border-border/30">
                      <Text className="text-xs text-muted font-medium italic">Includes: {item.ingredients}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity 
              className="bg-primary py-4 rounded-2xl items-center shadow-lg shadow-primary/20 mb-8"
              onPress={() => setPlanningStep(3)}
              disabled={!plan.defaultMenuId}
              style={{ opacity: !plan.defaultMenuId ? 0.5 : 1 }}
            >
              <Text className="text-white font-bold text-lg">Next: Review Plan</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {planningStep === 3 && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-lg font-bold text-foreground mb-4">3. Review & Subscribe</Text>
            
            <View className="bg-surface rounded-3xl p-6 border border-border mb-6">
              <View className="flex-row justify-between mb-4">
                <Text className="text-muted">Start Date</Text>
                <Text className="text-foreground font-bold">{format(new Date(plan.startDate), 'MMMM do, yyyy')}</Text>
              </View>
              <View className="flex-row justify-between mb-4">
                <Text className="text-muted">Plan Duration</Text>
                <Text className="text-foreground font-bold">{plan.duration} Days</Text>
              </View>
              <View className="flex-row justify-between mb-4">
                <Text className="text-muted">Meals per day</Text>
                <Text className="text-foreground font-bold">{plan.frequency} ({Object.keys(plan.meals).filter(k => plan.meals[k as keyof typeof plan.meals]).join(', ')})</Text>
              </View>
              <View className="flex-row justify-between mb-4">
                <Text className="text-muted">Exclude Weekends</Text>
                <Text className="text-foreground font-bold">{plan.excludeWeekends ? 'Yes' : 'No'}</Text>
              </View>
              <View className="flex-row justify-between mb-4">
                <Text className="text-muted">Skip Dates</Text>
                <Text className="text-foreground font-bold">{plan.skipDates.length} days selected</Text>
              </View>
              <View className="flex-row justify-between mb-4 pt-4 border-t border-border/50">
                <Text className="text-lg font-bold">Total Est. Points</Text>
                <Text className="text-lg font-bold text-primary">{calculateTotalPoints()} pts</Text>
              </View>
            </View>

            <View className="bg-surface rounded-3xl p-6 border border-border mb-6">
              <Text className="text-sm font-semibold text-muted mb-2">DELIVERY ADDRESS</Text>
              <TextInput 
                className="text-foreground font-medium p-3 bg-background rounded-xl border border-border"
                value={plan.address}
                onChangeText={a => setPlan(p => ({ ...p, address: a }))}
                multiline
              />
            </View>

            <TouchableOpacity 
              className="bg-primary py-4 rounded-2xl items-center shadow-lg shadow-primary/30"
              onPress={handleSubscribe}
              disabled={isSubscribing}
            >
              {isSubscribing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Confirm & Subscribe</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    );
  };

  const [isChangingMenu, setIsChangingMenu] = useState(false);
  const [activeMealItem, setActiveMealItem] = useState<TiffinSchedule | null>(null);

  const handleMenuChange = async (newMenuId: string) => {
    if (!activeMealItem) return;
    try {
        await tiffinService.updateScheduleItem(activeMealItem.id, newMenuId);
        setIsChangingMenu(false);
        setActiveMealItem(null);
        loadTiffinData(); // Refresh schedule
        Alert.alert('Success', 'Meal updated!');
    } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to update meal');
    }
  };

  const renderMealSelector = () => {
    const dayMeals = getDayMeals(selectedDate);
    const editable = canEdit(selectedDate);

    return (
      <View className="bg-surface rounded-3xl p-6 mt-4 border border-border">
        <Text className="text-xl font-bold text-foreground mb-4">
          Meals for {format(new Date(selectedDate), 'MMMM do')}
        </Text>
        
        {!editable && (
          <View className="bg-orange-500/10 p-3 rounded-lg mb-4 border border-orange-500/20">
            <Text className="text-orange-500 text-xs font-semibold">
              🔒 Editing locked (less than 2 days until delivery)
            </Text>
          </View>
        )}

        {dayMeals.length === 0 ? (
          <Text className="text-muted text-center py-4">No meals scheduled for this day.</Text>
        ) : (
          dayMeals.map((meal) => (
            <View key={meal.id} className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-bold text-foreground capitalize">{meal.mealType}</Text>
                <Text className="text-xs text-muted">
                  {meal.menuId ? (menuItems.find(i => i.id === meal.menuId?.toString())?.name || 'Standard Menu') : 'Standard Menu'}
                </Text>
              </View>
              {editable && (
                <TouchableOpacity 
                  className="bg-primary/10 px-4 py-2 rounded-full"
                  onPress={() => {
                      setActiveMealItem(meal);
                      setIsChangingMenu(true);
                  }}
                >
                  <Text className="text-primary text-xs font-bold">Change</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#E25C3D" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {/* Points Wallet Header */}
          <View className="bg-primary rounded-3xl p-6 mb-6 flex-row justify-between items-center shadow-lg shadow-primary/30">
            <View>
              <Text className="text-white/80 text-sm font-semibold mb-1">Points Balance</Text>
              <Text className="text-white text-3xl font-bold">{subscription?.remainingPoints || 0} pts</Text>
            </View>
            <TouchableOpacity 
              className="bg-white px-6 py-3 rounded-2xl"
              onPress={() => router.push('/(customer)/rewards')}
            >
              <Text className="text-primary font-bold">Add Points</Text>
            </TouchableOpacity>
          </View>

          {!subscription && !isPlanning ? (
            <View className="bg-surface rounded-3xl p-8 items-center border border-border">
              <Text className="text-4xl mb-4">🥡</Text>
              <Text className="text-xl font-bold text-foreground text-center mb-2">Start Tiffin Service</Text>
              <Text className="text-sm text-muted text-center mb-6 leading-relaxed">
                Subscribe to monthly meals and enjoy fresh food delivered to your door. Create your custom plan now.
              </Text>
              <TouchableOpacity 
                className="bg-primary w-full py-4 rounded-2xl items-center"
                onPress={() => setIsPlanning(true)}
              >
                <Text className="text-white font-bold text-base">Create Your Plan</Text>
              </TouchableOpacity>
            </View>
          ) : !subscription && isPlanning ? (
            renderPlanningUI()
          ) : (
            <>
              <Text className="text-lg font-bold text-foreground mb-4">Your Meal Calendar</Text>
              <View className="bg-surface rounded-3xl overflow-hidden border border-border">
                <Calendar
                  onDayPress={day => setSelectedDate(day.dateString)}
                  markedDates={{
                    [selectedDate]: { selected: true, selectedColor: '#E25C3D' },
                    ...schedule.reduce((acc, item) => {
                      const date = format(new Date(item.date), 'yyyy-MM-dd');
                      acc[date] = { ...acc[date], marked: true, dotColor: '#E25C3D' };
                      return acc;
                    }, {} as any)
                  }}
                  theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    textSectionTitleColor: '#687076',
                    selectedDayBackgroundColor: '#E25C3D',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#E25C3D',
                    dayTextColor: '#11181C',
                    textDisabledColor: '#D1D5DB',
                    dotColor: '#E25C3D',
                    selectedDotColor: '#ffffff',
                    arrowColor: '#E25C3D',
                    monthTextColor: '#11181C',
                    indicatorColor: '#E25C3D',
                    textDayFontWeight: '500',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '600',
                  }}
                />
              </View>

              {renderMealSelector()}

              <View className="mt-6 bg-surface p-4 rounded-2xl border border-border">
                <Text className="text-sm font-bold text-foreground mb-2">Tiffin Rules</Text>
                <Text className="text-xs text-muted leading-relaxed">
                  • 1 point = ₹1. Points are deducted based on menu price.{"\n"}
                  • Changes must be made at least 2 days in advance.{"\n"}
                  • Your subscription is for {subscription?.endDate ? differenceInDays(new Date(subscription.endDate), new Date(subscription.startDate)) : 30} days.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <Modal visible={isChangingMenu} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-[40px] p-6 max-h-[80%] border-t border-border">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-foreground">Select Menu</Text>
              <TouchableOpacity onPress={() => setIsChangingMenu(false)} className="bg-muted/20 p-2 rounded-full">
                <Text className="text-muted font-bold">✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-4 mb-8">
                {menuItems.map(item => (
                  <TouchableOpacity 
                    key={item.id}
                    onPress={() => handleMenuChange(item.id)}
                    className="p-5 rounded-3xl bg-background border border-border"
                  >
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-lg font-bold text-foreground">{item.name}</Text>
                      <Text className="text-primary font-bold">₹{item.price}</Text>
                    </View>
                    <Text className="text-xs text-muted leading-relaxed">{item.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
