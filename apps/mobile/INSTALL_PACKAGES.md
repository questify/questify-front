# Installation des packages nécessaires

Pour que les fonctionnalités de calendrier et de sélection d'image fonctionnent, vous devez installer les packages suivants:

```bash
cd apps/mobile
npm install @react-native-community/datetimepicker expo-image-picker
```

Après l'installation, redémarrez le serveur Expo:

```bash
npx expo start --clear
```

## Packages installés

- `@react-native-community/datetimepicker` - Permet de sélectionner une date avec un calendrier natif
- `expo-image-picker` - Permet de choisir une image depuis la galerie pour l'avatar

## Permissions requises

L'application demandera automatiquement la permission d'accès à la galerie photos lors de la première tentative de modification de l'avatar.
