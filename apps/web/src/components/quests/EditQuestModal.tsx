import React, { useState, useEffect } from 'react';
import { useCategories, useFrequencies, useUpdateQuest } from '@core/hooks/useApi';
import { Quest } from '@core/types/api';

interface EditQuestModalProps {
    quest: Quest | null;
    isOpen: boolean;
    onClose: () => void;
}

const PRESET_EMOJIS = [
    '🏃', '💪', '🧘', '🚴', '🏋️', '🏊', '⚽', '🎯',
    '📚', '✍️', '🎨', '🎵', '💻', '🧑‍💻', '📱', '🎮',
    '🍎', '🥗', '💧', '🥦', '🍊', '🥛', '🌿', '🍵',
    '😊', '🎉', '💤', '🧹', '🛁', '👨‍👩‍👧', '💰', '📊',
    '🌟', '🔥', '⚡', '🧠', '❤️', '🏆', '🎓', '✈️',
    '🌍', '🏠', '🚗', '🎭', '📷', '🧩', '🎸', '🥋',
];

export function EditQuestModal({ quest, isOpen, onClose }: EditQuestModalProps) {
    const { data: categories } = useCategories();
    const { data: frequencies } = useFrequencies();
    const updateQuest = useUpdateQuest();

    const [formData, setFormData] = useState({
        svg_icon: '',
        title: '',
        description: '',
        category_id: '',
        frequency: '',
        is_private: false,
        points: 0,
        malus: 0,
    });

    // Populate form when quest changes
    useEffect(() => {
        if (quest) {
            setFormData({
                svg_icon: quest.svg_icon || '',
                title: quest.title || '',
                description: quest.description || '',
                category_id: quest.category_id || '',
                frequency: quest.frequency || '',
                is_private: quest.is_private || false,
                points: quest.points || 0,
                malus: quest.malus || 0,
            });
        }
    }, [quest]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!quest || !formData.title || !formData.category_id || !formData.frequency) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        try {
            await updateQuest.mutateAsync({
                id: quest.id,
                data: {
                    title: formData.title,
                    description: formData.description || null,
                    category_id: formData.category_id,
                    is_private: formData.is_private,
                    frequency: formData.frequency,
                    points: formData.points,
                    malus: formData.malus || 0,
                    svg_icon: formData.svg_icon || null,
                },
            });
            onClose();
        } catch (error) {
            console.error('Failed to update quest:', error);
            alert('Erreur lors de la mise à jour de la quête');
        }
    };

    if (!isOpen || !quest) return null;

    return (
        <div
            className="modal-overlay"
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
            }}
            onClick={onClose}
        >
            <div
                className="modal"
                style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    maxWidth: '500px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 700 }}>Modifier la quête</h2>

                <form onSubmit={handleSubmit}>
                    {/* Emoji */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                            Emoji de la quête
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', marginBottom: '12px' }}>
                            {PRESET_EMOJIS.map((emoji, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, svg_icon: emoji })}
                                    style={{
                                        fontSize: '24px',
                                        padding: '8px',
                                        border: formData.svg_icon === emoji ? '2px solid #C8B7E8' : '2px solid #E5E5E5',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        backgroundColor: formData.svg_icon === emoji ? '#F5F0FF' : 'white',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Ou entre un autre emoji..."
                            maxLength={2}
                            value={formData.svg_icon}
                            onChange={(e) => setFormData({ ...formData, svg_icon: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '24px',
                                textAlign: 'center',
                                border: '2px solid #E5E5E5',
                                borderRadius: '10px',
                            }}
                        />
                    </div>

                    {/* Nom */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                            Nom de l'objectif *
                        </label>
                        <input
                            type="text"
                            placeholder="Ex: Course 30 min"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #E5E5E5',
                                borderRadius: '10px',
                                fontSize: '14px',
                            }}
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                            Description (optionnel)
                        </label>
                        <input
                            type="text"
                            placeholder="Ex: Aller courir 30 minutes..."
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value || '' })}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #E5E5E5',
                                borderRadius: '10px',
                                fontSize: '14px',
                            }}
                        />
                    </div>

                    {/* Catégorie */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                            Catégorie *
                        </label>
                        <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #E5E5E5',
                                borderRadius: '10px',
                                fontSize: '14px',
                            }}
                        >
                            <option value="">Sélectionner une catégorie</option>
                            {categories?.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.svg_icon} {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Fréquence */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                            Fréquence *
                        </label>
                        <select
                            value={formData.frequency}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #E5E5E5',
                                borderRadius: '10px',
                                fontSize: '14px',
                            }}
                        >
                            <option value="">Sélectionner une fréquence</option>
                            {frequencies?.map((frequency) => (
                                <option key={frequency.id} value={frequency.name}>
                                    {frequency.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Points */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                            Points gagnés *
                        </label>
                        <input
                            type="number"
                            placeholder="Ex: 50"
                            value={formData.points || ''}
                            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                            required
                            min="0"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #E5E5E5',
                                borderRadius: '10px',
                                fontSize: '14px',
                            }}
                        />
                    </div>

                    {/* Malus */}
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                            Malus si non complété (optionnel)
                        </label>
                        <input
                            type="number"
                            placeholder="Ex: 10"
                            value={formData.malus || ''}
                            onChange={(e) => setFormData({ ...formData, malus: parseInt(e.target.value) || 0 })}
                            min="0"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #E5E5E5',
                                borderRadius: '10px',
                                fontSize: '14px',
                            }}
                        />
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '8px',
                                border: '2px solid #E5E5E5',
                                backgroundColor: 'white',
                                color: '#1A1A1A',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={updateQuest.isPending}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#C8B7E8',
                                color: '#1A1A1A',
                                fontWeight: 600,
                                cursor: updateQuest.isPending ? 'not-allowed' : 'pointer',
                                opacity: updateQuest.isPending ? 0.6 : 1,
                            }}
                        >
                            {updateQuest.isPending ? 'Enregistrement...' : '💾 Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
