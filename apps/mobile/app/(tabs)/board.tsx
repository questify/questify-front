import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useYearlyBoardData } from '@/core/hooks/useApi';
import { QuestifyColors } from '@/mobile/constants/colors';
import { Card } from '@/mobile/components/ui/Card';

interface DayCell {
  date: string;
  dayName: string;
  dayNumber: number;
  status: 'completed' | 'partial' | 'missed' | 'today' | 'future';
  mood?: string;
  validations?: number;
  totalQuests?: number;
  details?: string;
}

// Helper function to convert mood value to emoji
function moodValueToEmoji(moodValue: number | null): string {
  if (!moodValue) return '';
  const moodMap: Record<number, string> = {
    5: '😍',
    4: '😊',
    3: '😐',
    2: '😔',
    1: '😢',
  };
  return moodMap[moodValue] || '';
}

interface WeekCell {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  status: 'completed' | 'partial' | 'missed' | 'current' | 'future';
  validations?: number;
  totalPossible?: number;
}

export default function BoardScreen() {
  const { data, isLoading, refetch } = useYearlyBoardData();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'year'>('week');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = current week, -1 = last week
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0); // 0 = current month, -1 = last month

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Get Monday of the week for a given date
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Get the week to display based on offset
  const getCurrentWeek = (): Date => {
    const today = new Date();
    const monday = getWeekStart(today);
    monday.setDate(monday.getDate() + currentWeekOffset * 7);
    return monday;
  };

  // Generate 7 days for the current week
  const generateWeekDays = (): DayCell[] => {
    const days: DayCell[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = getCurrentWeek();

    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    // Get active quests - filter where is_active is either true or undefined (for backward compatibility)
    const allQuests = data?.quests || [];
    const activeQuests = allQuests.filter((q: any) => q.is_active !== false);
    const dailyQuests = activeQuests.filter((q: any) => q.frequency === 'Journalier');
    const weeklyQuests = activeQuests.filter((q: any) => q.frequency === 'Hebdomadaire');
    

    // Build a map of validations by quest and date
    const validationsByQuestAndDate: Record<string, Set<string>> = {};
    if (data?.validations) {

      data.validations.forEach((validation: any) => {
        const questId = validation.quest_id;
        const date = (validation.date || validation.created_at).split('T')[0];
        if (!validationsByQuestAndDate[questId]) {
          validationsByQuestAndDate[questId] = new Set();
        }
        validationsByQuestAndDate[questId].add(date);
      });
    }

    // Build a map of moods by date
    const moodsByDate: Record<string, any> = {};
    if (data?.moods) {
      data.moods.forEach((mood: any) => {
        const date = mood.date.split('T')[0];
        moodsByDate[date] = mood;
      });
    }

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayMood = moodsByDate[dateStr];

      const isFuture = currentDate > today;
      const isToday = currentDate.getTime() === today.getTime();

      let status: DayCell['status'];
      let mood: string | undefined;

      // Count validations for this day
      let validatedDailyQuests = 0;
      for (const quest of dailyQuests) {
        const validatedDates = validationsByQuestAndDate[quest.id] || new Set();
        if (validatedDates.has(dateStr)) {
          validatedDailyQuests++;
        }
      }

      const totalQuests = dailyQuests.length;
      const validationCount = validatedDailyQuests;
      let details: string | undefined;

      if (isFuture) {
        status = 'future';
      } else if (isToday) {
        status = 'today';
        if (validationCount === totalQuests && totalQuests > 0) {
          status = 'completed';
        } else if (validationCount > 0) {
          status = 'partial';
        }
      } else {
        // Past day
        if (validationCount === totalQuests && totalQuests > 0) {
          status = 'completed';
        } else if (validationCount > 0) {
          status = 'partial';
        } else {
          status = 'missed';
        }
      }

      // Add mood emoji
      if (dayMood) {
        mood = moodValueToEmoji(dayMood.mood_value);
      }

      // Build details string
      if (!isFuture) {
        details = `${validationCount}/${totalQuests} quêtes`;
        if (dayMood) {
          const moodLabels: Record<number, string> = {
            5: 'Excellent',
            4: 'Bien',
            3: 'Moyen',
            2: 'Difficile',
            1: 'Très difficile',
          };
          details += ` • ${moodLabels[dayMood.mood_value]}`;
        }
      }

      days.push({
        date: dateStr,
        dayName: dayNames[i],
        dayNumber: currentDate.getDate(),
        status,
        mood,
        validations: validationCount,
        totalQuests,
        details,
      });
    }

    return days;
  };

  // Calculate week stats
  const getWeekStats = (days: DayCell[]) => {
    const pastDays = days.filter(d => d.status !== 'future');
    const completedDays = pastDays.filter(d => d.status === 'completed').length;
    const totalValidations = pastDays.reduce((sum, d) => sum + (d.validations || 0), 0);
    const totalPossible = pastDays.reduce((sum, d) => sum + (d.totalQuests || 0), 0);
    const successRate = totalPossible > 0 ? Math.round((totalValidations / totalPossible) * 100) : 0;
    const moodValues = pastDays.filter(d => d.mood).length;

    return {
      completedDays,
      totalDays: pastDays.length,
      totalValidations,
      successRate,
      moodDays: moodValues,
    };
  };

  // Get the first day of the month for a given offset
  const getCurrentMonth = (): Date => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() + currentMonthOffset, 1);
    return firstDay;
  };

  // Generate days for the current month
  const generateMonthDays = (): DayCell[] => {
    const days: DayCell[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = getCurrentMonth();
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();

    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    // Get active quests
    const allQuests = data?.quests || [];
    const activeQuests = allQuests.filter((q: any) => q.is_active !== false);
    const dailyQuests = activeQuests.filter((q: any) => q.frequency === 'Journalier');

    // Build a map of validations by quest and date
    const validationsByQuestAndDate: Record<string, Set<string>> = {};
    if (data?.validations) {
      data.validations.forEach((validation: any) => {
        const questId = validation.quest_id;
        const date = (validation.date || validation.created_at).split('T')[0];
        if (!validationsByQuestAndDate[questId]) {
          validationsByQuestAndDate[questId] = new Set();
        }
        validationsByQuestAndDate[questId].add(date);
      });
    }

    // Build a map of moods by date
    const moodsByDate: Record<string, any> = {};
    if (data?.moods) {
      data.moods.forEach((mood: any) => {
        const date = mood.date.split('T')[0];
        moodsByDate[date] = mood;
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayMood = moodsByDate[dateStr];

      const isFuture = currentDate > today;
      const isToday = currentDate.getTime() === today.getTime();

      let status: DayCell['status'];
      let mood: string | undefined;

      // Count validations for this day
      let validatedDailyQuests = 0;
      for (const quest of dailyQuests) {
        const validatedDates = validationsByQuestAndDate[quest.id] || new Set();
        if (validatedDates.has(dateStr)) {
          validatedDailyQuests++;
        }
      }

      const totalQuests = dailyQuests.length;
      const validationCount = validatedDailyQuests;
      let details: string | undefined;

      if (isFuture) {
        status = 'future';
      } else if (isToday) {
        status = 'today';
        if (validationCount === totalQuests && totalQuests > 0) {
          status = 'completed';
        } else if (validationCount > 0) {
          status = 'partial';
        }
      } else {
        // Past day
        if (validationCount === totalQuests && totalQuests > 0) {
          status = 'completed';
        } else if (validationCount > 0) {
          status = 'partial';
        } else {
          status = 'missed';
        }
      }

      // Add mood emoji
      if (dayMood) {
        mood = moodValueToEmoji(dayMood.mood_value);
      }

      // Build details string
      if (!isFuture) {
        details = `${validationCount}/${totalQuests} quêtes`;
        if (dayMood) {
          const moodLabels: Record<number, string> = {
            5: 'Excellent',
            4: 'Bien',
            3: 'Moyen',
            2: 'Difficile',
            1: 'Très difficile',
          };
          details += ` • ${moodLabels[dayMood.mood_value]}`;
        }
      }

      const dayOfWeek = currentDate.getDay();
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0=Monday

      days.push({
        date: dateStr,
        dayName: dayNames[dayIndex],
        dayNumber: i,
        status,
        mood,
        validations: validationCount,
        totalQuests,
        details,
      });
    }

    return days;
  };

  // Week navigation
  const goToPreviousWeek = () => setCurrentWeekOffset(currentWeekOffset - 1);
  const goToNextWeek = () => setCurrentWeekOffset(currentWeekOffset + 1);
  const goToCurrentWeek = () => setCurrentWeekOffset(0);

  // Month navigation
  const goToPreviousMonth = () => setCurrentMonthOffset(currentMonthOffset - 1);
  const goToNextMonth = () => setCurrentMonthOffset(currentMonthOffset + 1);
  const goToCurrentMonth = () => setCurrentMonthOffset(0);

  // Generate 52 weeks for the year view
  const generateYearWeeks = (): WeekCell[] => {
    const weeks: WeekCell[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    // Start from first Monday of the year
    const yearStart = new Date(currentYear, 0, 1);
    const firstMonday = getWeekStart(yearStart);

    // Get active quests
    const allQuests = data?.quests || [];
    const activeQuests = allQuests.filter((q: any) => q.is_active !== false);
    const dailyQuests = activeQuests.filter((q: any) => q.frequency === 'Journalier');

    // Build a map of validations by quest and date
    const validationsByQuestAndDate: Record<string, Set<string>> = {};
    if (data?.validations) {
      data.validations.forEach((validation: any) => {
        const questId = validation.quest_id;
        const date = (validation.date || validation.created_at).split('T')[0];
        if (!validationsByQuestAndDate[questId]) {
          validationsByQuestAndDate[questId] = new Set();
        }
        validationsByQuestAndDate[questId].add(date);
      });
    }

    for (let weekNum = 0; weekNum < 52; weekNum++) {
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + weekNum * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      // Check if this is the current week
      const currentWeekStart = getWeekStart(today);
      const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();
      const isFutureWeek = weekStart > today;

      // Count validations for this week
      let totalValidations = 0;
      let totalPossible = dailyQuests.length * 7; // 7 days per week

      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + dayOffset);

        if (currentDate > today) {
          totalPossible -= dailyQuests.length; // Don't count future days
          continue;
        }

        const dateStr = currentDate.toISOString().split('T')[0];

        for (const quest of dailyQuests) {
          const validatedDates = validationsByQuestAndDate[quest.id] || new Set();
          if (validatedDates.has(dateStr)) {
            totalValidations++;
          }
        }
      }

      let status: WeekCell['status'];
      if (isFutureWeek) {
        status = 'future';
      } else if (isCurrentWeek) {
        status = 'current';
        if (totalPossible > 0 && totalValidations === totalPossible) {
          status = 'completed';
        } else if (totalValidations > 0) {
          status = 'partial';
        }
      } else {
        // Past week
        if (totalPossible > 0 && totalValidations === totalPossible) {
          status = 'completed';
        } else if (totalValidations > 0) {
          status = 'partial';
        } else {
          status = 'missed';
        }
      }

      weeks.push({
        weekNumber: weekNum + 1,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        status,
        validations: totalValidations,
        totalPossible,
      });
    }

    return weeks;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={QuestifyColors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const days = viewMode === 'year' ? [] : (viewMode === 'week' ? generateWeekDays() : generateMonthDays());
  const weeks = viewMode === 'year' ? generateYearWeeks() : [];
  const stats = viewMode === 'year' ? { completedDays: 0, totalDays: 0, totalValidations: 0, successRate: 0, moodDays: 0 } : getWeekStats(days);

  const weekStart = getCurrentWeek();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const monthStart = getCurrentMonth();
  const monthName = monthStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const currentYear = new Date().getFullYear();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={QuestifyColors.primary}
          />
        }>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tableau de Bord 📅</Text>
          <Text style={styles.subtitle}>Visualise ta progression</Text>
        </View>

        {/* View Mode Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'week' && styles.tabActive]}
            onPress={() => setViewMode('week')}>
            <Text style={[styles.tabText, viewMode === 'week' && styles.tabTextActive]}>
              Semaine
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'month' && styles.tabActive]}
            onPress={() => setViewMode('month')}>
            <Text style={[styles.tabText, viewMode === 'month' && styles.tabTextActive]}>
              Mois
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'year' && styles.tabActive]}
            onPress={() => setViewMode('year')}>
            <Text style={[styles.tabText, viewMode === 'year' && styles.tabTextActive]}>
              Année
            </Text>
          </TouchableOpacity>
        </View>

        {/* Navigation */}
        {viewMode !== 'year' && (
          <Card style={styles.navigationCard}>
            <View style={styles.navigationContainer}>
              <TouchableOpacity
                onPress={viewMode === 'week' ? goToPreviousWeek : goToPreviousMonth}
                style={styles.navButton}>
                <Text style={styles.navButtonText}>← Précédent{viewMode === 'month' ? '' : 'e'}</Text>
              </TouchableOpacity>

              <View style={styles.weekDateContainer}>
                {viewMode === 'week' ? (
                  <>
                    <Text style={styles.weekDateText}>
                      {formatDate(weekStart)}
                    </Text>
                    <Text style={styles.weekDateSeparator}>-</Text>
                    <Text style={styles.weekDateText}>
                      {formatDate(weekEnd)}
                    </Text>
                    {currentWeekOffset !== 0 && (
                      <TouchableOpacity
                        onPress={goToCurrentWeek}
                        style={styles.currentWeekButton}>
                        <Text style={styles.currentWeekButtonText}>Aujourd'hui</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles.monthNameText}>
                      {monthName}
                    </Text>
                    {currentMonthOffset !== 0 && (
                      <TouchableOpacity
                        onPress={goToCurrentMonth}
                        style={styles.currentWeekButton}>
                        <Text style={styles.currentWeekButtonText}>Ce mois</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>

              <TouchableOpacity
                onPress={viewMode === 'week' ? goToNextWeek : goToNextMonth}
                disabled={
                  viewMode === 'week' ? currentWeekOffset >= 0 : currentMonthOffset >= 0
                }
                style={[
                  styles.navButton,
                  (viewMode === 'week' ? currentWeekOffset >= 0 : currentMonthOffset >= 0) &&
                    styles.navButtonDisabled,
                ]}>
                <Text
                  style={[
                    styles.navButtonText,
                    (viewMode === 'week' ? currentWeekOffset >= 0 : currentMonthOffset >= 0) &&
                      styles.navButtonTextDisabled,
                  ]}>
                  Suivant{viewMode === 'month' ? '' : 'e'} →
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Year Title */}
        {viewMode === 'year' && (
          <Card style={styles.yearTitleCard}>
            <Text style={styles.yearTitle}>Année {currentYear}</Text>
          </Card>
        )}

        {/* Days/Weeks Grid */}
        <View style={styles.daysContainer}>
          {viewMode === 'year' ? (
            // Year view: display weeks
            weeks.map(week => (
              <Card
                key={week.weekNumber}
                style={[
                  styles.weekCard,
                  week.status === 'completed' && styles.dayCompleted,
                  week.status === 'current' && styles.dayToday,
                  week.status === 'partial' && styles.dayPartial,
                  week.status === 'missed' && styles.dayMissed,
                  week.status === 'future' && styles.dayFuture,
                ]}>
                <Text style={styles.weekNumber}>S{week.weekNumber}</Text>
                {week.status !== 'future' && (
                  <Text style={styles.weekStatsText}>
                    {week.validations}/{week.totalPossible}
                  </Text>
                )}
              </Card>
            ))
          ) : (
            // Week/Month view: display days
            days.map(day => (
              <Card
                key={day.date}
                style={[
                  viewMode === 'week' ? styles.dayCard : styles.dayCardMonth,
                  day.status === 'completed' && styles.dayCompleted,
                  day.status === 'today' && styles.dayToday,
                  day.status === 'partial' && styles.dayPartial,
                  day.status === 'missed' && styles.dayMissed,
                  day.status === 'future' && styles.dayFuture,
                ]}>
                <View style={styles.dayHeader}>
                  <Text style={[
                    styles.dayName,
                    viewMode === 'month' && styles.dayNameMonth
                  ]}>{day.dayName}</Text>
                  {day.status === 'today' && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>AUJOURD'HUI</Text>
                    </View>
                  )}
                </View>

                <Text style={[
                  styles.dayNumber,
                  viewMode === 'month' && styles.dayNumberMonth
                ]}>{day.dayNumber}</Text>

                {day.mood && (
                  <Text style={[
                    styles.dayMood,
                    viewMode === 'month' && styles.dayMoodMonth
                  ]}>{day.mood}</Text>
                )}

                {day.status !== 'future' && (
                  <View style={styles.dayStats}>
                    <Text style={[
                      styles.dayStatsText,
                      viewMode === 'month' && styles.dayStatsTextMonth
                    ]}>
                      {day.validations}/{day.totalQuests}
                    </Text>
                    {viewMode === 'week' && (
                      <Text style={styles.dayStatsLabel}>quêtes</Text>
                    )}
                  </View>
                )}
              </Card>
            ))
          )}
        </View>

        {/* Week/Month Stats */}
        {viewMode !== 'year' && (
          <>
            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>
                  {stats.completedDays}/{stats.totalDays}
                </Text>
                <Text style={styles.statLabel}>Jours complétés ✅</Text>
              </Card>

              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalValidations}</Text>
                <Text style={styles.statLabel}>Validations 🎯</Text>
              </Card>
            </View>

            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{stats.successRate}%</Text>
                <Text style={styles.statLabel}>Taux de réussite 📊</Text>
              </Card>

              <Card style={styles.statCard}>
                <Text style={styles.statValue}>
                  {stats.moodDays}/{stats.totalDays}
                </Text>
                <Text style={styles.statLabel}>Humeurs 😊</Text>
              </Card>
            </View>
          </>
        )}

        {/* Legend */}
        <Card style={styles.legendCard}>
          <Text style={styles.legendTitle}>Légende</Text>

          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#C8EAD3' }]} />
            <Text style={styles.legendText}>
              {viewMode === 'year' ? 'Semaine complète' : 'Jour complet (toutes les quêtes)'}
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFF4C1' }]} />
            <Text style={styles.legendText}>
              {viewMode === 'year' ? 'Semaine partielle' : 'Jour partiel (quelques quêtes)'}
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                { backgroundColor: '#C8B7E8', borderWidth: 3, borderColor: '#9B7DC8' },
              ]}
            />
            <Text style={styles.legendText}>
              {viewMode === 'year' ? 'Semaine en cours' : 'Aujourd\'hui'}
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFD1C1' }]} />
            <Text style={styles.legendText}>
              {viewMode === 'year' ? 'Semaine ratée' : 'Jour raté'}
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F9FAFB' }]} />
            <Text style={styles.legendText}>À venir</Text>
          </View>

          {viewMode !== 'year' && (
            <View style={styles.tipContainer}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>
                Les emojis affichent ton humeur du jour si tu l'as renseignée.
              </Text>
            </View>
          )}
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: QuestifyColors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: QuestifyColors.backgroundLight,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: QuestifyColors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: QuestifyColors.textSecondary,
  },
  navigationCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: QuestifyColors.border,
    backgroundColor: QuestifyColors.background,
  },
  navButtonDisabled: {
    backgroundColor: QuestifyColors.backgroundDark,
    borderColor: QuestifyColors.backgroundDark,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
  },
  navButtonTextDisabled: {
    color: QuestifyColors.textSecondary,
  },
  weekDateContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  weekDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
  },
  weekDateSeparator: {
    fontSize: 14,
    color: QuestifyColors.textSecondary,
    marginVertical: 2,
  },
  currentWeekButton: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: QuestifyColors.primary,
  },
  currentWeekButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: QuestifyColors.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: QuestifyColors.backgroundDark,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: QuestifyColors.background,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textSecondary,
  },
  tabTextActive: {
    color: QuestifyColors.primary,
  },
  monthNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: QuestifyColors.textPrimary,
    textTransform: 'capitalize',
  },
  yearTitleCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    alignItems: 'center',
  },
  yearTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  dayCard: {
    width: '12.5%',
    minHeight: 120,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  dayCardMonth: {
    width: '12.5%',
    minHeight: 80,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  weekCard: {
    width: '7%',
    minHeight: 60,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  weekNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: QuestifyColors.textPrimary,
    marginBottom: 2,
  },
  weekStatsText: {
    fontSize: 7,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
  },
  dayCompleted: {
    backgroundColor: '#C8EAD3',
  },
  dayToday: {
    backgroundColor: '#C8B7E8',
    borderWidth: 3,
    borderColor: '#9B7DC8',
  },
  dayPartial: {
    backgroundColor: '#FFF4C1',
  },
  dayMissed: {
    backgroundColor: '#FFD1C1',
  },
  dayFuture: {
    backgroundColor: '#F9FAFB',
  },
  dayHeader: {
    width: '100%',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 10,
    fontWeight: '600',
    color: QuestifyColors.textSecondary,
    marginBottom: 4,
  },
  dayNameMonth: {
    fontSize: 8,
    marginBottom: 2,
  },
  todayBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#9B7DC8',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayBadgeText: {
    fontSize: 6,
    fontWeight: '700',
    color: QuestifyColors.background,
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: QuestifyColors.textPrimary,
    marginVertical: 4,
  },
  dayNumberMonth: {
    fontSize: 16,
    marginVertical: 2,
  },
  dayMood: {
    fontSize: 24,
    marginVertical: 4,
  },
  dayMoodMonth: {
    fontSize: 16,
    marginVertical: 2,
  },
  dayStats: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  dayStatsText: {
    fontSize: 12,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
  },
  dayStatsTextMonth: {
    fontSize: 9,
  },
  dayStatsLabel: {
    fontSize: 8,
    color: QuestifyColors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: QuestifyColors.textSecondary,
    textAlign: 'center',
  },
  legendCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendColor: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 12,
  },
  legendText: {
    fontSize: 13,
    color: QuestifyColors.textPrimary,
  },
  tipContainer: {
    flexDirection: 'row',
    marginTop: 16,
    padding: 16,
    backgroundColor: QuestifyColors.backgroundDark,
    borderRadius: 12,
  },
  tipIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: QuestifyColors.textSecondary,
    lineHeight: 18,
  },
});
