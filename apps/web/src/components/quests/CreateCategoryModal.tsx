import React, { useState } from 'react';
import { useCreateCategory } from '@core/hooks/useApi';

interface CreateCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PRESET_CATEGORY_EMOJIS = [
    // Bien-être & sport
    '💪', '🏃', '🧘', '🎯', '🏆', '❤️', '🔥', '⚡',
    // Travail & apprentissage
    '📚', '✍️', '💻', '🎨', '🎓', '💼', '🧠', '📊',
    // Famille & social
    '👨‍👩‍👧', '🤝', '🌟', '🎉', '🎁', '👫', '🏠', '🌍',
    // Alimentation & nature
    '🍎', '🌿', '🥗', '💧', '🌱', '🌈', '☀️', '🌙',
    // Loisirs & voyages
    '🎮', '📱', '🚗', '✈️', '🎵', '🎭', '📷', '🎸',
    // Finance & organisation
    '💰', '🧩', '📝', '🔑', '🛡️', '💡', '⚙️', '📅',
];

export function CreateCategoryModal({ isOpen, onClose }: CreateCategoryModalProps) {
    const createCategory = useCreateCategory();

    const [formData, setFormData] = useState({
        name: '',
        svg_icon: PRESET_CATEGORY_EMOJIS[0], // Pré-sélectionner le premier emoji
        color: '#C8B7E8',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            alert('Veuillez remplir le nom de la catégorie');
            return;
        }

        try {
            await createCategory.mutateAsync({
                name: formData.name,
                svg_icon: formData.svg_icon || null,
                color: formData.color || null,
                is_default: false,
            });

            // Reset form and close modal
            setFormData({
                name: '',
                svg_icon: PRESET_CATEGORY_EMOJIS[0],
                color: '#C8B7E8',
            });
            onClose();
        } catch (error) {
            console.error('Failed to create category:', error);
            alert('Erreur lors de la création de la catégorie');
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
                <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 700 }}>Nouvelle catégorie</h2>

                <form onSubmit={handleSubmit}>
                    {/* Emoji */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                            Emoji de la catégorie
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', marginBottom: '12px' }}>
                            {PRESET_CATEGORY_EMOJIS.map((emoji, index) => (
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
                            Nom de la catégorie *
                        </label>
                        <input
                            type="text"
                            placeholder="Ex: Sport"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

                    {/* Couleur */}
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                            Couleur
                        </label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                style={{
                                    width: '60px',
                                    height: '40px',
                                    border: '2px solid #E5E5E5',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                }}
                            />
                            <input
                                type="text"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                placeholder="#C8B7E8"
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    border: '2px solid #E5E5E5',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                }}
                            />
                        </div>
                        <small style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '4px', display: 'block' }}>
                            Couleur d'affichage pour cette catégorie
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
                            disabled={createCategory.isPending}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#C8B7E8',
                                color: '#1A1A1A',
                                fontWeight: 600,
                                cursor: createCategory.isPending ? 'not-allowed' : 'pointer',
                                opacity: createCategory.isPending ? 0.6 : 1,
                            }}
                        >
                            {createCategory.isPending ? 'Création...' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
