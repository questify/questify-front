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
import { useUpdateReward, useDeleteReward } from '@/core/hooks/useApi';
import { Reward } from '@/core/types/api';

const EMOJI_OPTIONS = [
  '🎁', '🏆', '🎮', '🎬', '🍕', '🍰', '☕', '🎧',
  '📱', '💎', '🌟', '⭐', '🎯', '🎨', '📚', '🎵',
  '🍔', '🍿', '🎪', '🎭', '🎤', '🎸', '🎹', '🎺',
];

interface EditRewardModalProps {
  visible: boolean;
  reward: Reward | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditRewardModal({ visible, reward, onClose, onSuccess }: EditRewardModalProps) {
  const updateReward = useUpdateReward();
  const deleteReward = useDeleteReward();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [emoji, setEmoji] = useState('🎁');

  useEffect(() => {
    if (reward) {
      setTitle(reward.title);
      setDescription(reward.description || '');
      setCost(String(reward.cost));
      setEmoji(reward.svg_icon || '🎁');
    }
  }, [reward]);

  const handleSubmit = async () => {
    if (!title || !cost) {
      Alert.alert('Erreur', 'Le titre et le coût sont obligatoires');
      return;
    }
    if (!reward) return;

    updateReward.mutate(
      {
        id: reward.id,
        data: {
          title,
          description: description || null,
          cost: parseInt(cost) || 100,
          svg_icon: emoji,
        },
      },
      {
        onSuccess: () => {
          Alert.alert('Succès', 'Récompense modifiée !');
          onSuccess();
          onClose();
        },
        onError: (error: any) => {
          Alert.alert('Erreur', error.message || 'Erreur lors de la modification');
        },
      }
    );
  };

  const handleDelete = () => {
    if (!reward) return;
    Alert.alert(
      '🗑️ Supprimer',
      `Supprimer "${reward.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteReward.mutate(reward.id, {
              onSuccess: () => {
                Alert.alert('Supprimé', 'Récompense supprimée.');
                onSuccess();
                onClose();
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

  return (
    <Modal visible={visible} onClose={onClose} title="Modifier la récompense">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Emoji *</Text>
          <View style={styles.emojiContainer}>
            {EMOJI_OPTIONS.map((em) => (
              <TouchableOpacity
                key={em}
                style={[styles.emojiButton, emoji === em && styles.emojiButtonSelected]}
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
          {cost !== '' && !isNaN(parseInt(cost)) && (
            <Text style={styles.hint}>
              {parseInt(cost) <= 300 ? '💚 Petit plaisir' :
               parseInt(cost) <= 600 ? '💙 Moyen plaisir' :
               parseInt(cost) <= 1000 ? '💜 Grand plaisir' :
               '🧡 Gros plaisir'}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleteReward.isPending}
            activeOpacity={0.7}>
            <Text style={styles.deleteButtonText}>🗑️ Supprimer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, updateReward.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={updateReward.isPending}
            activeOpacity={0.7}>
            {updateReward.isPending ? (
              <ActivityIndicator color={QuestifyColors.textPrimary} />
            ) : (
              <Text style={styles.submitButtonText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: { gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: QuestifyColors.textPrimary },
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
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: QuestifyColors.textSecondary, marginTop: 4 },
  emojiContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiButton: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: QuestifyColors.backgroundLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  emojiButtonSelected: {
    backgroundColor: QuestifyColors.primary,
    borderColor: QuestifyColors.primaryDark,
  },
  emojiText: { fontSize: 28 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  deleteButton: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#FFF5F5', alignItems: 'center',
    borderWidth: 1, borderColor: '#FFD1C1',
  },
  deleteButtonText: { fontSize: 15, fontWeight: '600', color: QuestifyColors.error },
  submitButton: {
    flex: 2, paddingVertical: 14, borderRadius: 12,
    backgroundColor: QuestifyColors.primary, alignItems: 'center',
    justifyContent: 'center', minHeight: 52,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: QuestifyColors.textPrimary },
});
