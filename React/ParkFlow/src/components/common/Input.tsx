import React from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TextInputProps, 
  ViewStyle 
} from 'react-native';
import { SPACING, SIZES } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';

/**
 * Propriétés du composant de saisie réutilisable.
 * Hérite de toutes les propriétés standard de TextInput de React Native.
 */
interface InputProps extends TextInputProps {
  label?: string; // Libellé affiché au-dessus du champ
  error?: string; // Message d'erreur affiché en rouge en dessous
  containerStyle?: ViewStyle; // Style pour le conteneur englobant
  icon?: React.ReactNode; // Icône à afficher à gauche
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  containerStyle, 
  icon,
  style,
  ...props 
}) => {
  const { COLORS } = useSettings();
  const styles = getStyles(COLORS);
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        error ? styles.inputError : null,
      ]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textLight}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const getStyles = (COLORS: any) => StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    height: 55,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    paddingVertical: 0,
  },
  iconContainer: {
    paddingLeft: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 0,
    textAlignVertical: 'center',
    lineHeight: 55,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
    minHeight: 16
  },
});

export default Input;
