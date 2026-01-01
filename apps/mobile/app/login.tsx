import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/core/contexts/AuthContext';
import { QuestifyColors } from '@/mobile/constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, isLoading } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      // AuthGuard will redirect automatically
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        mode === 'login'
          ? 'Connexion échouée. Vérifiez vos identifiants.'
          : "Inscription échouée. L'email existe peut-être déjà."
      );
    }
  };

  const isValid = mode === 'login'
    ? email && password
    : name && email && password;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🎯</Text>
            <Text style={styles.title}>Questify</Text>
            <Text style={styles.subtitle}>Gamifie ta vie !</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === 'login' && styles.tabActive]}
              onPress={() => setMode('login')}
              activeOpacity={0.7}>
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                Connexion
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'register' && styles.tabActive]}
              onPress={() => setMode('register')}
              activeOpacity={0.7}>
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                Inscription
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ton nom"
                  placeholderTextColor={QuestifyColors.textLight}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="ton@email.com"
                placeholderTextColor={QuestifyColors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={QuestifyColors.textLight}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, (!isValid || isLoading) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isValid || isLoading}
              activeOpacity={0.7}>
              {isLoading ? (
                <ActivityIndicator color={QuestifyColors.textPrimary} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'login' ? 'Se connecter' : "S'inscrire"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.infoText}>
              {mode === 'login'
                ? "Pas encore de compte ? Bascule sur l'onglet Inscription"
                : 'Déjà un compte ? Bascule sur Connexion'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: QuestifyColors.backgroundLight,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: QuestifyColors.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: QuestifyColors.background,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: QuestifyColors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: QuestifyColors.textSecondary,
  },
  tabTextActive: {
    color: QuestifyColors.textPrimary,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
  },
  input: {
    backgroundColor: QuestifyColors.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: QuestifyColors.textPrimary,
    borderWidth: 1,
    borderColor: QuestifyColors.border,
  },
  submitButton: {
    backgroundColor: QuestifyColors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
  },
  info: {
    marginTop: 24,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: QuestifyColors.textSecondary,
    textAlign: 'center',
  },
});
