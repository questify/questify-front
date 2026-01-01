import React, { useState, useEffect } from 'react';
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
  useUsers,
  useQuests,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useAddTeamMember,
  useRemoveTeamMember,
  useTeamChallenges,
  useCreateTeamChallenge,
  useDeleteTeamChallenge,
  useAuth,
} from '@core/hooks/useApi';
import { getAvatarUrl, isAvatarImage } from '@core/utils/avatar';
import { QuestifyColors } from '@/mobile/constants/colors';
import { Card } from '@/mobile/components/ui/Card';

export default function CompetitionScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'team' | 'manage'>('team');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedQuestIds, setSelectedQuestIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const { data: teams, isLoading: teamsLoading, refetch: refetchTeams } = useTeams();
  const { data: teamMembers, isLoading: membersLoading } = useTeamMembers(selectedTeamId || '');
  const { data: allUsers, isLoading: usersLoading } = useUsers();
  const { data: quests, isLoading: questsLoading } = useQuests();
  const { data: teamChallenges } = useTeamChallenges(selectedTeamId || '');

  // Filter out current user from the list
  const availableUsers = allUsers?.filter((u: any) => u.id !== user?.id);

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
      const firstTeam = teams[0];
      setSelectedTeamId(firstTeam.id);
      setTeamName(firstTeam.name);
    }
  }, [teams, selectedTeamId]);

  // Update selected user IDs when team members change
  useEffect(() => {
    if (teamMembers) {
      setSelectedUserIds(teamMembers.map((m: any) => m.id));
    }
  }, [teamMembers]);

  // Update selected quest IDs when team challenges change
  useEffect(() => {
    if (teamChallenges && teamChallenges.length > 0) {
      const firstChallenge = teamChallenges[0];
      if (firstChallenge.quest_ids) {
        setSelectedQuestIds(firstChallenge.quest_ids);
      }
    }
  }, [teamChallenges]);

  const currentTeam = teams?.find((t: any) => t.id === selectedTeamId);
  const hasTeam = teams && teams.length > 0;

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetchTeams();
    setRefreshing(false);
  }, [refetchTeams]);

  const handleSaveTeam = async () => {
    if (!teamName) return;

    try {
      let teamId = selectedTeamId;

      if (selectedTeamId) {
        // Update existing team
        await updateTeam.mutateAsync({
          id: selectedTeamId,
          data: { name: teamName },
        });

        // Update members
        const currentMemberIds = teamMembers?.map((m: any) => m.id) || [];
        const toAdd = selectedUserIds.filter((id) => !currentMemberIds.includes(id));
        const toRemove = currentMemberIds.filter((id: string) => !selectedUserIds.includes(id));

        for (const userId of toAdd) {
          await addMember.mutateAsync({ teamId: selectedTeamId, userId });
        }

        for (const userId of toRemove) {
          await removeMember.mutateAsync({ teamId: selectedTeamId, userId });
        }

        // Update or create team challenge
        if (teamChallenges && teamChallenges.length > 0) {
          await deleteTeamChallenge.mutateAsync({
            teamId: selectedTeamId,
            challengeId: teamChallenges[0].id,
          });
        }

        if (selectedQuestIds.length > 0) {
          await createTeamChallenge.mutateAsync({
            teamId: selectedTeamId,
            data: {
              name: `Objectifs communs - ${teamName}`,
              points: 100,
              bonus_multiplier: 1.5,
              quest_ids: selectedQuestIds,
            },
          });
        }
      } else {
        // Create new team
        const newTeam = await createTeam.mutateAsync({ name: teamName });
        teamId = newTeam.id;

        // Add members
        for (const userId of selectedUserIds) {
          await addMember.mutateAsync({ teamId: newTeam.id, userId });
        }

        // Create team challenge if quests are selected
        if (selectedQuestIds.length > 0) {
          await createTeamChallenge.mutateAsync({
            teamId: newTeam.id,
            data: {
              name: `Objectifs communs - ${teamName}`,
              points: 100,
              bonus_multiplier: 1.5,
              quest_ids: selectedQuestIds,
            },
          });
        }

        setSelectedTeamId(newTeam.id);
      }

      setActiveTab('team');
      Alert.alert('Succès', 'Équipe enregistrée avec succès');
    } catch (error) {
      console.error('Error saving team:', error);
      Alert.alert('Erreur', 'Erreur lors de la sauvegarde de l\'équipe');
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeamId) return;

    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer votre équipe ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTeam.mutateAsync(selectedTeamId);
              setSelectedTeamId(null);
              setTeamName('');
              setSelectedUserIds([]);
              setActiveTab('team');
              Alert.alert('Succès', 'Équipe supprimée avec succès');
            } catch (error) {
              console.error('Error deleting team:', error);
              Alert.alert('Erreur', 'Erreur lors de la suppression de l\'équipe');
            }
          },
        },
      ]
    );
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleQuestSelection = (questId: string) => {
    setSelectedQuestIds((prev) =>
      prev.includes(questId) ? prev.filter((id) => id !== questId) : [...prev, questId]
    );
  };

  if (teamsLoading || usersLoading || questsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={QuestifyColors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

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
          <Text style={styles.title}>Compétition 🏆</Text>
          <Text style={styles.subtitle}>Progressez ensemble et motivez-vous mutuellement</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'team' && styles.tabActive]}
            onPress={() => setActiveTab('team')}>
            <Text style={[styles.tabText, activeTab === 'team' && styles.tabTextActive]}>
              Mon équipe
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'manage' && styles.tabActive]}
            onPress={() => setActiveTab('manage')}>
            <Text style={[styles.tabText, activeTab === 'manage' && styles.tabTextActive]}>
              Gérer l'équipe
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'team' ? (
          <>
            {hasTeam && currentTeam ? (
              <>
                {/* Team Card */}
                <Card style={styles.teamCard}>
                  <Text style={styles.teamName}>{currentTeam.name}</Text>

                  <View style={styles.teamMembers}>
                    {teamMembers &&
                      teamMembers.map((member: any, index: number) => (
                        <View key={member.id} style={styles.memberContainer}>
                          {index > 0 && <Text style={styles.handshake}>🤝</Text>}
                          <View style={styles.memberItem}>
                            {isAvatarImage(member.avatar_url) ? (
                              <Image
                                source={{ uri: getAvatarUrl(member.avatar_url) }}
                                style={styles.memberAvatarImage}
                              />
                            ) : (
                              <View style={styles.memberAvatar}>
                                <Text style={styles.memberAvatarText}>
                                  {member.avatar_url || member.name.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                            <Text style={styles.memberName}>{member.name}</Text>
                          </View>
                        </View>
                      ))}
                  </View>

                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{teamMembers?.length || 0}</Text>
                      <Text style={styles.statLabel}>Membres</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>0</Text>
                      <Text style={styles.statLabel}>Objectifs partagés</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>0</Text>
                      <Text style={styles.statLabel}>Points bonus</Text>
                    </View>
                  </View>
                </Card>

                <Text style={styles.sectionTitle}>Objectifs partagés</Text>

                <Card style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>🎯</Text>
                  <Text style={styles.emptyTitle}>Bientôt disponible</Text>
                  <Text style={styles.emptyText}>
                    Les objectifs partagés seront disponibles prochainement
                  </Text>
                </Card>
              </>
            ) : (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>Aucune équipe</Text>
                <Text style={styles.emptyText}>
                  Créez votre équipe pour commencer à progresser ensemble
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setActiveTab('manage')}>
                  <Text style={styles.primaryButtonText}>Créer mon équipe</Text>
                </TouchableOpacity>
              </Card>
            )}
          </>
        ) : (
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>
              {hasTeam ? 'Modifier mon équipe' : 'Créer mon équipe'}
            </Text>

            {/* Team Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom de l'équipe</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Team Wellness Warriors"
                placeholderTextColor={QuestifyColors.textSecondary}
                value={teamName}
                onChangeText={setTeamName}
              />
            </View>

            {/* Members Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Membres de l'équipe</Text>
              <ScrollView style={styles.selectionList} nestedScrollEnabled>
                {availableUsers &&
                  availableUsers.map((otherUser: any) => (
                    <TouchableOpacity
                      key={otherUser.id}
                      style={[
                        styles.selectionItem,
                        selectedUserIds.includes(otherUser.id) && styles.selectionItemSelected,
                      ]}
                      onPress={() => toggleUserSelection(otherUser.id)}>
                      {isAvatarImage(otherUser.avatar_url) ? (
                        <Image
                          source={{ uri: getAvatarUrl(otherUser.avatar_url) }}
                          style={styles.userAvatarImage}
                        />
                      ) : (
                        <View style={styles.userAvatar}>
                          <Text style={styles.userAvatarText}>
                            {otherUser.avatar_url || otherUser.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{otherUser.name}</Text>
                        <Text style={styles.userEmail}>{otherUser.email}</Text>
                      </View>
                      {selectedUserIds.includes(otherUser.id) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
              </ScrollView>
              <Text style={styles.helperText}>
                {selectedUserIds.length} membre(s) sélectionné(s)
              </Text>
            </View>

            {/* Quests Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Objectifs communs (optionnel)</Text>
              <ScrollView style={styles.selectionList} nestedScrollEnabled>
                {quests &&
                  quests
                    .filter((q: any) => q.is_active)
                    .map((quest: any) => (
                      <TouchableOpacity
                        key={quest.id}
                        style={[
                          styles.selectionItem,
                          selectedQuestIds.includes(quest.id) && styles.questItemSelected,
                        ]}
                        onPress={() => toggleQuestSelection(quest.id)}>
                        <View style={styles.questInfo}>
                          <Text style={styles.questTitle}>{quest.title}</Text>
                          <Text style={styles.questDetails}>
                            {quest.category_name} • {quest.points} points
                          </Text>
                        </View>
                        {selectedQuestIds.includes(quest.id) && (
                          <Text style={styles.checkmarkGreen}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
              </ScrollView>
              <Text style={styles.helperText}>
                {selectedQuestIds.length} objectif(s) sélectionné(s)
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!teamName ||
                    selectedUserIds.length === 0 ||
                    createTeam.isPending ||
                    updateTeam.isPending) &&
                    styles.buttonDisabled,
                ]}
                onPress={handleSaveTeam}
                disabled={
                  !teamName ||
                  selectedUserIds.length === 0 ||
                  createTeam.isPending ||
                  updateTeam.isPending
                }>
                <Text style={styles.primaryButtonText}>
                  {createTeam.isPending || updateTeam.isPending
                    ? 'Enregistrement...'
                    : hasTeam
                    ? 'Enregistrer les modifications'
                    : "Créer l'équipe"}
                </Text>
              </TouchableOpacity>
              {hasTeam && (
                <TouchableOpacity
                  style={[styles.dangerButton, deleteTeam.isPending && styles.buttonDisabled]}
                  onPress={handleDeleteTeam}
                  disabled={deleteTeam.isPending}>
                  <Text style={styles.dangerButtonText}>
                    {deleteTeam.isPending ? 'Suppression...' : "Supprimer l'équipe"}
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
  teamCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'linear-gradient(135deg, #C8B7E8 0%, #A996D3 100%)',
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  teamMembers: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  memberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  handshake: {
    fontSize: 24,
  },
  memberItem: {
    alignItems: 'center',
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  memberAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  memberAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: QuestifyColors.background,
  },
  memberName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: QuestifyColors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  emptyCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: QuestifyColors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  formCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: QuestifyColors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: QuestifyColors.textPrimary,
    backgroundColor: QuestifyColors.background,
  },
  selectionList: {
    maxHeight: 200,
    borderWidth: 2,
    borderColor: QuestifyColors.border,
    borderRadius: 12,
    padding: 8,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: QuestifyColors.backgroundDark,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectionItemSelected: {
    backgroundColor: '#E8DFFA',
    borderColor: QuestifyColors.primary,
  },
  questItemSelected: {
    backgroundColor: '#E0F5E8',
    borderColor: '#C8EAD3',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: QuestifyColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: QuestifyColors.background,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: QuestifyColors.textSecondary,
  },
  checkmark: {
    fontSize: 18,
    color: QuestifyColors.primary,
  },
  checkmarkGreen: {
    fontSize: 18,
    color: '#5BA073',
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
    marginBottom: 4,
  },
  questDetails: {
    fontSize: 12,
    color: QuestifyColors.textSecondary,
  },
  helperText: {
    fontSize: 12,
    color: QuestifyColors.textSecondary,
    marginTop: 8,
  },
  actions: {
    gap: 12,
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: QuestifyColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: QuestifyColors.background,
  },
  dangerButton: {
    backgroundColor: '#FFE8E0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D87A5E',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
