import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/core/contexts/AuthContext';
import { useUpdateUser } from '@/core/hooks/useApi';
import { QuestifyColors } from '@/mobile/constants/colors';
import { Card } from '@/mobile/components/ui/Card';
import { getApiConfig } from '@/core/types/api';

export default function SettingsScreen() {
    const { user, logout } = useAuth();
    const updateUser = useUpdateUser();

    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [startDate, setStartDate] = useState<Date>(
        user?.start_date ? new Date(user.start_date) : new Date()
    );
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

    // Helper to get full avatar URL
    const getAvatarUrl = (url: string | undefined): string | undefined => {
        if (!url) return undefined;
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) {
            const baseUrl = getApiConfig().baseUrl;
            return `${baseUrl}${url}`;
        }
        return url;
    };

    // Update local state when user changes
    React.useEffect(() => {
        if (!isEditingName) setName(user?.name || '');
        if (!isEditingEmail) setEmail(user?.email || '');
        if (user?.start_date) setStartDate(new Date(user.start_date));
        if (user?.avatar_url) setAvatarUrl(user.avatar_url);
    }, [user]);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUpdateName = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide');
      return;
    }
    try {
      await updateUser.mutateAsync({ name });
      setIsEditingName(false);
      Alert.alert('Succès', 'Nom mis à jour');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleUpdateEmail = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Erreur', 'Email invalide');
      return;
    }
    try {
      await updateUser.mutateAsync({ email });
      setIsEditingEmail(false);
      Alert.alert('Succès', 'Email mis à jour');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la mise à jour');
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission requise', 'Vous devez autoriser l\'accès à la galerie');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;

      try {
        // Create FormData for upload
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // React Native FormData format
        formData.append('avatar', {
          uri: imageUri,
          name: filename,
          type,
        } as any);

        // Upload to server - use direct fetch for React Native compatibility
        const { getApiConfig } = await import('@/core/types/api');
        const { getToken } = await import('@/core/services/tokenStorage');
        const baseUrl = getApiConfig().baseUrl;
        const token = await getToken();

        const response = await fetch(`${baseUrl}/api/upload/avatar`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(errorData.error || 'Upload failed');
        }

        const uploadResult = await response.json();

        // Update user with server URL
        await updateUser.mutateAsync({ avatar_url: uploadResult.avatar_url });
        setAvatarUrl(uploadResult.avatar_url);
        Alert.alert('Succès', 'Avatar mis à jour');
      } catch (error: any) {
        Alert.alert('Erreur', error.message || 'Erreur lors de la mise à jour');
      }
    }
  };

  const onDateChange = async (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');

    if (selectedDate) {
      setStartDate(selectedDate);

      try {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        await updateUser.mutateAsync({ start_date: formattedDate });
        Alert.alert('Succès', 'Date de début mise à jour');
      } catch (error: any) {
        Alert.alert('Erreur', error.message || 'Erreur lors de la mise à jour');
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
            {getAvatarUrl(avatarUrl) ? (
              <Image source={{ uri: getAvatarUrl(avatarUrl) }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <Text style={styles.editAvatarText}>✏️</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.name || 'Utilisateur'}</Text>
          <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
        </Card>

        {/* Settings List */}
        <Card style={styles.settingsCard}>
          {/* Name */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Nom</Text>
              {isEditingName ? (
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Votre nom"
                  placeholderTextColor={QuestifyColors.textSecondary}
                  autoFocus
                />
              ) : (
                <Text style={styles.settingValue}>{user?.name || 'Non défini'}</Text>
              )}
            </View>
            {isEditingName ? (
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => {
                  setName(user?.name || '');
                  setIsEditingName(false);
                }}>
                  <Text style={styles.cancelText}>✕</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUpdateName} disabled={updateUser.isPending}>
                  <Text style={styles.saveText}>✓</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setIsEditingName(true)}>
                <Text style={styles.settingChevron}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.separator} />

          {/* Email */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Email</Text>
              {isEditingEmail ? (
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="votre@email.com"
                  placeholderTextColor={QuestifyColors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                />
              ) : (
                <Text style={styles.settingValue}>{user?.email || 'Non défini'}</Text>
              )}
            </View>
            {isEditingEmail ? (
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => {
                  setEmail(user?.email || '');
                  setIsEditingEmail(false);
                }}>
                  <Text style={styles.cancelText}>✕</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUpdateEmail} disabled={updateUser.isPending}>
                  <Text style={styles.saveText}>✓</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setIsEditingEmail(true)}>
                <Text style={styles.settingChevron}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.separator} />

          {/* Start Date */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowDatePicker(true)}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Date de début</Text>
              <Text style={styles.settingValue}>
                {startDate.toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <Text style={styles.settingChevron}>📅</Text>
          </TouchableOpacity>
        </Card>

        {showDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
  }
 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: QuestifyColors.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
  },
  profileCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: QuestifyColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: QuestifyColors.background,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: QuestifyColors.primary,
  },
  editAvatarText: {
    fontSize: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: QuestifyColors.textSecondary,
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: QuestifyColors.textSecondary,
  },
  settingsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 12,
    color: QuestifyColors.textSecondary,
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 16,
    color: QuestifyColors.textPrimary,
  },
  settingText: {
    fontSize: 16,
    color: QuestifyColors.textPrimary,
  },
  settingChevron: {
    fontSize: 20,
    color: QuestifyColors.textSecondary,
  },
  input: {
    fontSize: 16,
    color: QuestifyColors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: QuestifyColors.primary,
    paddingVertical: 4,
  },
  editActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 24,
    color: QuestifyColors.error,
  },
  saveText: {
    fontSize: 24,
    color: QuestifyColors.success,
  },
  separator: {
    height: 1,
    backgroundColor: QuestifyColors.border,
    marginHorizontal: 16,
  },
  logoutButton: {
    marginHorizontal: 20,
    backgroundColor: QuestifyColors.error,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: QuestifyColors.background,
  },
});
