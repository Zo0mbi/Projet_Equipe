import React from 'react';
import { View, Text, StyleSheet, Switch, useWindowDimensions } from 'react-native';
import ScreenContainer from '../components/common/ScreenContainer';
import { getScale } from '../utils/responsive';
import Card from '../components/common/Card';
import { useSettings } from '../context/SettingsContext';
import { SPACING, SIZES } from '../constants/theme';
import { Globe } from 'lucide-react-native';
import * as Lucide from 'lucide-react-native';
const Moon = (Lucide as any).Moon || (Lucide as any).MoonIcon || Globe;
const Sun = (Lucide as any).Sun || (Lucide as any).SunIcon || Globe;

const SettingsScreen = (_props: any) => {
  const { theme, setTheme, lang, setLang, COLORS, t } = useSettings();
  const { width } = useWindowDimensions();

  const styles = getStyles(COLORS, width);

  return (
    <ScreenContainer scrollable title={t('settings')} withBackButton typePageAccess={"Visiteur"}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings')}</Text>
      </View>

      <Text style={styles.sectionTitle}>{t('appearance')}</Text>
      <Card style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconBox, styles.iconBoxPrimary]}>
              {theme === 'dark' ? <Moon color={COLORS.primary} size={20} /> : <Sun color={COLORS.primary} size={20} />}
            </View>
            <Text style={styles.settingText}>{theme === 'dark' ? t('dark_mode') : t('light_mode')}</Text>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
            trackColor={{ false: COLORS.textLight + '40', true: COLORS.primary }}
            thumbColor={'#fff'}
          />
        </View>
      </Card>

      <Text style={styles.sectionTitle}>{t('language')}</Text>
      <Card style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconBox, styles.iconBoxBlue]}>
              <Globe color="#3b82f6" size={20} />
            </View>
            <Text style={styles.settingText}>{t('french')}</Text>
          </View>
          <Switch
            value={lang === 'fr'}
            onValueChange={(val) => setLang(val ? 'fr' : 'en')}
            trackColor={{ false: COLORS.border, true: '#3b82f6' }}
            thumbColor={'#fff'}
          />
        </View>
        <View style={[styles.divider, styles.dividerColored]} />
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconBox, styles.iconBoxPurple]}>
              <Globe color="#a855f7" size={20} />
            </View>
            <Text style={styles.settingText}>{t('english')}</Text>
          </View>
          <Switch
            value={lang === 'en'}
            onValueChange={(val) => setLang(val ? 'en' : 'fr')}
            trackColor={{ false: COLORS.border, true: '#a855f7' }}
            thumbColor={'#fff'}
          />
        </View>
      </Card>
    </ScreenContainer>
  );
};

const getStyles = (COLORS: any, width: number) => {
  const scale = getScale(width);

  return StyleSheet.create({
  header: {
    marginBottom: SPACING.xl * scale,
  },
  title: {
    fontSize: 28 * scale,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 13 * scale,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm * scale,
    marginLeft: 4 * scale,
  },
  card: {
    padding: 0,
    marginBottom: SPACING.xl * scale,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius * 1.5 * scale,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg * scale,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 * scale,
  },
  iconBox: {
    width: 36 * scale,
    height: 36 * scale,
    borderRadius: 12 * scale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    color: COLORS.text,
    fontSize: 16 * scale,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginLeft: 60 * scale,
  },
  iconBoxPrimary: {
    backgroundColor: COLORS.primary + '15',
  },
  iconBoxBlue: {
    backgroundColor: '#3b82f615',
  },
  iconBoxPurple: {
    backgroundColor: '#a855f715',
  },
  dividerColored: {
    backgroundColor: COLORS.border,
  }
});
};

export default SettingsScreen;