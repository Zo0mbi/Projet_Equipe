import React from 'react';
import { Text, StyleSheet, View, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SPACING, SIZES } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import ScreenContainer from '../../components/common/ScreenContainer';
import { ArrowRight, Leaf, ShieldCheck, Globe } from 'lucide-react-native';
import { getScale } from '../../utils/responsive';

const AboutScreen = () => {
  const { COLORS, t } = useSettings();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const styles = getStyles(COLORS, width);

  return (
    <ScreenContainer scrollable typePageAccess="Visiteur" hideMenuBar={false}>

      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <View style={styles.badgeContainer}>
          <Leaf color={COLORS.primary} size={14} />
          <Text style={styles.badgeText}>{t('about_badge')}</Text>
        </View>
        <Text style={styles.heroTitle}>{t('about_hero_title')}</Text>
        <Text style={styles.heroSubtitle}>{t('about_hero_subtitle')}</Text>
      </View>

      {/* Main Features */}
      <View style={styles.featuresWrapper}>
        <FeatureItem
          icon={<Leaf color={COLORS.primary} size={22} />}
          title={t('about_feat1_title')}
          description={t('about_feat1_desc')}
          COLORS={COLORS}
        />
        <FeatureItem
          icon={<ShieldCheck color={COLORS.primary} size={22} />}
          title={t('about_feat2_title')}
          description={t('about_feat2_desc')}
          COLORS={COLORS}
        />
        <FeatureItem
          icon={<Globe color={COLORS.primary} size={22} />}
          title={t('about_feat3_title')}
          description={t('about_feat3_desc')}
          COLORS={COLORS}
        />
      </View>

      {/* Premium Call to Action */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Home' as never)}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>{t('about_cta')}</Text>
          <View style={styles.ctaIconWrapper}>
            <ArrowRight color={COLORS.background} size={18} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
      </View>

    </ScreenContainer>
  );
};

const FeatureItem = ({ icon, title, description, COLORS }: any) => {
  const { width } = useWindowDimensions();
  const styles = getStyles(COLORS, width);
  return (
    <View style={styles.featureCard}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
};

const getStyles = (COLORS: any, width: number) => {
  const scale = getScale(width);

  return StyleSheet.create({
  heroContainer: {
    marginTop: SPACING.xl * scale,
    marginBottom: SPACING.xl * 1.5 * scale,
    paddingHorizontal: SPACING.sm * scale,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12 * scale,
    paddingVertical: 6 * scale,
    borderRadius: 20 * scale,
    marginBottom: SPACING.md * scale,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.15)',
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 11 * scale,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginLeft: 6 * scale,
  },
  heroTitle: {
    fontSize: (width > 400 ? 36 : 30) * scale,
    fontWeight: '900',
    color: COLORS.text,
    lineHeight: (width > 400 ? 44 : 38) * scale,
    marginBottom: SPACING.md * scale,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16 * scale,
    color: COLORS.textLight,
    lineHeight: 24 * scale,
    fontWeight: '400',
    opacity: 0.8,
    maxWidth: '90%',
  },
  featuresWrapper: {
    marginBottom: SPACING.xl * 2 * scale,
    gap: SPACING.md * scale,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius * 1.5 * scale,
    padding: SPACING.lg * scale,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: `0px 4px 20px rgba(0, 0, 0, 0.03)`,
      }
    }),
  },
  iconContainer: {
    width: 48 * scale,
    height: 48 * scale,
    borderRadius: 24 * scale,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md * scale,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17 * scale,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4 * scale,
  },
  featureDescription: {
    fontSize: 14 * scale,
    color: COLORS.textLight,
    lineHeight: 20 * scale,
    opacity: 0.7,
  },
  ctaContainer: {
    alignItems: 'center',
    marginVertical: SPACING.xl * scale,
    paddingBottom: SPACING.xl * scale,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 12 * scale,
    paddingHorizontal: 24 * scale,
    borderRadius: 30 * scale,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: `0px 8px 25px rgba(220, 38, 38, 0.15)`,
      }
    }),
  },
  ctaText: {
    color: COLORS.primary,
    fontSize: 18 * scale,
    fontWeight: '800',
    marginRight: 12 * scale,
  },
  ctaIconWrapper: {
    backgroundColor: COLORS.primary,
    width: 32 * scale,
    height: 32 * scale,
    borderRadius: 16 * scale,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
};

export default AboutScreen;
