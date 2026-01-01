import React, { useState } from 'react';
import { useCategories, useFrequencies, useQuests, useCreateValidation, useUpdateQuest } from '@core/hooks/useApi';
import { useAuth } from '@core/contexts/AuthContext';
import { CreateQuestModal } from './CreateQuestModal';
import { CreateCategoryModal } from './CreateCategoryModal';
import { ManageCategoriesModal } from './ManageCategoriesModal';
import { ConfirmValidationModal } from './ConfirmValidationModal';
import { ActiveQuestsTab } from './ActiveQuestsTab';
import { ArchivedQuestsTab } from './ArchivedQuestsTab';

export function QuestsPage() {
    const { data: categories } = useCategories();
    const { data: frequencies } = useFrequencies();
    const { data: quests } = useQuests();
    const { user, updateUser } = useAuth();
    const createValidation = useCreateValidation();
    const updateQuest = useUpdateQuest();

    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false);
    const [validatedQuests, setValidatedQuests] = useState<Set<string>>(new Set());
    const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean; questId: string | null; points: number }>({
        isOpen: false,
        questId: null,
        points: 0,
    });

    // Filter quests based on active tab
    const activeQuests = quests?.filter((quest) => quest.is_active) || [];
    const archivedQuests = quests?.filter((quest) => !quest.is_active) || [];

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
                date: new Date().toISOString().split('T')[0],
                type: 'completion',
                points_earned: points || 0,
            },
            {
                onSuccess: async (data) => {
                    // Mark quest as validated locally
                    setValidatedQuests(prev => new Set(prev).add(questId));

                    // Update user data after successful validation
                    if (data?.user) {
                        updateUser(data.user);
                    } else {
                        try {
                            const { api } = await import('@core/services/api');
                            const updatedUser = await api.users.getMe();
                            updateUser(updatedUser);
                        } catch (error) {
                            console.error('Failed to fetch updated user:', error);
                        }
                    }

                    // Close confirmation modal
                    closeConfirmationModal();
                },
                onError: (error) => {
                    console.error('Failed to validate quest:', error);
                    alert('Erreur lors de la validation de la quête');
                    closeConfirmationModal();
                }
            }
        );
    };

    const toggleQuestActive = (questId: string, currentStatus: boolean) => {
        updateQuest.mutate(
            {
                id: questId,
                data: { is_active: !currentStatus }
            },
            {
                onError: (error) => {
                    console.error('Failed to update quest:', error);
                    alert('Erreur lors de la mise à jour de la quête');
                }
            }
        );
    };

    return (
        <div id="quests" className="page active">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Mes Quêtes 🎯</h1>
                    <p style={{ color: '#6B6B6B' }}>Gère et personnalise tes quêtes</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setIsManageCategoriesModalOpen(true)}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '8px',
                            border: '2px solid #C8B7E8',
                            backgroundColor: 'white',
                            color: '#C8B7E8',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        ⚙️ Gestion des catégories
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => setIsModalOpen(true)}
                        disabled={!categories || categories.length === 0}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: !categories || categories.length === 0 ? '#E0E0E0' : '#C8B7E8',
                            color: !categories || categories.length === 0 ? '#A0A0A0' : '#1A1A1A',
                            fontWeight: 600,
                            cursor: !categories || categories.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: !categories || categories.length === 0 ? 0.6 : 1,
                        }}
                        title={!categories || categories.length === 0 ? 'Créez d\'abord une catégorie' : ''}
                    >
                        + Nouvelle quête
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '30px',
                borderBottom: '2px solid #E0E0E0'
            }}>
                <button
                    onClick={() => setActiveTab('active')}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 600,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'active' ? '3px solid #C8B7E8' : 'none',
                        color: activeTab === 'active' ? '#1A1A1A' : '#6B6B6B',
                        transition: 'all 0.3s'
                    }}
                >
                    Quêtes actives
                </button>
                <button
                    onClick={() => setActiveTab('archived')}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 600,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'archived' ? '3px solid #C8B7E8' : 'none',
                        color: activeTab === 'archived' ? '#1A1A1A' : '#6B6B6B',
                        transition: 'all 0.3s'
                    }}
                >
                    Quêtes archivées
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'active' ? (
                <ActiveQuestsTab
                    quests={activeQuests}
                    categories={categories}
                    frequencies={frequencies}
                    validatedQuests={validatedQuests}
                    onOpenConfirmationModal={openConfirmationModal}
                    onToggleQuestActive={toggleQuestActive}
                    isValidating={createValidation.isPending}
                    isUpdating={updateQuest.isPending}
                />
            ) : (
                <ArchivedQuestsTab
                    quests={archivedQuests}
                    categories={categories}
                    frequencies={frequencies}
                    onToggleQuestActive={toggleQuestActive}
                    isUpdating={updateQuest.isPending}
                />
            )}

            {/* Confirmation Modal */}
            <ConfirmValidationModal
                isOpen={confirmationModal.isOpen}
                points={confirmationModal.points}
                isPending={createValidation.isPending}
                onConfirm={confirmValidation}
                onCancel={closeConfirmationModal}
            />

            {/* Create Quest Modal */}
            <CreateQuestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}/>

            {/* Create Category Modal */}
            <CreateCategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)}/>

            {/* Manage Categories Modal */}
            <ManageCategoriesModal isOpen={isManageCategoriesModalOpen} onClose={() => setIsManageCategoriesModalOpen(false)}/>
        </div>
    );
}
