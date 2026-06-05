import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useTeams,
  useTeamMembers,
  useQuests,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useAddTeamMember,
  useRemoveTeamMember,
  useTeamChallenges,
  useCreateTeamChallenge,
  useDeleteTeamChallenge,
  useTeamSharedProgress,
} from '@/core/hooks/useApi';
import { useAuth } from '@/core/contexts/AuthContext';
import { getAvatarUrl, isAvatarImage } from '@/core/utils/avatar';
import { QuestifyColors } from '@/mobile/constants/colors';
import { QuestifyFonts } from '@/mobile/constants/fonts';
import { Card } from '@/mobile/components/ui/Card';
import { api } from '@/core/services/api';

// ─── Sub-component: Member avatar ────────────────────────────────────────────
function MemberAvatar({ member, size = 48, showName = false }: {
  member: any; size?: number; showName?: boolean;
}) {
  const avatarUrl = getAvatarUrl(member.avatar_url);
  const initials = (member.name || '?').charAt(0).toUpperCase();

  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      {isAvatarImage(member.avatar_url) && avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View style={[
          avS.circle,
          { width: size, height: size, borderRadius: size / 2 },
        ]}>
          <Text style={[avS.text, { fontSize: size * 0.38 }]}>
            {avatarUrl || initials}
          </Text>
        </View>
      )}
      {showName && (
        <Text style={avS.name} numberOfLines={1}>{member.name}</Text>
      )}
    </View>
  );
}
const avS = StyleSheet.create({
  circle: {
    backgroundColor: QuestifyColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { fontWeight: '700', color: '#1A1A1A' },
  name: { fontSize: 11, color: QuestifyColors.textSecondary, maxWidth: 60, textAlign: 'center' },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function CompetitionScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'team' | 'manage'>('team');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedQuestIds, setSelectedQuestIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Member search
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Queries
  const { data: teams, isLoading: teamsLoading, refetch: refetchTeams } = useTeams();
  const { data: teamMembers, refetch: refetchMembers } = useTeamMembers(selectedTeamId || '');
  const { data: quests } = useQuests();
  const { data: teamChallenges } = useTeamChallenges(selectedTeamId || '');
  const { data: sharedProgress, refetch: refetchProgress } = useTeamSharedProgress(selectedTeamId || '');

  // Mutations
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();
  const createTeamChallenge = useCreateTeamChallenge();
  const deleteTeamChallenge = useDeleteTeamChallenge();

  // Auto-select first team
  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
      setTeamName(teams[0].name);
    }
  }, [teams, selectedTeamId]);

  // Sync selected members from team
  useEffect(() => {
    if (teamMembers) {
      setSelectedUserIds(teamMembers.map((m: any) => m.id));
    }
  }, [teamMembers]);

  // Sync selected quests from challenge
  useEffect(() => {
    if (teamChallenges && teamChallenges.length > 0) {
      setSelectedQuestIds(teamChallenges[0].quest_ids || []);
    }
  }, [teamChallenges]);

  const currentTeam = teams?.find((t: any) => t.id === selectedTeamId);
  const hasTeam = teams && teams.length > 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchTeams(), refetchMembers(), refetchProgress()]);
    setRefreshing(false);
  }, [refetchTeams, refetchMembers, refetchProgress]);

  // ── Member @ search ─────────────────────────────────────────────────────────
  const handleSearchChange = (text: string) => {
    setMemberSearch(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    const query = text.replace(/^@/, '').trim();
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await api.teams.searchUsers(query);
        // Exclude already-selected members
        setSearchResults(results.filter((u: any) => !selectedUserIds.includes(u.id)));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleAddFromSearch = (foundUser: any) => {
    if (!selectedUserIds.includes(foundUser.id)) {
      setSelectedUserIds(prev => [...prev, foundUser.id]);
    }
    setMemberSearch('');
    setSearchResults([]);
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedUserIds(prev => prev.filter(id => id !== userId));
  };

  const toggleQuestSelection = (questId: string) => {
    setSelectedQuestIds(prev =>
      prev.includes(questId) ? prev.filter(id => id !== questId) : [...prev, questId]
    );
  };

  // ── Save team ────────────────────────────────────────────────────────────────
  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Erreur', 'Donne un nom à ton équipe');
      return;
    }
    try {
      let teamId = selectedTeamId;

      if (selectedTeamId) {
        await updateTeam.mutateAsync({ id: selectedTeamId, data: { name: teamName } });

        const currentMemberIds = teamMembers?.map((m: any) => m.id) || [];
        const toAdd = selectedUserIds.filter(id => !currentMemberIds.includes(id));
        const toRemove = currentMemberIds.filter((id: string) => !selectedUserIds.includes(id));
        for (const uid of toAdd) await addMember.mutateAsync({ teamId: selectedTeamId, userId: uid });
        for (const uid of toRemove) await removeMember.mutateAsync({ teamId: selectedTeamId, userId: uid });

        // Refresh challenges
        if (teamChallenges && teamChallenges.length > 0) {
          await deleteTeamChallenge.mutateAsync({ teamId: selectedTeamId, challengeId: teamChallenges[0].id });
        }
        if (selectedQuestIds.length > 0) {
          await createTeamChallenge.mutateAsync({
            teamId: selectedTeamId,
            data: {
              name: `Objectifs communs — ${teamName}`,
              points: 100,
              bonus_multiplier: 1.5,
              quest_ids: selectedQuestIds,
            },
          });
        }
      } else {
        const newTeam = await createTeam.mutateAsync({ name: teamName });
        teamId = newTeam.id;
        for (const uid of selectedUserIds) await addMember.mutateAsync({ teamId: newTeam.id, userId: uid });
        if (selectedQuestIds.length > 0) {
          await createTeamChallenge.mutateAsync({
            teamId: newTeam.id,
            data: {
              name: `Objectifs communs — ${teamName}`,
              points: 100,
              bonus_multiplier: 1.5,
              quest_ids: selectedQuestIds,
            },
          });
        }
        setSelectedTeamId(newTeam.id);
      }

      setActiveTab('team');
      Alert.alert('✅ Enregistré', 'Équipe mise à jour avec succès');
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'enregistrer l'équipe");
    }
  };

  const handleDeleteTeam = () => {
    if (!selectedTeamId) return;
    Alert.alert('Supprimer l\'équipe', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await deleteTeam.mutateAsync(selectedTeamId);
            setSelectedTeamId(null);
            setTeamName('');
            setSelectedUserIds([]);
            setActiveTab('team');
          } catch { Alert.alert('Erreur', 'Impossible de supprimer l\'équipe'); }
        },
      },
    ]);
  };

  if (teamsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={QuestifyColors.primary} />
      </View>
    );
  }

  // ─── Build selected users list for display in manage tab ──────────────────
  // Combine team members (existing) + search-added users not yet persisted
  const allKnownUsers: any[] = teamMembers || [];
  const pendingUsers = selectedUserIds
    .filter(id => !allKnownUsers.find((m: any) => m.id === id))
    .map(id => searchResults.find(u => u.id === id) || { id, name: '…', avatar_url: null });
  const displayMembers = [...allKnownUsers, ...pendingUsers].filter((u: any) =>
    selectedUserIds.includes(u.id)
  );

  // ─── Shared quests (active only) ──────────────────────────────────────────
  const activeQuests = (quests || []).filter((q: any) => q.is_active);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={QuestifyColors.primary} />}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Compétition 🏆</Text>
          <Text style={styles.subtitle}>Progressez ensemble</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['team', 'manage'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'team' ? 'Mon équipe' : 'Gérer'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TAB: Mon équipe ─────────────────────────────────────────────── */}
        {activeTab === 'team' ? (
          hasTeam && currentTeam ? (
            <>
              {/* Team card */}
              <Card style={styles.teamCard}>
                <Text style={styles.teamName}>{currentTeam.name}</Text>

                {/* Members row */}
                <View style={styles.teamMembers}>
                  {teamMembers?.map((member: any, i: number) => (
                    <View key={member.id} style={styles.memberRow}>
                      {i > 0 && <Text style={styles.handshake}>🤝</Text>}
                      <MemberAvatar member={member} size={56} showName />
                    </View>
                  ))}
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{teamMembers?.length || 0}</Text>
                    <Text style={styles.statLabel}>Membres</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{sharedProgress?.quests?.length || 0}</Text>
                    <Text style={styles.statLabel}>Objectifs</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {sharedProgress?.challenge?.bonus_multiplier
                        ? `×${sharedProgress.challenge.bonus_multiplier}`
                        : '—'}
                    </Text>
                    <Text style={styles.statLabel}>Bonus XP</Text>
                  </View>
                </View>
              </Card>

              {/* Shared objectives */}
              <Text style={styles.sectionTitle}>Objectifs partagés</Text>

              {sharedProgress?.quests?.length > 0 ? (
                sharedProgress.quests.map((quest: any) => (
                  <SharedQuestCard key={quest.id} quest={quest} currentUserId={user?.id} />
                ))
              ) : (
                <Card style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>🎯</Text>
                  <Text style={styles.emptyTitle}>Aucun objectif partagé</Text>
                  <Text style={styles.emptyText}>
                    Sélectionne des quêtes dans l'onglet "Gérer" pour créer des objectifs communs
                  </Text>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => setActiveTab('manage')}>
                    <Text style={styles.primaryButtonText}>Configurer l'équipe</Text>
                  </TouchableOpacity>
                </Card>
              )}
            </>
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>Aucune équipe</Text>
              <Text style={styles.emptyText}>Crée ton équipe pour progresser ensemble</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setActiveTab('manage')}>
                <Text style={styles.primaryButtonText}>Créer mon équipe</Text>
              </TouchableOpacity>
            </Card>
          )
        ) : (
          /* ── TAB: Gérer ─────────────────────────────────────────────────── */
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>{hasTeam ? 'Modifier mon équipe' : 'Créer mon équipe'}</Text>

            {/* Team name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom de l'équipe</Text>
              <TextInput
                style={styles.input}
                placeholder="Team Wellness Warriors"
                placeholderTextColor={QuestifyColors.textSecondary}
                value={teamName}
                onChangeText={setTeamName}
              />
            </View>

            {/* ── Member @ search ── */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ajouter un membre</Text>
              <View style={styles.searchRow}>
                <Text style={styles.atSign}>@</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="pseudo ou email…"
                  placeholderTextColor={QuestifyColors.textLight}
                  value={memberSearch}
                  onChangeText={handleSearchChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isSearching && <ActivityIndicator size="small" color={QuestifyColors.primary} style={{ marginRight: 10 }} />}
              </View>

              {/* Search results dropdown */}
              {searchResults.length > 0 && (
                <View style={styles.searchDropdown}>
                  {searchResults.map(u => (
                    <TouchableOpacity
                      key={u.id}
                      style={styles.searchResultItem}
                      onPress={() => handleAddFromSearch(u)}
                      activeOpacity={0.7}>
                      <MemberAvatar member={u} size={36} />
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultName}>{u.name}</Text>
                        <Text style={styles.searchResultEmail}>{u.email}</Text>
                      </View>
                      <Text style={styles.addIcon}>＋</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Selected members */}
              {displayMembers.length > 0 && (
                <View style={styles.selectedMembers}>
                  <Text style={styles.selectedLabel}>
                    {displayMembers.length} membre{displayMembers.length > 1 ? 's' : ''} sélectionné{displayMembers.length > 1 ? 's' : ''}
                  </Text>
                  {displayMembers.map((m: any) => (
                    <View key={m.id} style={styles.selectedMemberRow}>
                      <MemberAvatar member={m} size={36} />
                      <View style={styles.selectedMemberInfo}>
                        <Text style={styles.selectedMemberName}>{m.name}</Text>
                        {m.email && <Text style={styles.selectedMemberEmail}>{m.email}</Text>}
                      </View>
                      {m.id !== user?.id && (
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => handleRemoveMember(m.id)}
                          activeOpacity={0.7}>
                          <Text style={styles.removeBtnText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ── Shared quests selection ── */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Objectifs communs (optionnel)</Text>
              <Text style={styles.helperText}>
                Ces quêtes seront partagées — chaque membre voit la progression des autres ✨
              </Text>
              {activeQuests.length === 0 ? (
                <Text style={styles.noQuestsHint}>Aucune quête active — crée-en d'abord dans l'onglet Quêtes</Text>
              ) : (
                <View style={styles.questList}>
                  {activeQuests.map((quest: any) => {
                    const selected = selectedQuestIds.includes(quest.id);
                    return (
                      <TouchableOpacity
                        key={quest.id}
                        style={[styles.questItem, selected && styles.questItemSelected]}
                        onPress={() => toggleQuestSelection(quest.id)}
                        activeOpacity={0.7}>
                        <Text style={styles.questEmoji}>{quest.svg_icon || '🎯'}</Text>
                        <View style={styles.questInfo}>
                          <Text style={styles.questTitle} numberOfLines={1}>{quest.title}</Text>
                          <Text style={styles.questMeta}>{quest.category_name} · +{quest.points} pts</Text>
                        </View>
                        {selected && <Text style={styles.checkGreen}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <Text style={styles.helperText}>{selectedQuestIds.length} sélectionné(s)</Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.primaryButton, (createTeam.isPending || updateTeam.isPending) && styles.buttonDisabled]}
                onPress={handleSaveTeam}
                disabled={createTeam.isPending || updateTeam.isPending}>
                <Text style={styles.primaryButtonText}>
                  {createTeam.isPending || updateTeam.isPending
                    ? 'Enregistrement…'
                    : hasTeam ? 'Enregistrer' : 'Créer l\'équipe'}
                </Text>
              </TouchableOpacity>
              {hasTeam && (
                <TouchableOpacity
                  style={[styles.dangerButton, deleteTeam.isPending && styles.buttonDisabled]}
                  onPress={handleDeleteTeam}
                  disabled={deleteTeam.isPending}>
                  <Text style={styles.dangerButtonText}>
                    {deleteTeam.isPending ? 'Suppression…' : 'Supprimer l\'équipe'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Shared quest card ────────────────────────────────────────────────────────
function SharedQuestCard({ quest, currentUserId }: { quest: any; currentUserId?: string }) {
  const allDone = quest.completed_count === quest.total_count && quest.total_count > 0;
  const progressPct = quest.total_count > 0
    ? Math.round((quest.completed_count / quest.total_count) * 100)
    : 0;

  return (
    <Card style={sqS.card}>
      <View style={sqS.header}>
        <Text style={sqS.emoji}>{quest.svg_icon || '🎯'}</Text>
        <View style={sqS.titleBox}>
          <Text style={sqS.title}>{quest.title}</Text>
          <Text style={sqS.meta}>{quest.category_name} · +{quest.points} pts</Text>
        </View>
        {allDone && <Text style={sqS.allDone}>🎉</Text>}
      </View>

      {/* Progress bar */}
      <View style={sqS.barTrack}>
        <View style={[
          sqS.barFill,
          { width: `${progressPct}%` as any },
          allDone && { backgroundColor: QuestifyColors.green },
        ]} />
      </View>
      <Text style={sqS.progressText}>{quest.completed_count} / {quest.total_count} membres</Text>

      {/* Member avatars with status */}
      <View style={sqS.membersRow}>
        {quest.members?.map((m: any) => (
          <View key={m.user_id} style={sqS.memberCell}>
            <View style={sqS.avatarWrap}>
              <MemberAvatar member={{ ...m, id: m.user_id }} size={40} />
              <View style={[sqS.badge, m.validated_today ? sqS.badgeDone : sqS.badgePending]}>
                <Text style={sqS.badgeText}>{m.validated_today ? '✓' : '·'}</Text>
              </View>
            </View>
            <Text style={[sqS.memberName, m.user_id === currentUserId && sqS.memberNameSelf]} numberOfLines={1}>
              {m.user_id === currentUserId ? 'Toi' : m.name.split(' ')[0]}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const sqS = StyleSheet.create({
  card: { marginHorizontal: 20, marginBottom: 12, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  emoji: { fontSize: 28 },
  titleBox: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: QuestifyColors.textPrimary },
  meta: { fontSize: 12, color: QuestifyColors.textSecondary, marginTop: 2 },
  allDone: { fontSize: 22 },
  barTrack: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 999, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: '100%', backgroundColor: QuestifyColors.primary, borderRadius: 999 },
  progressText: { fontSize: 11, color: QuestifyColors.textSecondary, marginBottom: 14 },
  membersRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  memberCell: { alignItems: 'center', gap: 4 },
  avatarWrap: { position: 'relative' },
  badge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'white',
  },
  badgeDone: { backgroundColor: '#5BA073' },
  badgePending: { backgroundColor: '#E0E0E0' },
  badgeText: { fontSize: 9, fontWeight: '700', color: 'white' },
  memberName: { fontSize: 11, color: QuestifyColors.textSecondary, maxWidth: 50, textAlign: 'center' },
  memberNameSelf: { color: QuestifyColors.primaryDark, fontWeight: '600' },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: QuestifyColors.backgroundLight },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },

  header: { padding: 20, paddingTop: 10 },
  title: {
    fontFamily: QuestifyFonts.display,
    fontSize: 28, fontWeight: '800',
    color: QuestifyColors.textPrimary, marginBottom: 4, letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: QuestifyColors.textSecondary },

  tabsContainer: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 20,
    backgroundColor: QuestifyColors.backgroundDark,
    borderRadius: 12, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: QuestifyColors.background },
  tabText: { fontSize: 14, fontWeight: '600', color: QuestifyColors.textSecondary },
  tabTextActive: { color: QuestifyColors.primary },

  // Team card
  teamCard: { marginHorizontal: 20, marginBottom: 20, padding: 20 },
  teamName: {
    fontFamily: QuestifyFonts.display, fontSize: 22, fontWeight: '800',
    color: QuestifyColors.textPrimary, marginBottom: 16, textAlign: 'center', letterSpacing: -0.4,
  },
  teamMembers: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  handshake: { fontSize: 20 },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16,
    backgroundColor: QuestifyColors.backgroundLight, borderRadius: 12,
  },
  statItem: { alignItems: 'center' },
  statValue: {
    fontFamily: QuestifyFonts.display, fontSize: 22, fontWeight: '800',
    color: QuestifyColors.textPrimary, marginBottom: 2,
  },
  statLabel: { fontSize: 11, color: QuestifyColors.textSecondary, textAlign: 'center' },

  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: QuestifyColors.textPrimary,
    marginHorizontal: 20, marginBottom: 12,
  },

  // Empty states
  emptyCard: { marginHorizontal: 20, marginBottom: 20, alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: QuestifyColors.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: QuestifyColors.textSecondary, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },

  // Manage form
  formCard: { marginHorizontal: 20, marginBottom: 20 },
  formTitle: { fontSize: 18, fontWeight: '700', color: QuestifyColors.textPrimary, marginBottom: 20 },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: QuestifyColors.textPrimary, marginBottom: 8 },
  input: {
    borderWidth: 2, borderColor: QuestifyColors.border, borderRadius: 12,
    padding: 12, fontSize: 14, color: QuestifyColors.textPrimary,
    backgroundColor: QuestifyColors.background,
  },
  helperText: { fontSize: 12, color: QuestifyColors.textSecondary, marginTop: 6 },
  noQuestsHint: { fontSize: 13, color: QuestifyColors.textLight, fontStyle: 'italic', marginTop: 4 },

  // @ search
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderColor: QuestifyColors.primary,
    borderRadius: 12, backgroundColor: QuestifyColors.background, overflow: 'hidden',
  },
  atSign: {
    paddingLeft: 14, paddingRight: 2, fontSize: 18, fontWeight: '700',
    color: QuestifyColors.primaryDark, lineHeight: 48,
  },
  searchInput: {
    flex: 1, padding: 12, fontSize: 15, color: QuestifyColors.textPrimary,
  },
  searchDropdown: {
    borderWidth: 1, borderColor: QuestifyColors.border, borderRadius: 12,
    backgroundColor: QuestifyColors.background, marginTop: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  searchResultItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderBottomWidth: 1, borderBottomColor: QuestifyColors.divider,
  },
  searchResultInfo: { flex: 1 },
  searchResultName: { fontSize: 14, fontWeight: '600', color: QuestifyColors.textPrimary },
  searchResultEmail: { fontSize: 12, color: QuestifyColors.textSecondary },
  addIcon: { fontSize: 22, color: QuestifyColors.primaryDark, fontWeight: '700' },

  // Selected members
  selectedMembers: {
    marginTop: 12, borderWidth: 1, borderColor: QuestifyColors.border,
    borderRadius: 12, overflow: 'hidden',
  },
  selectedLabel: {
    fontSize: 12, fontWeight: '600', color: QuestifyColors.textSecondary,
    padding: 10, backgroundColor: QuestifyColors.backgroundLight,
  },
  selectedMemberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: QuestifyColors.divider,
  },
  selectedMemberInfo: { flex: 1 },
  selectedMemberName: { fontSize: 14, fontWeight: '600', color: QuestifyColors.textPrimary },
  selectedMemberEmail: { fontSize: 12, color: QuestifyColors.textSecondary },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FFE8E0', alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { fontSize: 12, color: QuestifyColors.error, fontWeight: '700' },

  // Quest list
  questList: { marginTop: 8, gap: 6 },
  questItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 10,
    backgroundColor: QuestifyColors.backgroundLight,
    borderWidth: 2, borderColor: 'transparent',
  },
  questItemSelected: {
    backgroundColor: '#E0F5E8', borderColor: '#C8EAD3',
  },
  questEmoji: { fontSize: 22 },
  questInfo: { flex: 1 },
  questTitle: { fontSize: 14, fontWeight: '600', color: QuestifyColors.textPrimary },
  questMeta: { fontSize: 12, color: QuestifyColors.textSecondary, marginTop: 2 },
  checkGreen: { fontSize: 18, color: '#5BA073', fontWeight: '700' },

  // Actions
  actions: { gap: 12, marginTop: 4 },
  primaryButton: {
    backgroundColor: QuestifyColors.primary, paddingVertical: 14,
    borderRadius: 12, alignItems: 'center',
  },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  dangerButton: {
    backgroundColor: '#FFE8E0', paddingVertical: 14,
    borderRadius: 12, alignItems: 'center',
  },
  dangerButtonText: { fontSize: 16, fontWeight: '600', color: '#D87A5E' },
  buttonDisabled: { opacity: 0.5 },
});
