import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { SPACING, SIZES } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';

interface CardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const Card: React.FC<CardProps> = ({ children, style }) => {
  const { COLORS } = useSettings();
  const styles = getStyles(COLORS);
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const getStyles = (COLORS: any) => StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SPACING.md,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }
    }),
    marginBottom: SPACING.md,
  },
});

export default Card;
