import React, { useState } from 'react';
import { useCreateReward } from '@core/hooks/useApi';

interface CreateRewardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EMOJI_OPTIONS = [
    '☕', '🎬', '📚', '💅', '💆', '👗', '🏨', '🎮',
    '🍕', '🍰', '🎧', '🎨', '🏃', '🧘', '🎵', '📱',
    '💻', '🎁', '🌟', '💎', '🏆', '🎯', '🌸', '🎪'
];

export function CreateRewardModal({ isOpen, onClose }: CreateRewardModalProps) {
    const createReward = useCreateReward();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        cost: 100,
        svg_icon: '🎁'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            alert('Veuillez entrer un titre');
            return;
        }

        if (formData.cost <= 0) {
            alert('Le coût doit être supérieur à 0');
            return;
        }

        createReward.mutate(
            {
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                cost: formData.cost,
                svg_icon: formData.svg_icon || '🎁'
            },
            {
                onSuccess: () => {
                    // Reset form
                    setFormData({
                        title: '',
                        description: '',
                        cost: 100,
                        svg_icon: '🎁'
                    });
                    onClose();
                },
                onError: (error) => {
                    console.error('Failed to create reward:', error);
                    alert('Erreur lors de la création de la récompense');
                }
            }
        );
    };

    const handleClose = () => {
        if (!createReward.isPending) {
            setFormData({
                title: '',
                description: '',
                cost: 100,
                svg_icon: '🎁'
            });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={handleClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }}
        >
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    maxWidth: '500px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)'
                }}
            >
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    marginBottom: '24px',
                    color: '#1A1A1A'
                }}>
                    Nouvelle récompense
                </h2>

                <form onSubmit={handleSubmit}>
                    {/* Emoji Selector */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 600,
                            marginBottom: '8px',
                            color: '#1A1A1A'
                        }}>
                            Emoji
                        </label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(8, 1fr)',
                            gap: '8px',
                            marginBottom: '12px'
                        }}>
                            {EMOJI_OPTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, svg_icon: emoji })}
                                    style={{
                                        padding: '8px',
                                        fontSize: '24px',
                                        border: formData.svg_icon === emoji ? '2px solid #C8B7E8' : '2px solid #E0E0E0',
                                        borderRadius: '8px',
                                        backgroundColor: formData.svg_icon === emoji ? '#F5F2FA' : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (formData.svg_icon !== emoji) {
                                            e.currentTarget.style.backgroundColor = '#F5F5F5';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (formData.svg_icon !== emoji) {
                                            e.currentTarget.style.backgroundColor = 'white';
                                        }
                                    }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={formData.svg_icon}
                            onChange={(e) => setFormData({ ...formData, svg_icon: e.target.value })}
                            placeholder="Ou saisissez un emoji"
                            maxLength={2}
                            style={{
                                width: '100%',
                                padding: '10px 16px',
                                fontSize: '20px',
                                textAlign: 'center',
                                border: '2px solid #E0E0E0',
                                borderRadius: '8px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Title Input */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 600,
                            marginBottom: '8px',
                            color: '#1A1A1A'
                        }}>
                            Titre *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Café Starbucks"
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                fontSize: '16px',
                                border: '2px solid #E0E0E0',
                                borderRadius: '8px',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#C8B7E8';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#E0E0E0';
                            }}
                        />
                    </div>

                    {/* Description Input */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 600,
                            marginBottom: '8px',
                            color: '#1A1A1A'
                        }}>
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Décrivez votre récompense..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                fontSize: '14px',
                                border: '2px solid #E0E0E0',
                                borderRadius: '8px',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#C8B7E8';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#E0E0E0';
                            }}
                        />
                    </div>

                    {/* Cost Input */}
                    <div style={{ marginBottom: '28px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 600,
                            marginBottom: '8px',
                            color: '#1A1A1A'
                        }}>
                            Coût (points) *
                        </label>
                        <input
                            type="number"
                            value={formData.cost}
                            onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                            min="1"
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                fontSize: '16px',
                                border: '2px solid #E0E0E0',
                                borderRadius: '8px',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#C8B7E8';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#E0E0E0';
                            }}
                        />
                        <div style={{
                            marginTop: '8px',
                            fontSize: '12px',
                            color: '#6B6B6B'
                        }}>
                            💚 0-300 pts : Petits plaisirs | 💙 301-600 pts : Moyens plaisirs<br/>
                            💜 601-1000 pts : Grands plaisirs | 🧡 1000+ pts : Gros plaisirs
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end'
                    }}>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={createReward.isPending}
                            style={{
                                padding: '12px 24px',
                                fontSize: '16px',
                                fontWeight: 600,
                                border: '2px solid #E0E0E0',
                                borderRadius: '8px',
                                backgroundColor: 'white',
                                color: '#6B6B6B',
                                cursor: createReward.isPending ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (!createReward.isPending) {
                                    e.currentTarget.style.backgroundColor = '#F5F5F5';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                            }}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={createReward.isPending || !formData.title.trim()}
                            style={{
                                padding: '12px 32px',
                                fontSize: '16px',
                                fontWeight: 600,
                                border: 'none',
                                borderRadius: '8px',
                                backgroundColor: (!formData.title.trim() || createReward.isPending) ? '#E0E0E0' : '#C8B7E8',
                                color: (!formData.title.trim() || createReward.isPending) ? '#A0A0A0' : '#1A1A1A',
                                cursor: (!formData.title.trim() || createReward.isPending) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (formData.title.trim() && !createReward.isPending) {
                                    e.currentTarget.style.backgroundColor = '#B8A7D8';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (formData.title.trim() && !createReward.isPending) {
                                    e.currentTarget.style.backgroundColor = '#C8B7E8';
                                }
                            }}
                        >
                            {createReward.isPending ? 'Création...' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
