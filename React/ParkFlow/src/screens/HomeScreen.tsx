import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Image,
  Platform,
  useWindowDimensions,
  Alert,
  Linking,
} from 'react-native';
import { getScale } from '../utils/responsive';
import { Ticket, ShieldCheck, ArrowRight, CreditCard, Search, Clock, AlertCircle } from 'lucide-react-native';
import { SPACING, SIZES } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import ScreenContainer from '../components/common/ScreenContainer';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import {ApiService} from '../api/api';
import TicketCard from '../components/common/TicketCard';

/**
 * Page d'accueil (Landing Page) de l'application ParkFlow.
 * Thème repensé : Rouge (vibrant) & Gris Foncé (premium).
 */
const HomeScreen = ({ navigation }: any) => {
  const { COLORS, t } = useSettings();
  const { width } = useWindowDimensions();
  const styles = getStyles(COLORS, width);
  //States s'occupant des inputs de la connexion
  const [loginCourriel, setLoginCourriel] = useState('');
  const [loginMotDePasse, setLoginMotDePasse] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReponse, setCaptchaReponse] = useState('');

  //States s'occupant de l'activation et désactivation des fenêtres de connexion et d'inscription
  const [afficherLogin, setAfficherLogin] = useState(false);

  const handleAccederEspace = async () => {
    try {
      const utilisateur = await ApiService.getMe();

      if (utilisateur.role.id === 3) {
        navigation.navigate("AdminDashboard");
      } else if (utilisateur.role.id === 2) {
        navigation.navigate("EmployeeDashboard");
      } else {
      }

    } catch {
      setLoginError('');
      setAfficherLogin(true)
    }
  }


  const chargerCaptcha = async () => {
    try {
      const { image, token } = await ApiService.getCaptcha();
      setCaptchaImage(image);
      setCaptchaToken(token);
      setCaptchaRequired(true);
      setCaptchaReponse('');
    } catch {
      setLoginError(t('login_error_captcha_load'));
    }
  };

  const handleConnexion = async () => {
    setLoginError('');
    try {
      const utilisateur = await ApiService.login(
        loginCourriel,
        loginMotDePasse,
        captchaRequired ? captchaReponse : undefined,
        captchaRequired ? captchaToken : undefined,
      );

      setAfficherLogin(false);
      setLoginCourriel('');
      setLoginMotDePasse('');
      setLoginError('');
      setLoginAttempts(0);
      setCaptchaRequired(false);
      setCaptchaReponse('');

      if (utilisateur.role.id === 3) {
          navigation.navigate("AdminDashboard");
      } else if (utilisateur.role.id === 2) {
          navigation.navigate("EmployeeDashboard");
      } else {
      }

    } catch (error: any) {
      if (error?.response?.status === 428) {
        const detail = error.response?.data?.detail ?? '';
        setLoginError(
          detail.includes('invalide') || detail.includes('expiré')
            ? t('login_error_captcha_invalid')
            : t('login_error_too_many')
        );
        chargerCaptcha();
      } else if (error?.response?.status === 422) {
        setLoginError("Format de courriel invalide");
      } else {
        const nouvelleTentative = loginAttempts + 1;
        setLoginAttempts(nouvelleTentative);
        setLoginError(t('login_error_invalid').replace('{n}', String(nouvelleTentative)));
      }
    }
  };

  return (
    <ScreenContainer style={styles.container} withBackButton={false} scrollable={true} peutSeConnecter={setAfficherLogin} typePageAccess={"Visiteur"}>
      <StatusBar barStyle={COLORS.background === '#FFFFFF' || COLORS.background === '#F3F4F6' ? "dark-content" : "light-content"} backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoFrame}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>
            Park<Text style={styles.brandHighlight}>Flow</Text>
          </Text>

        </View>
        <Text style={styles.slogan}>
          {t('home_slogan')}
        </Text>
      </View>

      <Card style={styles.actionHub}>
        <Button
          title={t('access_my_space')}
          onPress={handleAccederEspace}
          style={styles.ctaPrimary}
          textStyle={styles.ctaText}
        />

      </Card>

      {/* Menu de connection */}
      <Modal visible={afficherLogin} transparent={true} animationType="none">
        <TouchableWithoutFeedback onPress={() => {setAfficherLogin(false)}}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Card>
                  <View style={styles.header}>
                    <Text style={styles.modalTitle}>{t('connexion_title')}</Text>
                  </View>
                  <Input
                    label={t('email')}
                    placeholder=""
                    value={loginCourriel}
                    onChangeText={setLoginCourriel}
                    keyboardType="email-address"
                  />
                  <Input
                    label={t('password')}
                    placeholder=""
                    value={loginMotDePasse}
                    onChangeText={setLoginMotDePasse}
                    secureTextEntry={true}
                  />
                  {loginError !== '' && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>⚠ {loginError}</Text>
                    </View>
                  )}
                  {captchaRequired && (
                    <View style={styles.captchaContainer}>
                      <Text style={styles.captchaLabel}>{t('captcha_robot')}</Text>
                      {captchaImage !== '' && (
                        <View style={styles.captchaImageBox}>
                          {Platform.OS === 'web'
                            ? <div dangerouslySetInnerHTML={{ __html: captchaImage }} />
                            : <Image
                              source={{ uri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(captchaImage)}` }}
                              style={styles.captchaImage}
                            />
                          }
                        </View>
                      )}
                      <Input
                        placeholder={t('captcha_enter')}
                        value={captchaReponse}
                        onChangeText={setCaptchaReponse}
                        keyboardType="numeric"
                        containerStyle={styles.captchaInput}
                      />
                      <TouchableOpacity onPress={chargerCaptcha}>
                        <Text style={styles.captchaRefresh}>{t('captcha_new')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <Button title={t('sign_in')} onPress={handleConnexion} style={styles.btn}/>
                </Card>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>






      {/* Actions principales */}
      <View style={styles.footer}>
        <Text style={styles.copyright}>
          {t('copyright')}
        </Text>
      </View>
    </ScreenContainer>
  );
};

// Utilsation des constantes globales COLORS


const getStyles = (COLORS: any, width: number) => {
  const scale = getScale(width);
  
  return StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg * scale,
    paddingVertical: SPACING.xl * scale,
    backgroundColor: COLORS.background, 
  },
  header: {
    marginTop: SPACING.xl * scale,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 * scale,
    marginBottom: 8 * scale,
  },
  logoFrame: {
    width: 54 * scale,
    height: 54 * scale,
    transform: [{ rotate: '-3deg' }],
    ...Platform.select({
      web: {
        boxShadow: `0px 4px 8px ${COLORS.primary}66`,
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      }
    }),
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 40 * scale,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.5,
  },
  brandHighlight: {
    color: COLORS.primary,
  },
  modalTitle: {
    fontSize: 24 * scale,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: SPACING.md * scale,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  slogan: {
    fontSize: 16 * scale,
    color: COLORS.textLight,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: SPACING.xl * scale,
    opacity: 0.8,
  },
  actionHub: {
    padding: SPACING.lg * scale,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    marginBottom: SPACING.xl * scale,
  },
  ctaPrimary: {
    width: '100%',
    height: 56 * scale,
    borderRadius: 14 * scale,
    backgroundColor: COLORS.primary,
  },
  ctaText: {
    fontSize: 15 * scale,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  hubDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg * scale,
    opacity: 0.3,
  },
  hubLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  hubOr: {
    color: COLORS.text,
    paddingHorizontal: 12 * scale,
    fontSize: 10 * scale,
    fontWeight: '800',
  },
  quickSearch: {
    width: '100%',
  },
  quickSearchLabel: {
    color: COLORS.textLight,
    fontSize: 12 * scale,
    fontWeight: '700',
    marginBottom: 10 * scale,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  searchBar: {
    position: 'relative',
    width: '100%',
  },
  searchField: {
    flex: 1,
    marginBottom: 0,
  },
  searchGo: {
    position: 'absolute',
    right: 5 * scale,
    top: 5 * scale,
    width: 45 * scale,
    height: 45 * scale,
    borderRadius: 10 * scale,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  searchDisabled: {
    opacity: 0.5,
  },
  quickResults: {
    marginTop: 15 * scale,
    paddingTop: 15 * scale,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 10 * scale,
    borderRadius: 8 * scale,
    marginBottom: 8 * scale,
  },
  ticketMain: {
    flex: 1,
  },
  ticketId: {
    fontSize: 11 * scale,
    fontWeight: '800',
    color: COLORS.primary,
  },
  ticketReason: {
    fontSize: 13 * scale,
    color: COLORS.text,
    fontWeight: '500',
  },
  ticketPrice: {
    fontSize: 14 * scale,
    fontWeight: '800',
    color: COLORS.text,
    marginLeft: 10 * scale,
  },
  emptySearch: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 14 * scale,
    fontWeight: '500',
  },
  resultDetailCard: {
    padding: SPACING.md * scale,
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    marginTop: 10 * scale,
    borderRadius: 16 * scale,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12 * scale,
  },
  badge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 8 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 6 * scale,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 11 * scale,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 20 * scale,
  },
  statusText: {
    fontSize: 10 * scale,
    fontWeight: '800',
  },
  resultMainReason: {
    fontSize: 18 * scale,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12 * scale,
  },
  resultInfoGrid: {
    flexDirection: 'row',
    gap: 15 * scale,
    marginBottom: 15 * scale,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 * scale,
  },
  infoItemText: {
    fontSize: 12 * scale,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12 * scale,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  resultAmount: {
    fontSize: 22 * scale,
    fontWeight: '900',
    color: COLORS.text,
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15 * scale,
    paddingVertical: 10 * scale,
    borderRadius: 10 * scale,
    gap: 8 * scale,
  },
  payNowText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12 * scale,
    letterSpacing: 0.5,
  },
  noResultBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20 * scale,
    gap: 10 * scale,
  },
  resultDetailsSection: {
    backgroundColor: COLORS.border + '20',
    padding: 12 * scale,
    borderRadius: 12 * scale,
    marginBottom: 15 * scale,
    gap: 8 * scale,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * scale,
  },
  detailLabel: {
    fontSize: 12 * scale,
    fontWeight: '800',
    color: COLORS.text,
    width: 65 * scale,
  },
  detailValue: {
    fontSize: 12 * scale,
    color: COLORS.textLight,
    flex: 1,
    fontWeight: '500',
  },

  featuresGrid: {
    flexDirection: 'row',
    gap: SPACING.md * scale,
    marginBottom: SPACING.xl * scale,
  },
  featureMiniCard: {
    flex: 1,
    padding: SPACING.md * scale,
    alignItems: 'flex-start',
    gap: 8 * scale,
  },
  miniIconBox: {
    width: 44 * scale,
    height: 44 * scale,
    borderRadius: 12 * scale,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4 * scale,
  },
  miniTitle: {
    fontSize: 14 * scale,
    fontWeight: '800',
    color: COLORS.text,
  },
  miniDesc: {
    fontSize: 11 * scale,
    color: COLORS.textLight,
    lineHeight: 16 * scale,
    opacity: 0.6,
  },
  footer: {
    width: '100%',
    gap: SPACING.sm * scale,
    alignItems: 'center',
  },
  mainBtn: {
    width: '100%',
    height: 60 * scale,
    borderRadius: SIZES.radius + 4 * scale,
    ...Platform.select({
      web: {
        boxShadow: `0px 6px 10px ${COLORS.primary}4D`,
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
      }
    }),
  },
  mainBtnText: {
    fontSize: 18 * scale,
    fontWeight: '800',
    letterSpacing: 1,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs * scale,
    paddingVertical: SPACING.md * scale,
    width: '100%',
    borderRadius: SIZES.radius * scale,
    backgroundColor: 'transparent',
  },
  secondaryBtnText: {
    color: COLORS.textLight,

    fontWeight: '600',
    fontSize: 16 * scale,
  },
  copyright: {
    fontSize: 12 * scale,
    color: COLORS.textLight,

    marginTop: SPACING.sm * scale,
    opacity: 0.5,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)', // Plus sombre pour focus
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg * scale,
  },
  modalContent: {
    width: '100%',
    maxWidth: 450 * scale,
    borderRadius: SIZES.radius * 2 * scale,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  actions: {
    width: '100%',
    paddingHorizontal: 20 * scale,
    paddingVertical: 20 * scale,
  },
  btn: {
    marginBottom: 10 * scale,
  },
  // Nouvelles sections publiques
  publicInfoSection: {
    marginBottom: SPACING.xl * scale,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm * scale,
    marginBottom: SPACING.md * scale,
  },
  sectionTitle: {
    fontSize: 20 * scale,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoCardsRow: {
    flexDirection: 'row',
    gap: SPACING.md * scale,
  },
  infoCard: {
    flex: 1,
    padding: SPACING.md * scale,
  },
  infoIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * scale,
    marginBottom: SPACING.sm * scale,
  },
  infoCardTitle: {
    fontSize: 14 * scale,
    fontWeight: '700',
    color: COLORS.text,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4 * scale,
  },
  dayText: {
    fontSize: 11 * scale,
    color: COLORS.textLight,
  },
  hourText: {
    fontSize: 11 * scale,
    fontWeight: '700',
    color: COLORS.text,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 * scale,
    marginBottom: 4 * scale,
  },
  paymentText: {
    fontSize: 11 * scale,
    color: COLORS.textLight,
  },
  searchSection: {
    marginBottom: SPACING.lg * scale,
  },
  sectionTitleSmall: {
    fontSize: 16 * scale,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  searchCardSmall: {
    padding: SPACING.sm * scale,
    backgroundColor: COLORS.card,
  },
  searchBoxSmall: {
    flexDirection: 'row',
    gap: SPACING.xs * scale,
  },
  searchInputContainerSmall: {
    flex: 1,
    marginBottom: 0,
  },
  searchInputSmall: {
    height: 44 * scale,
    fontSize: 13 * scale,
  },
  searchBtnSmall: {
    backgroundColor: COLORS.primary,
    width: 44 * scale,
    height: 44 * scale,
    borderRadius: SIZES.radius - 4 * scale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnDisabled: {
    opacity: 0.7,
  },
  resultsContainer: {
    marginTop: SPACING.md * scale,
    paddingTop: SPACING.md * scale,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  resultItem: {
    backgroundColor: COLORS.card,
    borderRadius: 8 * scale,
    padding: SPACING.sm * scale,
    marginBottom: SPACING.sm * scale,
  },
  resultMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6 * scale,
  },
  resultInfo: {
    flex: 1,
  },
  resultId: {
    fontSize: 12 * scale,
    fontWeight: '800',
    color: COLORS.primary,
  },
  resultReason: {
    fontSize: 13 * scale,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusUnpaid: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
  },
  statusPaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  noResultText: {
    fontSize: 12 * scale,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  infoText: {
    color: COLORS.textLight,
    fontWeight: "bold"
  },
  searchFieldPadding: { paddingRight: 60 },
  hourTextSuccess: { color: COLORS.success },
  primaryText: { color: COLORS.primary },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8 * scale,
    paddingVertical: 8 * scale,
    paddingHorizontal: 12 * scale,
    marginBottom: 10 * scale,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13 * scale,
    fontWeight: '600',
    textAlign: 'center',
  },
  captchaContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8 * scale,
    padding: 12 * scale,
    marginBottom: 12 * scale,
    gap: 8 * scale,
  },
  captchaLabel: {
    fontSize: 13 * scale,
    color: COLORS.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  captchaImageBox: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 6 * scale,
    paddingVertical: 4 * scale,
  },
  captchaImage: {
    width: 150 * scale,
    height: 50 * scale,
  },
  captchaInput: {
    marginBottom: 0,
  },
  captchaRefresh: {
    fontSize: 12 * scale,
    color: COLORS.primary,
    textAlign: 'right',
  },
});
};

export default HomeScreen;
