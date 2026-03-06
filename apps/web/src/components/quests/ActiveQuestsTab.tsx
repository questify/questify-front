import React, { useState } from 'react';
import { Quest, Category, Frequency } from '@core/types/api';
import { EditQuestModal } from './EditQuestModal';

interface ActiveQuestsTabProps {
    quests: Quest[];
    categories?: Category[];
    frequencies?: Frequency[];
    validatedQuests: Set<string>;
    onOpenConfirmationModal: (questId: string, points: number) => void;
    onToggleQuestActive: (questId: string, currentStatus: boolean) => void;
    isValidating: boolean;
    isUpdating: boolean;
}

export function ActiveQuestsTab({
    quests,
    categories,
    frequencies,
    validatedQuests,
    onOpenConfirmationModal,
    onToggleQuestActive,
    isValidating,
    isUpdating,
}: ActiveQuestsTabProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null);
    const [editingQuest, setEditingQuest] = useState<Quest | null>(null);

    // Filter quests based on category and frequency
    const filteredQuests = quests?.filter((quest) => {
        const categoryMatch = !selectedCategory || quest.category_name === selectedCategory;
        const frequencyMatch = !selectedFrequency || quest.frequency === selectedFrequency;
        return categoryMatch && frequencyMatch;
    });

    return (
        <>
            {/* Category Filter */}
            <h3 style={{ marginBottom: '16px', fontSize: '16px', color: '#6B6B6B' }}>Filtrer par catégorie</h3>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button
                    className={!selectedCategory ? 'btn btn-primary' : 'btn'}
                    onClick={() => setSelectedCategory(null)}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: !selectedCategory ? '#C8B7E8' : '#F0F0F0',
                        color: '#1A1A1A',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    Tous
                </button>
                {categories?.map((category) => (
                    <button
                        key={category.id}
                        className={selectedCategory === category.name ? 'btn btn-primary' : 'btn'}
                        onClick={() => setSelectedCategory(category.name)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: selectedCategory === category.name ? '#C8B7E8' : '#F0F0F0',
                            color: '#1A1A1A',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        {category.svg_icon} {category.name}
                    </button>
                ))}
            </div>

            {/* Frequency Filter */}
            <h3 style={{ marginBottom: '16px', fontSize: '16px', color: '#6B6B6B' }}>Filtrer par fréquence</h3>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <button
                    className={!selectedFrequency ? 'btn btn-primary' : 'btn'}
                    onClick={() => setSelectedFrequency(null)}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: !selectedFrequency ? '#C8B7E8' : '#F0F0F0',
                        color: '#1A1A1A',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    Tous
                </button>
                {frequencies?.map((frequency) => (
                    <button
                        key={frequency.id}
                        className={selectedFrequency === frequency.name ? 'btn btn-primary' : 'btn'}
                        onClick={() => setSelectedFrequency(frequency.name)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: selectedFrequency === frequency.name ? '#C8B7E8' : '#F0F0F0',
                            color: '#1A1A1A',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        {frequency.name}
                    </button>
                ))}
            </div>

            {/* Quests List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredQuests?.length === 0 ? (
                    <p style={{ color: '#6B6B6B', textAlign: 'center', padding: '40px' }}>
                        Aucune quête active trouvée. Crée ta première quête !
                    </p>
                ) : (
                    filteredQuests?.map((quest) => (
                        <div
                            key={quest.id}
                            className="card"
                            style={{
                                padding: '20px',
                                borderRadius: '12px',
                                backgroundColor: 'white',
                                border: '1px solid #E0E0E0',
                                borderLeft: validatedQuests.has(quest.id) ? '4px solid #C8EAD3' : '1px solid #E0E0E0',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '24px' }}>{quest.svg_icon || '🎯'}</span>
                                        <div
                                            className="badge"
                                            style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                backgroundColor: quest.category_color || '#F0F0F0',
                                                color: '#1A1A1A',
                                            }}
                                        >
                                            {quest.category_name || 'Général'}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
                                        {quest.title}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#6B6B6B', marginBottom: '12px' }}>
                                        {quest.description}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                        <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                                            <span style={{ color: '#6B6B6B' }}>
                                                <span style={{ fontWeight: 700, color: '#F2B8A3' }}>+{quest.points} pts</span>
                                            </span>
                                            {quest.malus > 0 && (
                                                <span style={{ color: '#6B6B6B' }}>
                                                    <span style={{ fontWeight: 700, color: '#FF6B6B' }}>-{quest.malus} pts malus</span>
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => setEditingQuest(quest)}
                                                style={{
                                                    padding: '12px 24px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    backgroundColor: '#F0F0F0',
                                                    color: '#1A1A1A',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                ✏️ Modifier
                                            </button>
                                            <button
                                                className="btn btn-primary objective-validate"
                                                onClick={() => onOpenConfirmationModal(quest.id, quest.points)}
                                                disabled={isValidating}
                                                style={{
                                                    padding: '12px 24px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    backgroundColor: validatedQuests.has(quest.id) ? '#C8EAD3' : '#C8B7E8',
                                                    color: validatedQuests.has(quest.id) ? '#5BA073' : '#1A1A1A',
                                                    fontWeight: 600,
                                                    cursor: isValidating ? 'not-allowed' : 'pointer',
                                                    opacity: isValidating ? 0.7 : 1,
                                                }}
                                            >
                                                ✓ Valider
                                            </button>
                                            <button
                                                onClick={() => onToggleQuestActive(quest.id, quest.is_active)}
                                                disabled={isUpdating}
                                                style={{
                                                    padding: '12px 24px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    backgroundColor: '#FFD1C1',
                                                    color: '#1A1A1A',
                                                    fontWeight: 600,
                                                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                                                    opacity: isUpdating ? 0.6 : 1,
                                                }}
                                            >
                                                📦 Archiver
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Quest Modal */}
            <EditQuestModal
                quest={editingQuest}
                isOpen={editingQuest !== null}
                onClose={() => setEditingQuest(null)}
            />
        </>
    );
}
