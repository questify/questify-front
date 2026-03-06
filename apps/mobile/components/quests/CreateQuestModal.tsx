import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Modal } from '@/mobile/components/ui/Modal';
import { QuestifyColors } from '@/mobile/constants/colors';
import { useCategories, useFrequencies, useCreateQuest } from '@/core/hooks/useApi';

const PRESET_EMOJIS = [
  '🏃', '💪', '🧘', '🚴', '🏋️', '🏊', '⚽', '🎯',
  '📚', '✍️', '🎨', '🎵', '💻', '🧑‍💻', '📱', '🎮',
  '🍎', '🥗', '💧', '🥦', '🍊', '🥛', '🌿', '🍵',
  '😊', '🎉', '💤', '🧹', '🛁', '👨‍👩‍👧', '💰', '📊',
];

interface CreateQuestModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateQuestModal({ visible, onClose, onSuccess }: CreateQuestModalProps) {
  const { data: categories } = useCategories();
  const { data: frequencies } = useFrequencies();
  const createQuest = useCreateQuest();

  const [svgIcon, setSvgIcon] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequencyName, setFrequencyName] = useState('');
  const [points, setPoints] = useState('10');
  const [malus, setMalus] = useState('0');

  const handleSubmit = async () => {
    if (!title || !categoryId || !frequencyName) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    createQuest.mutate(
      {
        title,
        description,
        category_id: categoryId,
        frequency: frequencyName,
        points: parseInt(points) || 10,
        malus: parseInt(malus) || 0,
        is_active: true,
        svg_icon: svgIcon || null,
      },
      {
        onSuccess: () => {
          Alert.alert('Succès', 'Quête créée avec succès !');
          resetForm();
          onSuccess();
          onClose();
        },
        onError: (error: any) => {
          Alert.alert('Erreur', error.message || 'Erreur lors de la création');
        },
      }
    );
  };

  const resetForm = () => {
    setSvgIcon('');
    setTitle('');
    setDescription('');
    setCategoryId('');
    setFrequencyName('');
    setPoints('10');
    setMalus('0');
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Nouvelle quête">
      <View style={styles.form}>
        {/* Emoji Selector */}
        <View style={styles.field}>
          <Text style={styles.label}>Emoji de la quête</Text>
          <View style={styles.emojiGrid}>
            {PRESET_EMOJIS.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.emojiButton,
                  svgIcon === emoji && styles.emojiButtonSelected,
                ]}
                onPress={() => setSvgIcon(emoji)}
                activeOpacity={0.7}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={svgIcon}
            onChangeText={setSvgIcon}
            placeholder="Ou entre un autre emoji..."
            placeholderTextColor={QuestifyColors.textLight}
            maxLength={2}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Nom de la quête"
            placeholderTextColor={QuestifyColors.textLight}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description (optionnel)"
            placeholderTextColor={QuestifyColors.textLight}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Catégorie *</Text>
          <View style={styles.chipContainer}>
            {categories?.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.chip,
                  categoryId === cat.id && styles.chipSelected,
                ]}
                onPress={() => setCategoryId(cat.id)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.chipText,
                    categoryId === cat.id && styles.chipTextSelected,
                  ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Fréquence *</Text>
          <View style={styles.chipContainer}>
            {frequencies?.map((freq) => (
              <TouchableOpacity
                key={freq.id}
                style={[
                  styles.chip,
                  frequencyName === freq.name && styles.chipSelected,
                ]}
                onPress={() => setFrequencyName(freq.name)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.chipText,
                    frequencyName === freq.name && styles.chipTextSelected,
                  ]}>
                  {freq.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.halfField]}>
            <Text style={styles.label}>Points</Text>
            <TextInput
              style={styles.input}
              value={points}
              onChangeText={setPoints}
              placeholder="10"
              placeholderTextColor={QuestifyColors.textLight}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.field, styles.halfField]}>
            <Text style={styles.label}>Malus</Text>
            <TextInput
              style={styles.input}
              value={malus}
              onChangeText={setMalus}
              placeholder="0"
              placeholderTextColor={QuestifyColors.textLight}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, createQuest.isPending && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={createQuest.isPending}
          activeOpacity={0.7}>
          {createQuest.isPending ? (
            <ActivityIndicator color={QuestifyColors.textPrimary} />
          ) : (
            <Text style={styles.submitButtonText}>Créer la quête</Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
  },
  input: {
    backgroundColor: QuestifyColors.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: QuestifyColors.textPrimary,
    borderWidth: 1,
    borderColor: QuestifyColors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: QuestifyColors.backgroundLight,
    borderWidth: 1,
    borderColor: QuestifyColors.border,
  },
  chipSelected: {
    backgroundColor: QuestifyColors.primary,
    borderColor: QuestifyColors.primary,
  },
  chipText: {
    fontSize: 14,
    color: QuestifyColors.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: QuestifyColors.textPrimary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: QuestifyColors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 52,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
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
