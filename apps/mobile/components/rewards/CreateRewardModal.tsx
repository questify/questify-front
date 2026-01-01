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
import { useCreateReward } from '@/core/hooks/useApi';

interface CreateRewardModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EMOJI_OPTIONS = [
  '🎁', '🏆', '🎮', '🎬', '🍕', '🍰', '☕', '🎧',
  '📱', '💎', '🌟', '⭐', '🎯', '🎨', '📚', '🎵',
  '🍔', '🍿', '🎪', '🎭', '🎤', '🎸', '🎹', '🎺',
];

export function CreateRewardModal({ visible, onClose, onSuccess }: CreateRewardModalProps) {
  const createReward = useCreateReward();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('100');
  const [emoji, setEmoji] = useState('🎁');
  const [isBadge, setIsBadge] = useState(false);

  const handleSubmit = async () => {
    if (!title || !cost) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    createReward.mutate(
      {
        title,
        description,
        cost: parseInt(cost) || 100,
        svg_icon: emoji,
        is_badge: isBadge,
      },
      {
        onSuccess: () => {
          Alert.alert('Succès', 'Récompense créée avec succès !');
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
    setTitle('');
    setDescription('');
    setCost('100');
    setEmoji('🎁');
    setIsBadge(false);
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Nouvelle récompense">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, !isBadge && styles.typeButtonActive]}
              onPress={() => setIsBadge(false)}
              activeOpacity={0.7}>
              <Text style={[styles.typeEmoji, !isBadge && styles.typeEmojiActive]}>🎁</Text>
              <Text style={[styles.typeText, !isBadge && styles.typeTextActive]}>Cadeau</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, isBadge && styles.typeButtonActive]}
              onPress={() => setIsBadge(true)}
              activeOpacity={0.7}>
              <Text style={[styles.typeEmoji, isBadge && styles.typeEmojiActive]}>🏅</Text>
              <Text style={[styles.typeText, isBadge && styles.typeTextActive]}>Badge</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Emoji *</Text>
          <View style={styles.emojiContainer}>
            {EMOJI_OPTIONS.map((em) => (
              <TouchableOpacity
                key={em}
                style={[
                  styles.emojiButton,
                  emoji === em && styles.emojiButtonSelected,
                ]}
                onPress={() => setEmoji(em)}
                activeOpacity={0.7}>
                <Text style={styles.emojiText}>{em}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Nom de la récompense"
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
          <Text style={styles.label}>Coût en points *</Text>
          <TextInput
            style={styles.input}
            value={cost}
            onChangeText={setCost}
            placeholder="100"
            placeholderTextColor={QuestifyColors.textLight}
            keyboardType="numeric"
          />
          <Text style={styles.hint}>
            {parseInt(cost) <= 300 ? '💚 Petit plaisir' :
             parseInt(cost) <= 600 ? '💙 Moyen plaisir' :
             parseInt(cost) <= 1000 ? '💜 Grand plaisir' :
             '🧡 Gros plaisir'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, createReward.isPending && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={createReward.isPending}
          activeOpacity={0.7}>
          {createReward.isPending ? (
            <ActivityIndicator color={QuestifyColors.textPrimary} />
          ) : (
            <Text style={styles.submitButtonText}>Créer la récompense</Text>
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
  hint: {
    fontSize: 12,
    color: QuestifyColors.textSecondary,
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: QuestifyColors.backgroundLight,
    borderWidth: 2,
    borderColor: QuestifyColors.border,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: QuestifyColors.primaryLight,
    borderColor: QuestifyColors.primary,
  },
  typeEmoji: {
    fontSize: 24,
  },
  typeEmojiActive: {
    fontSize: 24,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textSecondary,
  },
  typeTextActive: {
    color: QuestifyColors.textPrimary,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: QuestifyColors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiButtonSelected: {
    backgroundColor: QuestifyColors.primary,
    borderColor: QuestifyColors.primaryDark,
  },
  emojiText: {
    fontSize: 28,
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
});
