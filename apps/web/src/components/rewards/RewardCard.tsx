import React, { useState } from 'react';
import { Reward } from '@core/types/api';
import { useUpdateReward, useDeleteReward } from '@core/hooks/useApi';

interface RewardCardProps {
    reward: Reward;
    userPoints: number;
    isPurchasing: boolean;
    onPurchase: (rewardId: string, cost: number) => void;
}

export function RewardCard({ reward, userPoints, isPurchasing, onPurchase }: RewardCardProps) {
    const updateReward = useUpdateReward();
    const deleteReward = useDeleteReward();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: reward.title,
        description: reward.description || '',
        cost: reward.cost,
        svg_icon: reward.svg_icon || '🎁'
    });

    const canAfford = Number(userPoints) >= Number(reward.cost);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        updateReward.mutate(
            {
                id: reward.id,
                data: {
                    title: editData.title,
                    description: editData.description || null,
                    cost: editData.cost,
                    svg_icon: editData.svg_icon || null
                }
            },
            {
                onSuccess: () => {
                    setIsEditing(false);
                },
                onError: (error) => {
                    console.error('Failed to update reward:', error);
                    alert('Erreur lors de la mise à jour de la récompense');
                }
            }
        );
    };

    const handleCancelEdit = () => {
        setEditData({
            title: reward.title,
            description: reward.description || '',
            cost: reward.cost,
            svg_icon: reward.svg_icon || '🎁'
        });
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (!confirm(`Voulez-vous vraiment supprimer "${reward.title}" ?`)) {
            return;
        }
        deleteReward.mutate(reward.id, {
            onError: (error) => {
                console.error('Failed to delete reward:', error);
                alert('Erreur lors de la suppression de la récompense');
            }
        });
    };

    if (isEditing) {
        return (
            <div className="reward-card" style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                position: 'relative'
            }}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '4px',
                        color: '#6B6B6B'
                    }}>
                        Emoji
                    </label>
                    <input
                        type="text"
                        value={editData.svg_icon}
                        onChange={(e) => setEditData({ ...editData, svg_icon: e.target.value })}
                        maxLength={2}
                        style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: '24px',
                            textAlign: 'center',
                            border: '2px solid #E0E0E0',
                            borderRadius: '8px'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '4px',
                        color: '#6B6B6B'
                    }}>
                        Titre
                    </label>
                    <input
                        type="text"
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '14px',
                            border: '2px solid #E0E0E0',
                            borderRadius: '8px'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '4px',
                        color: '#6B6B6B'
                    }}>
                        Description
                    </label>
                    <textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        rows={2}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '12px',
                            border: '2px solid #E0E0E0',
                            borderRadius: '8px',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '4px',
                        color: '#6B6B6B'
                    }}>
                        Coût (points)
                    </label>
                    <input
                        type="number"
                        value={editData.cost}
                        onChange={(e) => setEditData({ ...editData, cost: parseInt(e.target.value) || 0 })}
                        min="0"
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '14px',
                            border: '2px solid #E0E0E0',
                            borderRadius: '8px'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleSaveEdit}
                        disabled={updateReward.isPending || !editData.title}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: !editData.title ? '#E0E0E0' : '#C8B7E8',
                            color: !editData.title ? '#A0A0A0' : '#1A1A1A',
                            fontWeight: 600,
                            cursor: !editData.title ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {updateReward.isPending ? 'Sauvegarde...' : '✓ Sauvegarder'}
                    </button>
                    <button
                        onClick={handleCancelEdit}
                        disabled={updateReward.isPending}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            border: '2px solid #E0E0E0',
                            backgroundColor: 'white',
                            color: '#6B6B6B',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        ✕ Annuler
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="reward-card" style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }}>
            {/* Action Buttons */}
            <div className="objective-actions" style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                display: 'flex',
                gap: '4px',
                opacity: 0.7,
                transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
            }}>
                <button
                    className="icon-btn"
                    onClick={handleEdit}
                    disabled={updateReward.isPending}
                    style={{
                        width: '28px',
                        height: '28px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#F5F5F5',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#E0E0E0';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#F5F5F5';
                    }}
                >
                    ✏️
                </button>
                <button
                    className="icon-btn"
                    onClick={handleDelete}
                    disabled={deleteReward.isPending}
                    style={{
                        width: '28px',
                        height: '28px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#F5F5F5',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFE0E0';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#F5F5F5';
                    }}
                >
                    🗑️
                </button>
            </div>

            {/* Reward Icon */}
            <div className="reward-icon" style={{
                fontSize: '48px',
                textAlign: 'center',
                marginBottom: '12px'
            }}>
                {reward.svg_icon || '🎁'}
            </div>

            {/* Reward Title */}
            <div style={{
                fontWeight: 700,
                marginBottom: '8px',
                textAlign: 'center',
                fontSize: '16px'
            }}>
                {reward.title}
            </div>

            {/* Reward Description */}
            {reward.description && (
                <p style={{
                    fontSize: '12px',
                    color: '#6B6B6B',
                    marginBottom: '12px',
                    textAlign: 'center',
                    minHeight: '32px'
                }}>
                    {reward.description}
                </p>
            )}

            {/* Reward Cost */}
            <div style={{
                color: canAfford ? '#C8B7E8' : '#999',
                fontWeight: 700,
                fontSize: '16px',
                marginBottom: '12px',
                textAlign: 'center'
            }}>
                {reward.cost} pts
            </div>

            {/* Purchase Button */}
            <button
                className="btn btn-secondary"
                onClick={() => onPurchase(reward.id, reward.cost)}
                disabled={!canAfford || isPurchasing}
                style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: !canAfford ? '#E0E0E0' : '#C8EAD3',
                    color: !canAfford ? '#A0A0A0' : '#1A1A1A',
                    fontWeight: 600,
                    cursor: !canAfford || isPurchasing ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    opacity: isPurchasing ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                    if (canAfford && !isPurchasing) {
                        e.currentTarget.style.backgroundColor = '#B8DAC3';
                    }
                }}
                onMouseLeave={(e) => {
                    if (canAfford && !isPurchasing) {
                        e.currentTarget.style.backgroundColor = '#C8EAD3';
                    }
                }}
            >
                {isPurchasing ? 'Achat...' : canAfford ? "M'offrir" : 'Pas assez de points'}
            </button>
        </div>
    );
}
