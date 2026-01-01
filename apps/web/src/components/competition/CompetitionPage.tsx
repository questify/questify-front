import React, {useState, useEffect} from 'react';
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
} from '@core/hooks/useApi';
import { useAuth } from '@core/contexts/AuthContext';
import {getAvatarUrl, isAvatarImage} from '@core/utils/avatar';


export function CompetitionPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'team' | 'manage'>('team');
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [teamName, setTeamName] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedQuestIds, setSelectedQuestIds] = useState<string[]>([]);

    // Queries
    const { data: teams, isLoading: teamsLoading } = useTeams();
    const { data: teamMembers, isLoading: membersLoading } = useTeamMembers(selectedTeamId || '');
    const { data: allUsers, isLoading: usersLoading } = useUsers();
    const { data: quests, isLoading: questsLoading, refetch: refetchQuests } = useQuests();
    const { data: teamChallenges } = useTeamChallenges(selectedTeamId || '');

    // Force refetch on mount to bypass cache
    useEffect(() => {
        refetchQuests();
    }, []);

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
            // Get quest_ids from the first challenge (we'll use one challenge per team for now)
            const firstChallenge = teamChallenges[0];
            if (firstChallenge.quest_ids) {
                setSelectedQuestIds(firstChallenge.quest_ids);
            }
        }
    }, [teamChallenges]);

    const currentTeam = teams?.find((t: any) => t.id === selectedTeamId);
    const hasTeam = teams && teams.length > 0;

    const handleSaveTeam = async () => {
        if (!teamName) return;

        try {
            let teamId = selectedTeamId;

            if (selectedTeamId) {
                // Update existing team
                await updateTeam.mutateAsync({
                    id: selectedTeamId,
                    data: { name: teamName }
                });

                // Update members
                const currentMemberIds = teamMembers?.map((m: any) => m.id) || [];
                const toAdd = selectedUserIds.filter(id => !currentMemberIds.includes(id));
                const toRemove = currentMemberIds.filter((id: string) => !selectedUserIds.includes(id));

                for (const userId of toAdd) {
                    await addMember.mutateAsync({ teamId: selectedTeamId, userId });
                }

                for (const userId of toRemove) {
                    await removeMember.mutateAsync({ teamId: selectedTeamId, userId });
                }

                // Update or create team challenge
                if (teamChallenges && teamChallenges.length > 0) {
                    // Delete existing challenge and create a new one
                    await deleteTeamChallenge.mutateAsync({
                        teamId: selectedTeamId,
                        challengeId: teamChallenges[0].id
                    });
                }

                if (selectedQuestIds.length > 0) {
                    await createTeamChallenge.mutateAsync({
                        teamId: selectedTeamId,
                        data: {
                            name: `Objectifs communs - ${teamName}`,
                            points: 100,
                            bonus_multiplier: 1.5,
                            quest_ids: selectedQuestIds
                        }
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
                            quest_ids: selectedQuestIds
                        }
                    });
                }

                setSelectedTeamId(newTeam.id);
            }

            setActiveTab('team');
        } catch (error) {
            console.error('Error saving team:', error);
            alert('Erreur lors de la sauvegarde de l\'équipe');
        }
    };

    const handleDeleteTeam = async () => {
        if (!selectedTeamId) return;

        if (confirm('Êtes-vous sûr de vouloir supprimer votre équipe ?')) {
            try {
                await deleteTeam.mutateAsync(selectedTeamId);
                setSelectedTeamId(null);
                setTeamName('');
                setSelectedUserIds([]);
                setActiveTab('team');
            } catch (error) {
                console.error('Error deleting team:', error);
                alert('Erreur lors de la suppression de l\'équipe');
            }
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleQuestSelection = (questId: string) => {
        setSelectedQuestIds(prev =>
            prev.includes(questId)
                ? prev.filter(id => id !== questId)
                : [...prev, questId]
        );
    };

    if (teamsLoading || usersLoading || questsLoading) {
        return (
            <div id="competition" className="page active">
                <h1 style={{fontSize: '36px', marginBottom: '8px'}}>Compétition 🏆</h1>
                <p style={{color: '#6B6B6B', marginBottom: '40px'}}>Chargement...</p>
            </div>
        );
    }

    return (
        <div id="competition" className="page active">
            <h1 style={{fontSize: '36px', marginBottom: '8px'}}>Compétition 🏆</h1>
            <p style={{color: '#6B6B6B', marginBottom: '20px'}}>Progressez ensemble et motivez-vous mutuellement</p>

            {/* Tabs Navigation */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '30px',
                borderBottom: '2px solid #E0E0E0'
            }}>
                <button
                    onClick={() => setActiveTab('team')}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 600,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'team' ? '3px solid #C8B7E8' : 'none',
                        color: activeTab === 'team' ? '#1A1A1A' : '#6B6B6B',
                        transition: 'all 0.3s'
                    }}
                >
                    Mon équipe
                </button>
                <button
                    onClick={() => setActiveTab('manage')}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 600,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'manage' ? '3px solid #C8B7E8' : 'none',
                        color: activeTab === 'manage' ? '#1A1A1A' : '#6B6B6B',
                        transition: 'all 0.3s'
                    }}
                >
                    Gérer l'équipe
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'team' ? (
                <>
                    {hasTeam && currentTeam ? (
                        <>
                            <div className="team-card">
                                <h2 style={{fontSize: '28px', marginBottom: '24px'}}>{currentTeam.name}</h2>
                                <div className="team-members">
                                    {teamMembers && teamMembers.map((member: any, index: number) => (
                                        <React.Fragment key={member.id}>
                                            {index > 0 && <div style={{fontSize: '32px', display: 'flex', alignItems: 'center'}}>🤝</div>}
                                            <div>
                                                {isAvatarImage(member.avatar_url) ? (
                                                    <img
                                                        src={getAvatarUrl(member.avatar_url)}
                                                        alt={member.name}
                                                        className="member-avatar"
                                                        style={{
                                                            width: '64px',
                                                            height: '64px',
                                                            borderRadius: '50%',
                                                            objectFit: 'cover',
                                                            border: '4px solid rgba(255,255,255,0.3)',
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="member-avatar">
                                                        {member.avatar_url || member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div style={{marginTop: '8px', fontSize: '14px', fontWeight: 600}}>{member.name}</div>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>

                                <div style={{background: 'rgba(255,255,255,0.2)', padding: '24px', borderRadius: '16px', marginTop: '24px'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-around'}}>
                                        <div>
                                            <div style={{fontSize: '28px', fontWeight: 800, marginBottom: '4px'}}>
                                                {teamMembers?.length || 0}
                                            </div>
                                            <div style={{fontSize: '13px', opacity: 0.9}}>Membres</div>
                                        </div>
                                        <div>
                                            <div style={{fontSize: '28px', fontWeight: 800, marginBottom: '4px'}}>0</div>
                                            <div style={{fontSize: '13px', opacity: 0.9}}>Objectifs partagés</div>
                                        </div>
                                        <div>
                                            <div style={{fontSize: '28px', fontWeight: 800, marginBottom: '4px'}}>0</div>
                                            <div style={{fontSize: '13px', opacity: 0.9}}>Points bonus</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h3 style={{marginBottom: '20px', fontSize: '20px'}}>Objectifs partagés</h3>

                            <div className="card" style={{textAlign: 'center', padding: '60px 40px'}}>
                                <div style={{fontSize: '64px', marginBottom: '20px'}}>🎯</div>
                                <h3 style={{fontSize: '24px', marginBottom: '12px'}}>Bientôt disponible</h3>
                                <p style={{color: '#6B6B6B'}}>
                                    Les objectifs partagés seront disponibles prochainement
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="card" style={{textAlign: 'center', padding: '60px 40px'}}>
                            <div style={{fontSize: '64px', marginBottom: '20px'}}>👥</div>
                            <h3 style={{fontSize: '24px', marginBottom: '12px'}}>Aucune équipe</h3>
                            <p style={{color: '#6B6B6B', marginBottom: '24px'}}>
                                Créez votre équipe pour commencer à progresser ensemble
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={() => setActiveTab('manage')}
                            >
                                Créer mon équipe
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="card">
                    <h3 style={{fontSize: '24px', marginBottom: '24px'}}>
                        {hasTeam ? 'Modifier mon équipe' : 'Créer mon équipe'}
                    </h3>

                    <div className="form-group">
                        <label>Nom de l'équipe</label>
                        <input
                            type="text"
                            placeholder="Ex: Team Wellness Warriors"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Membres de l'équipe</label>
                        <div style={{
                            maxHeight: '300px',
                            overflowY: 'auto',
                            border: '2px solid #E5E5E5',
                            borderRadius: '12px',
                            padding: '12px'
                        }}>
                            {availableUsers && availableUsers.map((otherUser: any) => (
                                <div
                                    key={otherUser.id}
                                    onClick={() => toggleUserSelection(otherUser.id)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                        cursor: 'pointer',
                                        background: selectedUserIds.includes(otherUser.id) ? '#E8DFFA' : '#F5F5F5',
                                        border: selectedUserIds.includes(otherUser.id) ? '2px solid #C8B7E8' : '2px solid transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {isAvatarImage(otherUser.avatar_url) ? (
                                        <img
                                            src={getAvatarUrl(otherUser.avatar_url)}
                                            alt={otherUser.name}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #C8B7E8 0%, #A996D3 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: '16px'
                                        }}>
                                            {otherUser.avatar_url || otherUser.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div style={{flex: 1}}>
                                        <div style={{fontWeight: 600}}>{otherUser.name}</div>
                                        <div style={{fontSize: '12px', color: '#6B6B6B'}}>{otherUser.email}</div>
                                    </div>
                                    {selectedUserIds.includes(otherUser.id) && (
                                        <div style={{color: '#C8B7E8', fontSize: '20px'}}>✓</div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div style={{marginTop: '8px', fontSize: '12px', color: '#6B6B6B'}}>
                            {selectedUserIds.length} membre(s) sélectionné(s)
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Objectifs communs (optionnel)</label>
                        <div style={{
                            maxHeight: '250px',
                            overflowY: 'auto',
                            border: '2px solid #E5E5E5',
                            borderRadius: '12px',
                            padding: '12px'
                        }}>
                            {quests && quests.filter((q: any) => q.is_active).map((quest: any) => (
                                <div
                                    key={quest.id}
                                    onClick={() => toggleQuestSelection(quest.id)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                        cursor: 'pointer',
                                        background: selectedQuestIds.includes(quest.id) ? '#E0F5E8' : '#F5F5F5',
                                        border: selectedQuestIds.includes(quest.id) ? '2px solid #C8EAD3' : '2px solid transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{flex: 1}}>
                                        <div style={{fontWeight: 600}}>{quest.title}</div>
                                        <div style={{fontSize: '12px', color: '#6B6B6B'}}>
                                            {quest.category_name} • {quest.points} points
                                        </div>
                                    </div>
                                    {selectedQuestIds.includes(quest.id) && (
                                        <div style={{color: '#5BA073', fontSize: '20px'}}>✓</div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div style={{marginTop: '8px', fontSize: '12px', color: '#6B6B6B'}}>
                            {selectedQuestIds.length} objectif(s) sélectionné(s)
                        </div>
                    </div>

                    <div style={{display: 'flex', gap: '12px', marginTop: '30px'}}>
                        <button
                            className="btn btn-primary"
                            style={{flex: 1}}
                            onClick={handleSaveTeam}
                            disabled={!teamName || selectedUserIds.length === 0 || createTeam.isPending || updateTeam.isPending}
                        >
                            {createTeam.isPending || updateTeam.isPending
                                ? 'Enregistrement...'
                                : (hasTeam ? 'Enregistrer les modifications' : 'Créer l\'équipe')
                            }
                        </button>
                        {hasTeam && (
                            <button
                                className="btn"
                                style={{background: '#FFE8E0', color: '#D87A5E'}}
                                onClick={handleDeleteTeam}
                                disabled={deleteTeam.isPending}
                            >
                                {deleteTeam.isPending ? 'Suppression...' : 'Supprimer l\'équipe'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
