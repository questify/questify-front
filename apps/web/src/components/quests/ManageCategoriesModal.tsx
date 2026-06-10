import React, { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@core/hooks/useApi';
import { Category } from '@core/types/api';

interface ManageCategoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PRESET_COLORS = [
    '#C8B7E8', '#FFB7C5', '#B7D7FF', '#B7E8C5', '#FFD9A0', '#FFE8A0',
    '#FFB7B7', '#B7C5F0', '#A0E8E8', '#E8B7D4', '#D4E8A0', '#F0C5A0',
];

const PRESET_CATEGORY_EMOJIS = [
    '💪', '📚', '🎨', '🎵', '🍎', '💻', '🏃', '🧘',
    '🎯', '🌿', '💰', '🏠', '🎮', '✈️', '🤝', '🔥',
    '⭐', '🧹', '💤', '🎭', '🧩', '🌍', '📷', '🎓',
];

export function ManageCategoriesModal({ isOpen, onClose }: ManageCategoriesModalProps) {
    const { data: categories } = useCategories();
    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();

    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        svg_icon: '',
        color: '#C8B7E8',
    });

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            return;
        }

        try {
            await createCategory.mutateAsync({
                name: formData.name,
                svg_icon: formData.svg_icon || null,
                color: formData.color || null,
                is_default: false,
            });

            setFormData({
                name: '',
                svg_icon: '',
                color: '#C8B7E8',
            });
            setIsCreating(false);
        } catch (error) {
        }
    };

    const handleEditClick = (category: Category) => {
        setEditingId(category.id);
        setFormData({
            name: category.name,
            svg_icon: category.svg_icon || '',
            color: category.color || '#C8B7E8',
        });
        setIsCreating(false);
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingId || !formData.name) {
            return;
        }

        try {
            await updateCategory.mutateAsync({
                id: editingId,
                data: {
                    name: formData.name,
                    svg_icon: formData.svg_icon || null,
                    color: formData.color || null,
                },
            });

            setFormData({
                name: '',
                svg_icon: '',
                color: '#C8B7E8',
            });
            setEditingId(null);
        } catch (error) {
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Supprimer cette catégorie ?')) {
            return;
        }
        try {
            await deleteCategory.mutateAsync(id);
        } catch (error: any) {
            alert(error?.message || 'Erreur lors de la suppression de la catégorie');
        }
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingId(null);
        setFormData({
            name: '',
            svg_icon: '',
            color: '#C8B7E8',
        });
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
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 700 }}>
                    Gestion des catégories
                </h2>

                {/* List of categories */}
                <div style={{ marginBottom: '24px' }}>
                    {categories?.map((category) => (
                        <div
                            key={category.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                marginBottom: '12px',
                                backgroundColor: '#F9F9F9',
                                borderRadius: '8px',
                                border: editingId === category.id ? '2px solid #C8B7E8' : '1px solid #E0E0E0',
                            }}
                        >
                            {editingId === category.id ? (
                                <>
                                    <form
                                        onSubmit={handleUpdateSubmit}
                                        style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '8px' }}
                                    >
                                        {/* Row 1: name + save/cancel */}
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                placeholder="Nom"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 12px',
                                                    border: '1px solid #E5E5E5',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={updateCategory.isPending}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    backgroundColor: '#C8EAD3',
                                                    color: '#1A1A1A',
                                                    fontWeight: 600,
                                                    cursor: updateCategory.isPending ? 'not-allowed' : 'pointer',
                                                    opacity: updateCategory.isPending ? 0.6 : 1,
                                                }}
                                            >
                                                ✓
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    backgroundColor: '#FFD1C1',
                                                    color: '#1A1A1A',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        {/* Row 2: emoji input + quick-picks + colors */}
                                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <input
                                                type="text"
                                                placeholder="😊"
                                                maxLength={2}
                                                value={formData.svg_icon}
                                                onChange={(e) => setFormData({ ...formData, svg_icon: e.target.value })}
                                                style={{
                                                    width: '44px',
                                                    padding: '5px',
                                                    fontSize: '18px',
                                                    textAlign: 'center',
                                                    border: '1px solid #E5E5E5',
                                                    borderRadius: '6px',
                                                    flexShrink: 0,
                                                }}
                                            />
                                            {PRESET_CATEGORY_EMOJIS.slice(0, 12).map((emoji, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, svg_icon: emoji })}
                                                    style={{
                                                        fontSize: '17px',
                                                        padding: '4px',
                                                        border: formData.svg_icon === emoji ? '2px solid #C8B7E8' : '1px solid #E5E5E5',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        backgroundColor: formData.svg_icon === emoji ? '#F5F0FF' : 'white',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginLeft: 'auto' }}>
                                                {PRESET_COLORS.map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, color })}
                                                        style={{
                                                            width: '20px', height: '20px', borderRadius: '50%',
                                                            backgroundColor: color,
                                                            border: formData.color === color ? '2px solid #1A1A1A' : '1px solid #E5E5E5',
                                                            cursor: 'pointer', padding: 0, flexShrink: 0,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: '24px', width: '40px', textAlign: 'center' }}>
                                        {category.svg_icon || '📁'}
                                    </span>
                                    <div
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                        }}
                                    >
                                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{category.name}</span>
                                        <div
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                backgroundColor: category.color || '#E0E0E0',
                                            }}
                                        />
                                    </div>
                                    {!category.is_default && (
                                        <>
                                            <button
                                                onClick={() => handleEditClick(category)}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    backgroundColor: '#C8B7E8',
                                                    color: '#1A1A1A',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                }}
                                            >
                                                ✏️ Modifier
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                disabled={deleteCategory.isPending}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    backgroundColor: '#FFD1C1',
                                                    color: '#1A1A1A',
                                                    fontWeight: 600,
                                                    cursor: deleteCategory.isPending ? 'not-allowed' : 'pointer',
                                                    opacity: deleteCategory.isPending ? 0.6 : 1,
                                                    fontSize: '12px',
                                                }}
                                            >
                                                🗑️ Supprimer
                                            </button>
                                        </>
                                    )}
                                    {category.is_default && (
                                        <span
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                backgroundColor: '#E0E0E0',
                                                fontSize: '11px',
                                                color: '#6B6B6B',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Par défaut
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Create new category form */}
                {isCreating ? (
                    <form onSubmit={handleCreateSubmit} style={{ marginBottom: '24px' }}>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                                Nouvelle catégorie
                            </label>
                            {/* Name */}
                            <input
                                type="text"
                                placeholder="Nom de la catégorie"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #E5E5E5',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    marginBottom: '12px',
                                }}
                            />
                            {/* Emoji */}
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '6px', fontWeight: 500 }}>Emoji</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', marginBottom: '8px' }}>
                                    {PRESET_CATEGORY_EMOJIS.map((emoji, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, svg_icon: emoji })}
                                            style={{
                                                fontSize: '20px',
                                                padding: '6px',
                                                border: formData.svg_icon === emoji ? '2px solid #C8B7E8' : '2px solid #E5E5E5',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                backgroundColor: formData.svg_icon === emoji ? '#F5F0FF' : 'white',
                                                transition: 'all 0.15s',
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
                                        padding: '10px',
                                        fontSize: '20px',
                                        textAlign: 'center',
                                        border: '2px solid #E5E5E5',
                                        borderRadius: '8px',
                                    }}
                                />
                            </div>
                            {/* Color */}
                            <div style={{ marginTop: '10px' }}>
                                <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '8px', fontWeight: 500 }}>Couleur</div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {PRESET_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color })}
                                            style={{
                                                width: '28px', height: '28px', borderRadius: '50%',
                                                backgroundColor: color,
                                                border: formData.color === color ? '3px solid #1A1A1A' : '2px solid #E5E5E5',
                                                cursor: 'pointer', padding: 0,
                                                boxShadow: formData.color === color ? '0 0 0 2px white inset' : 'none',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={handleCancel}
                                style={{
                                    flex: 1,
                                    padding: '10px',
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
                                disabled={createCategory.isPending}
                                style={{
                                    flex: 1,
                                    padding: '10px',
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
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px dashed #C8B7E8',
                            backgroundColor: 'white',
                            color: '#C8B7E8',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginBottom: '24px',
                        }}
                    >
                        + Nouvelle catégorie
                    </button>
                )}

                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#E0E0E0',
                        color: '#1A1A1A',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    Fermer
                </button>
            </div>
        </div>
    );
}
