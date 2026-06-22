import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle
} from 'react-native';
import { SPACING, SIZES } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';

/**
 * Propriétés du composant bouton réutilisable.
 */
interface ButtonProps {
  title: string; // Texte affiché sur le bouton
  onPress: () => void; // Fonction appelée au clic
  loading?: boolean; // Affiche un spinner si vrai
  disabled?: boolean; // Désactive l'interaction
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'; // Style visuel du bouton
  style?: ViewStyle; // Style personnalisé pour le conteneur
  textStyle?: TextStyle; // Style personnalisé pour le texte
  children?: React.ReactNode; // Permet d'insérer une icône avant le texte
}

const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false, 
  variant = 'primary',
  style,
  textStyle,
  children
}) => {
  const { COLORS } = useSettings();
  const styles = getStyles(COLORS);
  
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary': return styles.secondary;
      case 'danger': return styles.danger;
      case 'outline': return styles.outline;
      default: return styles.primary;
    }
  };

  const getVariantTextStyle = () => {
    switch (variant) {
      case 'outline': return styles.outlineText;
      default: return styles.buttonText;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, getVariantStyle(), style, (disabled || loading) && styles.disabled, children ? styles.row : null]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : '#FFFFFF'} />
      ) : (
        <>
          {children}
          <Text style={[getVariantTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};


const getStyles = (COLORS: any) => StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  danger: {
    backgroundColor: COLORS.danger,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
});

export default Button;
