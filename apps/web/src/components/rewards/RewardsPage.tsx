import React, { useState } from 'react';
import { useRewards, usePurchaseReward } from '@core/hooks/useApi';
import { useAuth } from '@core/contexts/AuthContext';
import { CreateRewardModal } from './CreateRewardModal';
import { RewardCard } from './RewardCard';
import { Reward } from '@core/types/api';

type RewardTier = 'small' | 'medium' | 'large' | 'xlarge';
type TabType = 'badges' | 'gifts';

export function RewardsPage() {
    const { data: rewards } = useRewards();
    const { user, updateUser } = useAuth();
    const purchaseReward = usePurchaseReward();

    const [activeTab, setActiveTab] = useState<TabType>('gifts');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Calculate user points (default to 0 if not available)
    const userPoints = user?.total_points || 0;

    // Group rewards by tier based on cost
    const groupRewardsByTier = (rewardsList: Reward[] | undefined) => {
        if (!rewardsList) return { small: [], medium: [], large: [], xlarge: [] };

        return rewardsList.reduce((acc, reward) => {
            if (reward.cost <= 300) {
                acc.small.push(reward);
            } else if (reward.cost <= 600) {
                acc.medium.push(reward);
            } else if (reward.cost <= 1000) {
                acc.large.push(reward);
            } else {
                acc.xlarge.push(reward);
            }
            return acc;
        }, { small: [] as Reward[], medium: [] as Reward[], large: [] as Reward[], xlarge: [] as Reward[] });
    };

    const groupedRewards = groupRewardsByTier(rewards);

    const handlePurchase = async (rewardId: string, cost: number) => {
        if (!user?.id) {
            alert('Vous devez être connecté pour acheter une récompense');
            return;
        }

        if (userPoints < cost) {
            alert('Pas assez de points !');
            return;
        }

        if (!confirm(`Voulez-vous vraiment acheter cette récompense pour ${cost} points ?`)) {
            return;
        }

        purchaseReward.mutate(rewardId, {
            onSuccess: async (data) => {
                // Update user points
                if (data?.user) {
                    updateUser(data.user);
                } else {
                    // Fallback: fetch updated user data
                    try {
                        const { api } = await import('@core/services/api');
                        const updatedUser = await api.users.getMe();
                        updateUser(updatedUser);
                    } catch (error) {
                        console.error('Failed to fetch updated user:', error);
                    }
                }
                alert('Récompense achetée avec succès ! 🎉');
            },
            onError: (error) => {
                console.error('Failed to purchase reward:', error);
                alert('Erreur lors de l\'achat de la récompense');
            }
        });
    };

    const renderTierSection = (tier: RewardTier, title: string, color: string, emoji: string) => {
        const tierRewards = groupedRewards[tier];

        if (tierRewards.length === 0) return null;

        return (
            <div key={tier}>
                <h4 style={{
                    margin: '30px 0 16px 0',
                    color,
                    fontSize: '16px',
                    fontWeight: 600
                }}>
                    {emoji} {title}
                </h4>
                <div className="rewards-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '20px'
                }}>
                    {tierRewards.map((reward) => (
                        <RewardCard
                            key={reward.id}
                            reward={reward}
                            userPoints={userPoints}
                            isPurchasing={purchaseReward.isPending}
                            onPurchase={handlePurchase}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div id="rewards" className="page active">
            {/* Header */}
            <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Récompenses 🎁</h1>
            <p style={{ color: '#6B6B6B', marginBottom: '30px' }}>Débloquer des badges et offre-toi des cadeaux</p>

            {/* Points Card */}
            <div className="stat-card" style={{
                marginBottom: '30px',
                padding: '30px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '40px' }}>⭐</div>
                    <div>
                        <h2 style={{ fontSize: '32px', marginBottom: '4px', fontWeight: 700 }}>
                            {userPoints.toLocaleString()}
                        </h2>
                        <p style={{ color: '#6B6B6B', margin: 0 }}>Points disponibles</p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="rewards-tabs" style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '30px',
                borderBottom: '2px solid #E0E0E0'
            }}>
                <div
                    className={`tab ${activeTab === 'badges' ? 'active' : ''}`}
                    onClick={() => setActiveTab('badges')}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        borderBottom: activeTab === 'badges' ? '3px solid #C8B7E8' : 'none',
                        color: activeTab === 'badges' ? '#1A1A1A' : '#6B6B6B',
                        transition: 'all 0.3s'
                    }}
                >
                    🏅 Badges
                </div>
                <div
                    className={`tab ${activeTab === 'gifts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('gifts')}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        borderBottom: activeTab === 'gifts' ? '3px solid #C8B7E8' : 'none',
                        color: activeTab === 'gifts' ? '#1A1A1A' : '#6B6B6B',
                        transition: 'all 0.3s'
                    }}
                >
                    🎁 Récompense
                </div>
            </div>

            {/* Badges Tab */}
            {activeTab === 'badges' && (
                <div id="badgesTab" className="rewards-tab-content">
                    <div className="card" style={{
                        background: 'linear-gradient(135deg, #F5F2FA 0%, #E8DFFA 100%)',
                        border: '2px solid #C8B7E8',
                        marginBottom: '30px',
                        padding: '24px',
                        borderRadius: '12px'
                    }}>
                        <div style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#8F72C4',
                            marginBottom: '8px'
                        }}>
                            🎯 PROCHAIN BADGE
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ fontSize: '48px' }}>🏆</div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '18px', marginBottom: '12px', fontWeight: 700 }}>
                                    Badge "Champion"
                                </h4>
                                <div className="progress-bar" style={{
                                    width: '100%',
                                    height: '8px',
                                    backgroundColor: '#E0E0E0',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div className="progress-fill lilas" style={{
                                        width: '82%',
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #C8B7E8 0%, #8F72C4 100%)',
                                        transition: 'width 0.3s'
                                    }}></div>
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#6B6B6B',
                                    marginTop: '8px'
                                }}>
                                    Plus que 180 points
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 700 }}>
                        Badges disponibles
                    </h3>
                    <div className="rewards-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '20px',
                        marginBottom: '40px'
                    }}>
                        {/* Static badge examples */}
                        <div className="reward-card" style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            textAlign: 'center',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}>
                            <div className="reward-icon" style={{ fontSize: '48px', marginBottom: '12px' }}>👑</div>
                            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Couronne Légendaire</div>
                            <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '12px' }}>
                                Niveau ultime
                            </p>
                            <div style={{
                                color: '#C8B7E8',
                                fontWeight: 700,
                                fontSize: '16px',
                                marginBottom: '12px'
                            }}>
                                500 pts
                            </div>
                            <button className="btn btn-primary" style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#C8B7E8',
                                color: '#1A1A1A',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}>
                                Débloquer
                            </button>
                        </div>

                        <div className="reward-card" style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            textAlign: 'center',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}>
                            <div className="reward-icon" style={{ fontSize: '48px', marginBottom: '12px' }}>🎨</div>
                            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Thème Aurora</div>
                            <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '12px' }}>
                                Interface colorée
                            </p>
                            <div style={{
                                color: '#C8B7E8',
                                fontWeight: 700,
                                fontSize: '16px',
                                marginBottom: '12px'
                            }}>
                                300 pts
                            </div>
                            <button className="btn btn-primary" style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#C8B7E8',
                                color: '#1A1A1A',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}>
                                Débloquer
                            </button>
                        </div>
                    </div>

                    <h3 style={{ margin: '40px 0 20px 0', fontSize: '18px', fontWeight: 700 }}>
                        Badges débloqués
                    </h3>
                    <div style={{
                        display: 'flex',
                        gap: '20px',
                        overflowX: 'auto',
                        paddingBottom: '10px'
                    }}>
                        <div style={{ textAlign: 'center', minWidth: '80px' }}>
                            <div style={{
                                width: '72px',
                                height: '72px',
                                background: 'linear-gradient(135deg, #F2B8A3 0%, #FFD93D 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '36px',
                                marginBottom: '8px'
                            }}>
                                🔥
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 600 }}>Série 15j</div>
                        </div>
                        <div style={{ textAlign: 'center', minWidth: '80px' }}>
                            <div style={{
                                width: '72px',
                                height: '72px',
                                background: 'linear-gradient(135deg, #79BEEE 0%, #C8B7E8 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '36px',
                                marginBottom: '8px'
                            }}>
                                💪
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 600 }}>Warrior</div>
                        </div>
                        <div style={{ textAlign: 'center', minWidth: '80px' }}>
                            <div style={{
                                width: '72px',
                                height: '72px',
                                background: 'linear-gradient(135deg, #C8EAD3 0%, #79BEEE 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '36px',
                                marginBottom: '8px'
                            }}>
                                🥗
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 600 }}>Healthy</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Gifts Tab */}
            {activeTab === 'gifts' && (
                <div id="giftsTab" className="rewards-tab-content">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px'
                    }}>
                        <h3 style={{ fontSize: '20px', margin: 0, fontWeight: 700 }}>
                            Mes récompenses personnalisés
                        </h3>
                        <button
                            className="btn btn-primary"
                            onClick={() => setIsCreateModalOpen(true)}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#C8B7E8',
                                color: '#1A1A1A',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            + Nouvelle récompense
                        </button>
                    </div>

                    {/* Render reward tiers */}
                    {renderTierSection('small', 'Petits plaisirs (0-300 pts)', '#C8EAD3', '💚')}
                    {renderTierSection('medium', 'Moyens plaisirs (300-600 pts)', '#79BEEE', '💙')}
                    {renderTierSection('large', 'Grands plaisirs (600-1000 pts)', '#C8B7E8', '💜')}
                    {renderTierSection('xlarge', 'Gros plaisirs (1000+ pts)', '#F2B8A3', '🧡')}

                    {/* Empty state */}
                    {rewards && rewards.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: '#6B6B6B'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎁</div>
                            <p>Aucune récompense pour le moment.</p>
                            <p>Créez votre première récompense pour commencer !</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create Reward Modal */}
            <CreateRewardModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
