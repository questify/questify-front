import {useState, useEffect} from 'react';
import {Quest} from '@core/types/api'
import {
    useCreateValidation,
    useCreateOrUpdateDailyMood,
    useCreateOrUpdatePositiveThings,
    useDailyMoodHistory,
    usePositiveThingsHistory,
    useQuests
}  from '@core/hooks/useApi';
import {useAuth} from '@core/contexts/AuthContext';
import {ConfirmValidationModal} from '../quests/ConfirmValidationModal';

interface DailyQuestsProps {
    quests?: Quest[];
    isLoading?: boolean;
}

type Mood = 'amazing' | 'good' | 'okay' | 'bad' | 'terrible' | null;

// Mapping between mood text and numeric values
const moodToValue: Record<NonNullable<Mood>, number> = {
    'amazing': 5,
    'good': 4,
    'okay': 3,
    'bad': 2,
    'terrible': 1,
};

const valueToMood: Record<number, NonNullable<Mood>> = {
    5: 'amazing',
    4: 'good',
    3: 'okay',
    2: 'bad',
    1: 'terrible',
};

export function DailyQuests({ isLoading = false }: DailyQuestsProps) {
    const { user, updateUser } = useAuth();
    const quests = useQuests().data;
    const today = new Date().toISOString().split('T')[0];
    // Hooks for validations
    const createValidation = useCreateValidation();

    // Hooks for wellness
    const { data: existingMood } = useDailyMoodHistory(1);
    const createOrUpdateMood = useCreateOrUpdateDailyMood();
    const { data: existingPositiveThings } = usePositiveThingsHistory(1);
    const createOrUpdatePositiveThings = useCreateOrUpdatePositiveThings();

    const [selectedMood, setSelectedMood] = useState<Mood>(null);
    const [positiveThings, setPositiveThings] = useState(['', '', '']);
    const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean; questId: string | null; points: number }>({
        isOpen: false,
        questId: null,
        points: 0,
    });

    // Load existing data when available
    useEffect(() => {
        if (existingMood && existingMood[0]?.mood_value) {
            setSelectedMood(valueToMood[existingMood[0].mood_value] || null);
        }
    }, [existingMood]);

    useEffect(() => {
        if (existingPositiveThings) {
            setPositiveThings([
                existingPositiveThings[0]?.thing_1 || '',
                existingPositiveThings[0]?.thing_2 || '',
                existingPositiveThings[0]?.thing_3 || '',
            ]);
        }
    }, [existingPositiveThings]);

    const openConfirmationModal = (questId: string, points: number) => {
        setConfirmationModal({
            isOpen: true,
            questId,
            points,
        });
    };

    const closeConfirmationModal = () => {
        setConfirmationModal({
            isOpen: false,
            questId: null,
            points: 0,
        });
    };

    const confirmValidation = async () => {
        const { questId, points } = confirmationModal;
        if (!questId || !user?.id) {
            console.error('Missing quest ID or user ID');
            return;
        }
        createValidation.mutate(
            {
                quest_id: questId,
                user_id: user.id,
                date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
                type: 'completion',
                points_earned: points || 0,
            },
            {
                onSuccess: async (data) => {
                    // Close modal on success
                    closeConfirmationModal();

                    // Update user data after successful validation
                    if (data?.user) {
                        // If API returns updated user data
                        updateUser(data.user);
                    } else {
                        // Otherwise, fetch updated user data
                        try {
                            const { api } = await import('@core/services/api');
                            const updatedUser = await api.users.getMe();
                            updateUser(updatedUser);
                        } catch (error) {
                            console.error('Failed to fetch updated user:', error);
                        }
                    }
                },
            }
        );
    };

    const handleMoodSelect = (mood: Mood) => {
        setSelectedMood(mood);
        if (mood) {
            createOrUpdateMood.mutate({
                date: today,
                mood_value: moodToValue[mood]
            });
        }
    };

    const handlePositiveThingChange = (index: number, value: string) => {
        const newPositiveThings = [...positiveThings];
        newPositiveThings[index] = value;
        setPositiveThings(newPositiveThings);
    };

    const handleSavePositiveThings = () => {
        createOrUpdatePositiveThings.mutate({
            date: today,
            thing_1: positiveThings[0] || null,
            thing_2: positiveThings[1] || null,
            thing_3: positiveThings[2] || null,
        });
    };

    return (
        <div>
            {/* Mood Card */}
        <div className="card" style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>Comment te sens-tu aujourd'hui ? 😊</h3>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '20px' }}>
                <button
                    onClick={() => handleMoodSelect('amazing')}
                    style={{
                        fontSize: '40px',
                        background: selectedMood === 'amazing' ? '#C8EAD3' : 'none',
                        border: `2px solid ${selectedMood === 'amazing' ? '#C8EAD3' : '#E5E5E5'}`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    😍
                </button>
                <button
                    onClick={() => handleMoodSelect('good')}
                    style={{
                        fontSize: '40px',
                        background: selectedMood === 'good' ? '#C8EAD3' : 'none',
                        border: `2px solid ${selectedMood === 'good' ? '#C8EAD3' : '#E5E5E5'}`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    😊
                </button>
                <button
                    onClick={() => handleMoodSelect('okay')}
                    style={{
                        fontSize: '40px',
                        background: selectedMood === 'okay' ? '#FFE4C8' : 'none',
                        border: `2px solid ${selectedMood === 'okay' ? '#FFE4C8' : '#E5E5E5'}`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    😐
                </button>
                <button
                    onClick={() => handleMoodSelect('bad')}
                    style={{
                        fontSize: '40px',
                        background: selectedMood === 'bad' ? '#FFD1C1' : 'none',
                        border: `2px solid ${selectedMood === 'bad' ? '#FFD1C1' : '#E5E5E5'}`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    😔
                </button>
                <button
                    onClick={() => handleMoodSelect('terrible')}
                    style={{
                        fontSize: '40px',
                        background: selectedMood === 'terrible' ? '#FFD1C1' : 'none',
                        border: `2px solid ${selectedMood === 'terrible' ? '#FFD1C1' : '#E5E5E5'}`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    😢
                </button>
            </div>
        </div>

        {/* Positive Things Card */}
        <div className="card" style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>3 choses positives du jour ✨</h3>
            <div style={{ marginBottom: '12px' }}>
                <input
                    type="text"
                    placeholder="1. Quelque chose de positif..."
                    value={positiveThings[0]}
                    onChange={(e) => handlePositiveThingChange(0, e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #E5E5E5',
                        borderRadius: '10px',
                        marginBottom: '8px',
                        fontSize: '14px',
                    }}
                />
                <input
                    type="text"
                    placeholder="2. Quelque chose de positif..."
                    value={positiveThings[1]}
                    onChange={(e) => handlePositiveThingChange(1, e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #E5E5E5',
                        borderRadius: '10px',
                        marginBottom: '8px',
                        fontSize: '14px',
                    }}
                />
                <input
                    type="text"
                    placeholder="3. Quelque chose de positif..."
                    value={positiveThings[2]}
                    onChange={(e) => handlePositiveThingChange(2, e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #E5E5E5',
                        borderRadius: '10px',
                        fontSize: '14px',
                    }}
                />
            </div>
            <button
                className="btn btn-primary"
                onClick={handleSavePositiveThings}
                style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#C8B7E8',
                    color: '#1A1A1A',
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                💾 Sauvegarder
            </button>
        </div>

        <div className="card">
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        cursor: 'pointer'
                    }}
                >
                    <h3 style={{ margin: 0 }}>Mes quêtes du jour</h3>
                </div>
                <div>
                    {isLoading ? (
                        <p style={{ color: '#6B6B6B', textAlign: 'center' }}>Chargement...</p>
                    ) : quests?.length === 0 ? (
                        <p style={{ color: '#6B6B6B', textAlign: 'center' }}>Aucune quête pour aujourd'hui</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {quests?.map((quest, index) => {
                                const points = quest.points;

                                return (
                                    <div
                                        key={quest.id || index}
                                        className="quest-card"
                                        style={{
                                            padding: '20px',
                                            borderRadius: '12px',
                                            backgroundColor: 'white',
                                            border: '1px solid #E0E0E0',
                                        }}
                                    >
                                        <div className="quest-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '24px' }}>{quest.svg_icon || '🎯'}</span>
                                                    <div
                                                        className="badge"
                                                        style={{
                                                            padding: '4px 12px',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            backgroundColor: quest.category_color,
                                                            color: '#1A1A1A',
                                                        }}
                                                    >
                                                        {quest.category_name || 'Général'}
                                                    </div>
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: '16px', marginTop: '8px' }}>
                                                    {quest.title || 'Objectif'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '13px', color: '#6B6B6B' }}>
                                                    <span style={{ fontWeight: 700, color: '#F2B8A3' }}>+{points} pts</span>
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => openConfirmationModal(quest.id, quest.points)}
                                                    disabled={createValidation.isPending}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        backgroundColor: '#C8EAD3',
                                                        color: '#1A1A1A',
                                                        fontWeight: 600,
                                                        cursor: createValidation.isPending ? 'not-allowed' : 'pointer',
                                                        opacity: createValidation.isPending ? 0.6 : 1,
                                                    }}
                                                >
                                                    ✓ Valider
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmValidationModal
                isOpen={confirmationModal.isOpen}
                points={confirmationModal.points}
                isPending={createValidation.isPending}
                onConfirm={confirmValidation}
                onCancel={closeConfirmationModal}
            />
        </div>
    );
}
