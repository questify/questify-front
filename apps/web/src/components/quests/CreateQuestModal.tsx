import React, { useState } from 'react';
import { useCategories, useFrequencies, useCreateQuest } from '@core/hooks/useApi';

interface CreateQuestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PRESET_EMOJIS = [
    '🏃', '💪', '🧘', '🚴', '🏋️', '🏊', '⚽', '🎯',
    '📚', '✍️', '🎨', '🎵', '💻', '🧑‍💻', '📱', '🎮',
    '🍎', '🥗', '💧', '🥦', '🍊', '🥛', '🌿', '🍵',
    '😊', '🎉', '💤', '🧹', '🛁', '👨‍👩‍👧', '💰', '📊',
];

export function CreateQuestModal({ isOpen, onClose }: CreateQuestModalProps) {
    const { data: categories } = useCategories();
    const { data: frequencies } = useFrequencies();
    const createQuest = useCreateQuest();

    const [formData, setFormData] = useState({
        svg_icon: '',
        title: '',
        description: '',
        category_id: '',
        frequency: '' as 'daily' | 'weekly' | 'monthly' | '',
        is_private: false,
        points: 0,
        malus: 0,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.category_id || !formData.frequency) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        try {
            await createQuest.mutateAsync({
                title: formData.title,
                description: formData.description || null,
                category_id: formData.category_id,
                is_active: true,
                is_private: formData.is_private,
                frequency: formData.frequency as 'daily' | 'weekly' | 'monthly',
                points: formData.points,
                malus: formData.malus || 0,
                svg_icon: formData.svg_icon || null,
            });

            // Reset form and close modal
            setFormData({
                svg_icon: '',
                title: '',
                description: '',
                category_id: '',
                frequency: '',
                is_private: false,
                points: 0,
                malus: 0,
            });
            onClose();
        } catch (error) {
            console.error('Failed to create quest:', error);
            alert('Erreur lors de la création de la quête');
        }
    };

    if (!isOpen) return null;

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
                <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 700 }}>Nouvelle quête</h2>

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
                            placeholder="Ex: Aller courir 30 minutes en 10 minutes de marche"
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value || ''})}
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
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    frequency: e.target.value as 'daily' | 'weekly' | 'monthly',
                                })
                            }
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

                    {/* Publication */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                            Niveau de visibilité *
                        </label>
                        <select
                            value={formData.is_private as unknown as string}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    is_private: e.target.value as unknown as true | false,
                                })
                            }
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #E5E5E5',
                                borderRadius: '10px',
                                fontSize: '14px',
                            }}
                        >
                            <option value="">Sélectionner un niveau de visibilité</option>

                                <option key='publique' value={'true'}>Publique</option>
                                <option key='privé' value={'true'}>Privée</option>
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
                        <small style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '4px', display: 'block' }}>
                            Points retirés si l'objectif n'est pas complété
                        </small>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button
                            type="button"
                            className="btn btn-outline"
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
                            className="btn btn-primary"
                            disabled={createQuest.isPending}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#C8B7E8',
                                color: '#1A1A1A',
                                fontWeight: 600,
                                cursor: createQuest.isPending ? 'not-allowed' : 'pointer',
                                opacity: createQuest.isPending ? 0.6 : 1,
                            }}
                        >
                            {createQuest.isPending ? 'Création...' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
