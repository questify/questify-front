import React, { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@core/hooks/useApi';
import { Category } from '@core/types/api';

interface ManageCategoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

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
            console.error('Failed to create category:', error);
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
            console.error('Failed to update category:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCategory.mutateAsync(id);
        } catch (error) {
            console.error('Failed to delete category:', error);
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
                                        style={{ display: 'flex', flex: 1, gap: '8px', alignItems: 'center' }}
                                    >
                                        <input
                                            type="text"
                                            placeholder="Emoji"
                                            maxLength={2}
                                            value={formData.svg_icon}
                                            onChange={(e) => setFormData({ ...formData, svg_icon: e.target.value })}
                                            style={{
                                                width: '50px',
                                                padding: '8px',
                                                fontSize: '20px',
                                                textAlign: 'center',
                                                border: '1px solid #E5E5E5',
                                                borderRadius: '6px',
                                            }}
                                        />
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
                                        <input
                                            type="color"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            style={{
                                                width: '40px',
                                                height: '36px',
                                                border: '1px solid #E5E5E5',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
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
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    placeholder="Emoji"
                                    maxLength={2}
                                    value={formData.svg_icon}
                                    onChange={(e) => setFormData({ ...formData, svg_icon: e.target.value })}
                                    style={{
                                        width: '60px',
                                        padding: '12px',
                                        fontSize: '24px',
                                        textAlign: 'center',
                                        border: '2px solid #E5E5E5',
                                        borderRadius: '8px',
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Nom de la catégorie"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        border: '2px solid #E5E5E5',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                    }}
                                />
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    style={{
                                        width: '50px',
                                        height: '46px',
                                        border: '2px solid #E5E5E5',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                    }}
                                />
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
