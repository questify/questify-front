import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/core/contexts/AuthContext';
import {
  useValidationsHistory,
  useDailyOverview,
  useQuests,
} from '@/core/hooks/useApi';
import { QuestifyColors } from '@/mobile/constants/colors';
import { QuestifyFonts, QuestifyTypography } from '@/mobile/constants/fonts';
import { Card } from '@/mobile/components/ui/Card';

// ─── Level system ─────────────────────────────────────────────────────────────
function computeLevel(totalPoints: number) {
  let level = 1;
  let xpConsumed = 0;
  while (true) {
    const xpForNext = 300 * level;
    if (xpConsumed + xpForNext > totalPoints) break;
    xpConsumed += xpForNext;
    level++;
  }
  const xpInLevel = totalPoints - xpConsumed;
  const xpNeeded = 300 * level;
  const percent = Math.round((xpInLevel / xpNeeded) * 100);
  return { level, xpInLevel, xpNeeded, xpToNext: xpNeeded - xpInLevel, percent };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAY_NAMES = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const MONTH_LABELS = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function toMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const { user } = useAuth();
  const { data: history = [], isLoading, refetch } = useValidationsHistory(365);
  const { data: dailyOverview } = useDailyOverview();
  const { data: quests = [] } = useQuests();

  // ── Level ──────────────────────────────────────────────────────────────────
  const levelInfo = useMemo(
    () => computeLevel(user?.total_points ?? 0),
    [user?.total_points],
  );

  // ── XP today ──────────────────────────────────────────────────────────────
  const xpToday = useMemo(() => {
    const today = new Date();
    return history
      .filter((v: any) => isSameDay(new Date(v.date), today))
      .reduce((s: number, v: any) => s + (v.points_earned ?? 0), 0);
  }, [history]);

  // ── Daily objectives ───────────────────────────────────────────────────────
  const objectivesToday = dailyOverview?.validated_count ?? 0;
  const totalActive = (quests as any[]).filter((q: any) => q.is_active).length;

  // ── Streak ─────────────────────────────────────────────────────────────────
  const streakCurrent = user?.streak_current ?? 0;
  const streakRecord = user?.streak_record ?? 0;
  const bonusActive = streakCurrent >= 3;

  // ── Monthly chart ──────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MONTH_LABELS[d.getMonth()],
        count: 0,
        isCurrent: i === 5,
      };
    });
    history.forEach((v: any) => {
      const m = months.find(m => m.key === toMonthKey(v.date));
      if (m) m.count++;
    });
    return months;
  }, [history]);

  const maxCount = Math.max(...monthlyData.map(m => m.count), 1);

  // ── Category breakdown ─────────────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, { name: string; color: string; count: number }> = {};
    history.forEach((v: any) => {
      const key = v.category_name ?? 'Autre';
      const color = v.category_color ?? QuestifyColors.primary;
      if (!totals[key]) totals[key] = { name: key, color, count: 0 };
      totals[key].count++;
    });
    const total = history.length || 1;
    return Object.values(totals)
      .sort((a, b) => b.count - a.count)
      .map(c => ({ ...c, pct: Math.round((c.count / total) * 100) }));
  }, [history]);

  // ── Success rate ───────────────────────────────────────────────────────────
  const successRate = useMemo(() => {
    if (history.length === 0) return 0;
    const dailyQs = (quests as any[]).filter((q: any) => q.is_active && q.frequency === 'daily');
    const start = user?.start_date ? new Date(user.start_date) : new Date(Date.now() - 30 * 86400000);
    const daysSince = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000));
    const possible = dailyQs.length * daysSince;
    if (possible === 0) return 100;
    return Math.min(100, Math.round((history.length / possible) * 100));
  }, [history, quests, user?.start_date]);

  // ── Preferred day ──────────────────────────────────────────────────────────
  const preferredDay = useMemo(() => {
    const counts = new Array(7).fill(0);
    history.forEach((v: any) => { counts[new Date(v.date).getDay()]++; });
    return DAY_NAMES[counts.indexOf(Math.max(...counts))];
  }, [history]);

  // ── Preferred category ─────────────────────────────────────────────────────
  const preferredCategory = categoryBreakdown[0]?.name ?? '—';

  // ── Member since ───────────────────────────────────────────────────────────
  const memberSince = useMemo(() => {
    const start = user?.start_date;
    if (!start) return '—';
    const days = Math.floor((Date.now() - new Date(start).getTime()) / 86400000);
    return `${days} jours`;
  }, [user?.start_date]);

  // ── Complete weeks ─────────────────────────────────────────────────────────
  const completeWeeks = useMemo(() => {
    const days = new Set(history.map((v: any) => v.date?.slice(0, 10)));
    let count = 0;
    const now = new Date();
    for (let w = 0; w < 52; w++) {
      let allDays = true;
      for (let d = 0; d < 7; d++) {
        const day = new Date(now);
        day.setDate(day.getDate() - w * 7 - d);
        if (!days.has(day.toISOString().slice(0, 10))) { allDays = false; break; }
      }
      if (allDays) count++;
      else if (count > 0) break;
    }
    return count;
  }, [history]);

  // ── Consecutive months ─────────────────────────────────────────────────────
  const consecutiveMonths = useMemo(() => {
    const months = new Set(history.map((v: any) => toMonthKey(v.date)));
    let count = 0;
    const now = new Date();
    for (let m = 0; m < 24; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      if (months.has(`${d.getFullYear()}-${d.getMonth()}`)) count++;
      else break;
    }
    return count;
  }, [history]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={QuestifyColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={QuestifyColors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📈 Statistiques</Text>
        </View>

        {/* ── Progression ── */}
        <Card style={styles.card}>
          <SectionHeader icon="☆" label="Progression" />

          <View style={styles.xpRow}>
            <Text style={styles.xpValue}>{(user?.total_points ?? 0).toLocaleString('fr-FR')}</Text>
            <Text style={styles.xpMeta}> XP · niv. {levelInfo.level}</Text>
          </View>
          <Text style={styles.xpSub}>encore {levelInfo.xpToNext} XP avant le niveau {levelInfo.level + 1}</Text>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${levelInfo.percent}%` as any }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressPct}>{levelInfo.percent}%</Text>
            <Text style={styles.progressPct}>Niv. {levelInfo.level} → {levelInfo.level + 1}</Text>
          </View>

          {/* Badges */}
          <View style={styles.pillRow}>
            {xpToday > 0 && (
              <Pill bg="#C8EAD3" fg="#5BA073" label={`🔥 +${xpToday} XP aujourd'hui`} />
            )}
            {bonusActive && (
              <Pill bg="#FFE8D0" fg="#D87A3E" label="⚡ Bonus ×1.5 actif" />
            )}
            {totalActive > 0 && (
              <Pill bg="#E8DFFA" fg="#8F72C4" label={`✓ ${objectivesToday}/${totalActive} objectifs`} />
            )}
          </View>
        </Card>

        {/* ── Séries ── */}
        <Card style={styles.card}>
          <SectionHeader icon="🔥" label="Séries" iconColor="#E8603C" />
          <View style={styles.seriesGrid}>
            <SerieCell value={streakCurrent} label="jours consécutifs" color="#E8603C" />
            <SerieCell value={completeWeeks} label="semaines complètes" color={QuestifyColors.blue} />
            <SerieCell value={consecutiveMonths} label="mois consécutifs" />
            <SerieCell value={`${successRate}%`} label="taux de réussite" color="#D8A857" />
          </View>
        </Card>

        {/* ── Chart mensuel ── */}
        <Card style={styles.card}>
          <SectionHeader icon="📊" label="Objectifs réussis par mois" iconColor={QuestifyColors.blue} />
          <View style={styles.chartContainer}>
            {monthlyData.map(m => {
              const heightPct = (m.count / maxCount) * 100;
              return (
                <View key={m.key} style={styles.chartCol}>
                  <Text style={styles.chartCount}>{m.count > 0 ? m.count : ''}</Text>
                  <View style={styles.chartBarTrack}>
                    <View style={[
                      styles.chartBar,
                      { height: `${Math.max(heightPct, m.count > 0 ? 4 : 0)}%` as any },
                      m.isCurrent && styles.chartBarCurrent,
                    ]} />
                  </View>
                  <Text style={[styles.chartLabel, m.isCurrent && styles.chartLabelCurrent]}>
                    {m.label}{m.isCurrent ? ' •' : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* ── En détail ── */}
        <Card style={styles.card}>
          <SectionHeader icon="≡" label="En détail" />
          <View style={styles.detailList}>
            <DetailRow icon="🎯" bg="#DEF0FC" label="Objectifs créés" value={quests.length} />
            <DetailRow icon="✓" bg="#E0F5E8" label="Taux de réussite" value={`${successRate}%`} />
            <DetailRow icon="🔥" bg="#FFE8D0" label="Meilleure série" value={`${streakRecord} jours`} />
            <DetailRow icon="🏅" bg="#E8DFFA" label="Succès débloqués" value={computeAchievements(user, history.length, streakRecord)} />
            <DetailRow icon="📅" bg="#E0F5E8" label="Jour préféré" value={preferredDay} />
            <DetailRow icon="☆" bg="#E8DFFA" label="Catégorie préférée" value={preferredCategory} />
            <DetailRow icon="🕐" bg="#FFE8D0" label="Membre depuis" value={memberSince} />
          </View>
        </Card>

        {/* ── Répartition par catégorie ── */}
        {categoryBreakdown.length > 0 && (
          <Card style={styles.cardLast}>
            <SectionHeader icon="🏷" label="Répartition par catégorie" iconColor={QuestifyColors.blue} />
            <View style={styles.catList}>
              {categoryBreakdown.map(cat => (
                <CategoryRow key={cat.name} name={cat.name} pct={cat.pct} color={cat.color} />
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Achievements helper ──────────────────────────────────────────────────────
function computeAchievements(user: any, totalValidations: number, streakRecord: number): string {
  let unlocked = 0;
  const total = 60;
  const pts = user?.total_points ?? 0;
  if (pts >= 100) unlocked++;
  if (pts >= 500) unlocked++;
  if (pts >= 1000) unlocked++;
  if (pts >= 5000) unlocked++;
  if (pts >= 10000) unlocked++;
  if (totalValidations >= 1) unlocked++;
  if (totalValidations >= 10) unlocked++;
  if (totalValidations >= 50) unlocked++;
  if (totalValidations >= 100) unlocked++;
  if (totalValidations >= 500) unlocked++;
  if (streakRecord >= 3) unlocked++;
  if (streakRecord >= 7) unlocked++;
  if (streakRecord >= 14) unlocked++;
  if (streakRecord >= 30) unlocked++;
  if (streakRecord >= 100) unlocked++;
  return `${Math.min(unlocked, total)} / ${total}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ icon, label, iconColor = QuestifyColors.primaryDark }: { icon: string; label: string; iconColor?: string }) {
  return (
    <View style={sh.row}>
      <Text style={[sh.icon, { color: iconColor }]}>{icon}</Text>
      <Text style={sh.label}>{label}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  icon: { fontSize: 15 },
  label: { fontSize: 15, fontWeight: '600', color: QuestifyColors.textPrimary },
});

function Pill({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  return (
    <View style={[pillS.pill, { backgroundColor: bg }]}>
      <Text style={[pillS.text, { color: fg }]}>{label}</Text>
    </View>
  );
}
const pillS = StyleSheet.create({
  pill: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, marginBottom: 4 },
  text: { fontSize: 12, fontWeight: '600' },
});

function SerieCell({ value, label, color = QuestifyColors.textPrimary }: {
  value: string | number; label: string; color?: string;
}) {
  return (
    <View style={scS.cell}>
      <Text style={[scS.value, { color }]}>{value}</Text>
      <Text style={scS.label}>{label}</Text>
    </View>
  );
}
const scS = StyleSheet.create({
  cell: { width: '48%', backgroundColor: '#FAFAFA', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  value: { fontFamily: QuestifyFonts.display, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 30 },
  label: { fontSize: 11, color: QuestifyColors.textSecondary, textAlign: 'center', marginTop: 4 },
});

function DetailRow({ icon, bg, label, value }: { icon: string; bg: string; label: string; value: string | number }) {
  return (
    <View style={drS.row}>
      <View style={[drS.iconBox, { backgroundColor: bg }]}>
        <Text style={drS.iconText}>{icon}</Text>
      </View>
      <Text style={drS.label}>{label}</Text>
      <Text style={drS.value}>{value}</Text>
    </View>
  );
}
const drS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 16 },
  label: { flex: 1, fontSize: 14, color: QuestifyColors.textSecondary },
  value: { fontFamily: QuestifyFonts.display, fontSize: 14, fontWeight: '700', color: QuestifyColors.textPrimary },
});

function CategoryRow({ name, pct, color }: { name: string; pct: number; color: string }) {
  return (
    <View style={crS.row}>
      <View style={[crS.dot, { backgroundColor: color }]} />
      <Text style={crS.name} numberOfLines={1}>{name}</Text>
      <View style={crS.track}>
        <View style={[crS.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={crS.pct}>{pct}%</Text>
    </View>
  );
}
const crS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { width: 120, fontSize: 13, color: QuestifyColors.textPrimary },
  track: { flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  pct: { width: 36, fontSize: 13, fontWeight: '600', color: QuestifyColors.textPrimary, textAlign: 'right' },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: QuestifyColors.backgroundLight },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
  title: {
    fontFamily: QuestifyFonts.display,
    fontSize: QuestifyTypography.fsH1,
    fontWeight: '800',
    color: QuestifyColors.textPrimary,
    letterSpacing: -0.5,
  },

  card: { marginHorizontal: 20, marginBottom: 16, padding: 20 },
  cardLast: { marginHorizontal: 20, marginBottom: 32, padding: 20 },

  // Progression
  xpRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 },
  xpValue: {
    fontFamily: QuestifyFonts.display,
    fontSize: 36,
    fontWeight: '800',
    color: QuestifyColors.textPrimary,
    letterSpacing: -0.5,
  },
  xpMeta: { fontSize: 15, color: QuestifyColors.textSecondary, marginBottom: 5 },
  xpSub: { fontSize: 12, color: QuestifyColors.textSecondary, marginBottom: 10 },

  progressTrack: {
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: QuestifyColors.blue,
    borderRadius: 10,
  },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  progressPct: { fontSize: 12, color: QuestifyColors.textSecondary },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  // Séries
  seriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  chartCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  chartCount: { fontSize: 10, color: QuestifyColors.textSecondary, fontWeight: '600', marginBottom: 2 },
  chartBarTrack: { width: '100%', height: '80%', justifyContent: 'flex-end' },
  chartBar: {
    width: '100%',
    backgroundColor: QuestifyColors.green,
    borderRadius: 6,
  },
  chartBarCurrent: { backgroundColor: QuestifyColors.blue },
  chartLabel: { fontSize: 10, color: QuestifyColors.textLight, marginTop: 4, textAlign: 'center' },
  chartLabelCurrent: { color: QuestifyColors.blue, fontWeight: '600' },

  // En détail
  detailList: { gap: 0 },

  // Catégories
  catList: { gap: 0 },
});
