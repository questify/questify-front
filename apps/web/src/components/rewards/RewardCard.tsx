import React from 'react';
import { Reward } from '@core/types/api';

interface RewardCardProps {
    reward: Reward;
    userPoints: number;
    isPurchasing: boolean;
    onPurchase: (rewardId: string, cost: number) => void;
    onEdit: (reward: Reward) => void;
    onDelete: (reward: Reward) => void;
}

export function RewardCard({ reward, userPoints, isPurchasing, onPurchase, onEdit, onDelete }: RewardCardProps) {
    const canAfford = Number(userPoints) >= Number(reward.cost);

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
                    onClick={() => onEdit(reward)}
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
                    onClick={() => onDelete(reward)}
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
