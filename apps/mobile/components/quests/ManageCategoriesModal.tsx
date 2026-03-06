import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Modal } from '@/mobile/components/ui/Modal';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/core/hooks/useApi';
import { Category } from '@/core/types/api';
import { QuestifyColors } from '@/mobile/constants/colors';

const PRESET_EMOJIS = [
  '🏃', '💪', '🎯', '📚', '🍎', '💼', '🎨', '🎵',
  '💻', '🏠', '💰', '🌿', '😊', '🎉', '💤', '🧹',
  '🚴', '🏊', '⚽', '🎮', '✍️', '🧘', '📱', '🛁',
];

interface ManageCategoriesModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ManageCategoriesModal({ visible, onClose }: ManageCategoriesModalProps) {
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

  const resetForm = () => {
    setFormData({
      name: '',
      svg_icon: '',
      color: '#C8B7E8',
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreateSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom de la catégorie est requis');
      return;
    }

    createCategory.mutate(
      {
        name: formData.name,
        svg_icon: formData.svg_icon || null,
        color: formData.color || null,
        is_default: false,
      },
      {
        onSuccess: () => {
          Alert.alert('Succès', 'Catégorie créée avec succès !');
          resetForm();
        },
        onError: (error: any) => {
          Alert.alert('Erreur', error.message || 'Erreur lors de la création');
        },
      }
    );
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

  const handleUpdateSubmit = async () => {
    if (!editingId || !formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom de la catégorie est requis');
      return;
    }

    updateCategory.mutate(
      {
        id: editingId,
        data: {
          name: formData.name,
          svg_icon: formData.svg_icon || null,
          color: formData.color || null,
        },
      },
      {
        onSuccess: () => {
          Alert.alert('Succès', 'Catégorie modifiée avec succès !');
          resetForm();
        },
        onError: (error: any) => {
          Alert.alert('Erreur', error.message || 'Erreur lors de la modification');
        },
      }
    );
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Supprimer la catégorie',
      `Êtes-vous sûr de vouloir supprimer "${name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteCategory.mutate(id, {
              onSuccess: () => {
                Alert.alert('Succès', 'Catégorie supprimée');
              },
              onError: (error: any) => {
                Alert.alert('Erreur', error.message || 'Erreur lors de la suppression');
              },
            });
          },
        },
      ]
    );
  };

  const renderCategoryItem = (category: Category) => {
    const isEditing = editingId === category.id;

    if (isEditing) {
      return (
        <View key={category.id} style={[styles.categoryItem, styles.editingItem]}>
          <View style={styles.editForm}>
            <TextInput
              style={styles.emojiInput}
              value={formData.svg_icon}
              onChangeText={(text) => setFormData({ ...formData, svg_icon: text })}
              placeholder="📁"
              maxLength={2}
            />
            <TextInput
              style={styles.nameInput}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Nom"
            />
            <View style={[styles.colorPreview, { backgroundColor: formData.color }]} />
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleUpdateSubmit}
              disabled={updateCategory.isPending}>
              {updateCategory.isPending ? (
                <ActivityIndicator size="small" color={QuestifyColors.textPrimary} />
              ) : (
                <Text style={styles.actionButtonText}>✓</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={resetForm}>
              <Text style={styles.actionButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View key={category.id} style={styles.categoryItem}>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryEmoji}>{category.svg_icon || '📁'}</Text>
          <View style={styles.categoryDetails}>
            <Text style={styles.categoryName}>{category.name}</Text>
          </View>
          <View style={[styles.colorDot, { backgroundColor: category.color || '#E0E0E0' }]} />
        </View>
        {!category.is_default ? (
          <View style={styles.categoryActions}>
            <TouchableOpacity
              style={[styles.smallButton, styles.editButton]}
              onPress={() => handleEditClick(category)}>
              <Text style={styles.smallButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallButton, styles.deleteButton]}
              onPress={() => handleDelete(category.id, category.name)}
              disabled={deleteCategory.isPending}>
              <Text style={styles.smallButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Défaut</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Gestion des catégories">
      <View style={styles.container}>
        {/* Categories List */}
        <View style={styles.categoriesList}>
          {categories?.map(renderCategoryItem)}
        </View>

        {/* Create Form */}
        {isCreating ? (
          <View style={styles.createForm}>
            <Text style={styles.formTitle}>Nouvelle catégorie</Text>

            {/* Emoji Grid */}
            <View style={styles.emojiGrid}>
              {PRESET_EMOJIS.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.emojiButton,
                    formData.svg_icon === emoji && styles.emojiButtonSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, svg_icon: emoji })}
                  activeOpacity={0.7}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formRow}>
              <TextInput
                style={styles.emojiInput}
                value={formData.svg_icon}
                onChangeText={(text) => setFormData({ ...formData, svg_icon: text })}
                placeholder="📁"
                maxLength={2}
              />
              <TextInput
                style={styles.nameInput}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Nom de la catégorie"
              />
              <View style={[styles.colorPreview, { backgroundColor: formData.color }]} />
            </View>
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelFormButton]}
                onPress={resetForm}>
                <Text style={styles.formButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.createFormButton]}
                onPress={handleCreateSubmit}
                disabled={createCategory.isPending}>
                {createCategory.isPending ? (
                  <ActivityIndicator size="small" color={QuestifyColors.textPrimary} />
                ) : (
                  <Text style={styles.formButtonText}>Créer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsCreating(true)}
            activeOpacity={0.7}>
            <Text style={styles.addButtonText}>+ Nouvelle catégorie</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  categoriesList: {
    gap: 12,
  },
  categoryItem: {
    backgroundColor: QuestifyColors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: QuestifyColors.border,
  },
  editingItem: {
    borderColor: QuestifyColors.primary,
    borderWidth: 2,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: QuestifyColors.primary,
  },
  deleteButton: {
    backgroundColor: QuestifyColors.error,
  },
  smallButtonText: {
    fontSize: 14,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: QuestifyColors.backgroundDark,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: QuestifyColors.textSecondary,
  },
  editForm: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  emojiInput: {
    width: 50,
    height: 40,
    fontSize: 20,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: QuestifyColors.border,
    borderRadius: 6,
    backgroundColor: QuestifyColors.background,
  },
  nameInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: QuestifyColors.border,
    borderRadius: 6,
    fontSize: 14,
    backgroundColor: QuestifyColors.background,
    color: QuestifyColors.textPrimary,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: QuestifyColors.border,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: QuestifyColors.green,
  },
  cancelButton: {
    backgroundColor: QuestifyColors.error,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createForm: {
    gap: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFormButton: {
    backgroundColor: QuestifyColors.backgroundDark,
  },
  createFormButton: {
    backgroundColor: QuestifyColors.primary,
  },
  formButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: QuestifyColors.primary,
    backgroundColor: QuestifyColors.background,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.primary,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: QuestifyColors.border,
    backgroundColor: QuestifyColors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonSelected: {
    borderColor: QuestifyColors.primary,
    backgroundColor: QuestifyColors.primaryLight,
  },
  emojiText: {
    fontSize: 24,
  },
});
