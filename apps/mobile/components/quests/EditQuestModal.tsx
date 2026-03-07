import React, { useState, useEffect } from 'react';
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
import { useCategories, useFrequencies, useUpdateQuest } from '@/core/hooks/useApi';
import { Quest } from '@/core/types/api';

const PRESET_EMOJIS = [
  '🏃', '💪', '🧘', '🚴', '🏋️', '🏊', '⚽', '🎯',
  '📚', '✍️', '🎨', '🎵', '💻', '🧑‍💻', '📱', '🎮',
  '🍎', '🥗', '💧', '🥦', '🍊', '🥛', '🌿', '🍵',
  '😊', '🎉', '💤', '🧹', '🛁', '👨‍👩‍👧', '💰', '📊',
  '🌅', '🏆', '🧠', '❤️', '🌟', '🎓', '🔑', '🌙',
  '🦋', '🌈', '🎭', '🛡️', '🔥', '⚡', '🌊', '🍀',
];

interface EditQuestModalProps {
  visible: boolean;
  quest: Quest | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditQuestModal({ visible, quest, onClose, onSuccess }: EditQuestModalProps) {
  const { data: categories } = useCategories();
  const { data: frequencies } = useFrequencies();
  const updateQuest = useUpdateQuest();

  const [svgIcon, setSvgIcon] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequencyName, setFrequencyName] = useState('');
  const [points, setPoints] = useState('10');
  const [malus, setMalus] = useState('0');

  // Pre-fill form when quest changes
  useEffect(() => {
    if (quest) {
      setSvgIcon(quest.svg_icon || '');
      setTitle(quest.title || '');
      setDescription(quest.description || '');
      setCategoryId(quest.category_id || '');
      setFrequencyName(quest.frequency || '');
      setPoints(String(quest.points ?? 10));
      setMalus(String(quest.malus ?? 0));
    }
  }, [quest]);

  const handleSubmit = async () => {
    if (!title || !categoryId || !frequencyName) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!quest) return;

    updateQuest.mutate(
      {
        id: quest.id,
        data: {
          title,
          description,
          category_id: categoryId,
          frequency: frequencyName,
          points: parseInt(points) || 10,
          malus: parseInt(malus) || 0,
          svg_icon: svgIcon || null,
        },
      },
      {
        onSuccess: () => {
          Alert.alert('Succès', 'Quête modifiée avec succès !');
          onSuccess();
          onClose();
        },
        onError: (error: any) => {
          Alert.alert('Erreur', error.message || 'Erreur lors de la modification');
        },
      }
    );
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Modifier la quête">
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
          style={[styles.submitButton, updateQuest.isPending && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={updateQuest.isPending}
          activeOpacity={0.7}>
          {updateQuest.isPending ? (
            <ActivityIndicator color={QuestifyColors.textPrimary} />
          ) : (
            <Text style={styles.submitButtonText}>Enregistrer les modifications</Text>
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
