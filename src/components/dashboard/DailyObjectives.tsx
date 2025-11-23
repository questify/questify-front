import React, { useState } from 'react';

interface Validation {
    type: 'success' | 'failure';
}

interface Quest {
    title: string;
    description?: string;
    category?: string;
    difficulty?: string;
    points?: number;
    icon?: string;
}

interface Objective {
    id?: number;
    quest?: Quest;
    description?: string;
    validations_today?: Validation[];
    target_count?: number;
    current_count?: number;
}

interface DailyObjectivesProps {
    objectives?: Objective[];
    isLoading?: boolean;
}

export function DailyObjectives({ objectives = [], isLoading = false }: DailyObjectivesProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const getObjectiveStatus = (objective: Objective) => {
        const hasSuccessToday = objective.validations_today?.some(v => v.type === 'success');
        const hasFailureToday = objective.validations_today?.some(v => v.type === 'failure');

        if (hasSuccessToday) return 'success';
        if (hasFailureToday) return 'failure';
        return 'pending';
    };

    const getCategoryColor = (category?: string) => {
        const colors: Record<string, string> = {
            'sport': '#C8EAD3',
            'nutrition': '#FFE4C8',
            'sleep': '#D1E4FF',
            'mindfulness': '#E8D4F8',
        };
        return colors[category?.toLowerCase() || ''] || '#E0E0E0';
    };

    const getDifficultyColor = (difficulty?: string) => {
        const colors: Record<string, string> = {
            'facile': '#C8EAD3',
            'moyen': '#FFE4C8',
            'difficile': '#FFD1C1',
        };
        return colors[difficulty?.toLowerCase() || ''] || '#E0E0E0';
    };

    const handleIncrement = (objectiveId?: number) => {
        console.log('Increment objective:', objectiveId);
        // TODO: Implement API call to increment
    };

    const handleValidate = (objectiveId?: number) => {
        console.log('Validate objective:', objectiveId);
        // TODO: Implement API call to validate
    };

    const handleFail = (objectiveId?: number) => {
        console.log('Fail objective:', objectiveId);
        // TODO: Implement API call to mark as failed
    };

    return (
        <div className="card">
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: isExpanded ? '20px' : '0',
                    cursor: 'pointer'
                }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 style={{ margin: 0 }}>Mes objectifs du jour</h3>
                <span style={{ fontSize: '20px', transition: 'transform 0.3s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                </span>
            </div>
            {isExpanded && (
                <div>
                    {isLoading ? (
                        <p style={{ color: '#6B6B6B', textAlign: 'center' }}>Chargement...</p>
                    ) : objectives.length === 0 ? (
                        <p style={{ color: '#6B6B6B', textAlign: 'center' }}>Aucun objectif pour aujourd'hui</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {objectives.map((objective, index) => {
                                const status = getObjectiveStatus(objective);
                                const currentCount = objective.current_count || 0;
                                const targetCount = objective.target_count || 1;
                                const points = objective.quest?.points || 10;

                                return (
                                    <div
                                        key={objective.id || index}
                                        className="objective-card"
                                        style={{
                                            padding: '20px',
                                            borderRadius: '12px',
                                            backgroundColor: 'white',
                                            border: '1px solid #E0E0E0',
                                        }}
                                    >
                                        <div className="objective-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '24px' }}>{objective.quest?.icon || '🎯'}</span>
                                                    <div
                                                        className="badge"
                                                        style={{
                                                            padding: '4px 12px',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            backgroundColor: getCategoryColor(objective.quest?.category),
                                                            color: '#1A1A1A',
                                                        }}
                                                    >
                                                        {objective.quest?.category || 'Général'}
                                                    </div>
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: '16px', marginTop: '8px' }}>
                                                    {objective.quest?.title || 'Objectif'}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#6B6B6B', marginTop: '4px' }}>
                                                    <strong style={{ color: '#C8B7E8' }}>{currentCount}/{targetCount}</strong> complétées
                                                </div>
                                            </div>
                                            <div
                                                className="badge"
                                                style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    backgroundColor: getDifficultyColor(objective.quest?.difficulty),
                                                    color: '#1A1A1A',
                                                }}
                                            >
                                                {objective.quest?.difficulty || 'Moyen'}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleIncrement(objective.id)}
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '8px',
                                                        border: '2px solid #C8B7E8',
                                                        background: 'white',
                                                        color: '#C8B7E8',
                                                        fontSize: '20px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    +
                                                </button>
                                                <span style={{ fontSize: '13px', color: '#6B6B6B' }}>
                                                    <span style={{ fontWeight: 700, color: '#F2B8A3' }}>+{points} pts</span>
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleValidate(objective.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        backgroundColor: '#C8EAD3',
                                                        color: '#1A1A1A',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    ✓ Valider
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={() => handleFail(objective.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: '#FFD1C1',
                                                        color: '#D87A5E',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    ✗ Raté
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
