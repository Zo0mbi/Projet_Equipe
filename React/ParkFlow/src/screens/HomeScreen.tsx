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

  //States s'occupant des inputs de l'inscription
  const [registerNom, setRegisterNom] = useState('');
  const [registerPrenom, setRegisterPrenom] = useState('');
  const [registerCourriel, setRegisterCourriel] = useState('');
  const [registerMotDePasse, setRegisterMotDePasse] = useState('');
  const [registerConfirmation, setRegisterConfirmation] = useState('');

  //States pour détecter une modification des champs, pour seulement afficher une erreur après une première modification
  const [registerNomEstModifier, setRegisterNomEstModifier] = useState(false);
  const [registerPrenomEstModifier, setRegisterPrenomEstModifier] = useState(false);
  const [registerCourrielEstModifier, setRegisterCourrielEstModifier] = useState(false);
  const [registerMotDePasseEstModifier, setRegisterMotDePasseEstModifier] = useState(false);
  const [registerConfirmationEstModifier, setRegisterConfirmationEstModifier] = useState(false);

  //States s'occupant de l'activation et désactivation des fenêtres de connexion et d'inscription
  const [afficherLogin, setAfficherLogin] = useState(false);
  const [afficherRegister, setAfficherRegister] = useState(false);
  const [afficherConfirmationRegister, setAfficherConfirmationRegister] = useState(false);

  // Recherche de contraventions
  const [searchTicket, setSearchTicket] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundContraventions, setFoundContraventions] = useState<any[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleAccederEspace = async () => {
    try {
      const utilisateur = await ApiService.getMe();

      if (utilisateur.role.id === 3) {
        navigation.navigate("AdminDashboard");
      } else if (utilisateur.role.id === 2) {
        navigation.navigate("EmployeeDashboard");
      } else {
        navigation.navigate("MyTickets");
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
          navigation.navigate("MyTickets");
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

  const verifPrenomInscription = () => {
    //S'assure que le champ n'est pas undefined
    if(!registerPrenom) return false
    //Logique de vérification
    return registerPrenom.length > 0
  };

  const verifNomInscription = () => {
    //S'assure que le champ n'est pas undefined
    if(!registerNom) return false
    //Logique de vérification
    return registerNom.length > 0
  };

  const verifCourrielInscription = () => {
    //S'assure que le champ n'est pas undefined
    if(!registerCourriel) return false
    //Logique de vérification
    const regexCourriel = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexCourriel.test(registerCourriel)
  };

  const verifMotDePasseInscription = () => {
    //S'assure que le champ n'est pas undefined
    if(!registerMotDePasse) return false
    //Logique de vérification
    return registerMotDePasse.length >= 8
  };

  const verifConfirmationMotDePasseInscription = () => {
    //S'assure que le champ n'est pas undefined
    if(!registerConfirmation) return false
    //Logique de vérification
    return registerConfirmation.length >= 8 && registerConfirmation === registerMotDePasse
  };

  //Boolean pour vérifier si le formulaire est valide, appele tout les autres verifs
  const verifFormulaireValide = (
    verifPrenomInscription() &&
    verifNomInscription() &&
    verifCourrielInscription() &&
    verifMotDePasseInscription() &&
    verifConfirmationMotDePasseInscription()
  );

  const handleInscription = async () => {

    try {
      await ApiService.register(
        registerCourriel,
        registerMotDePasse,
        registerNom,
        registerPrenom
      );

      //Ferme la fenêtre d'inscription puis ouvre celle de login avec un message de succès
      setAfficherConfirmationRegister(true);
      setAfficherRegister(false);
      setAfficherLogin(true);
      //Vide les champs d'inscription
      setRegisterNom('');
      setRegisterPrenom('');
      setRegisterCourriel('');
      setRegisterMotDePasse('');
      setRegisterConfirmation('');

    } catch {
      Alert.alert("Erreur", "Erreur lors de l'inscription");
    }
  };

  const handleSearchByTicket = async () => {
    if (!searchTicket.trim()) {
      Alert.alert(t('error'), t('search_enter_number'));
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    try {
      const result = await ApiService.getContraventionsParNumero(searchTicket.trim().toUpperCase());
      setFoundContraventions(result ? [result] : []);
      setHasSearched(true);
    } catch (e) {
      console.error(e);
      setFoundContraventions([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
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

        <View style={styles.hubDivider}>
          <View style={styles.hubLine} />
          <Text style={styles.hubOr}>{t('or')}</Text>
          <View style={styles.hubLine} />
        </View>

        <View style={styles.quickSearch}>
          <Text style={styles.quickSearchLabel}>{t('quick_ticket_search')}</Text>
          <View style={styles.searchBar}>
            <Input 
              placeholder="Ex: GES-000001"
              value={searchTicket}
              onChangeText={setSearchTicket}
              autoCapitalize="characters"
              containerStyle={styles.searchField}
              style={styles.searchFieldPadding}
            />
            <TouchableOpacity 
              style={[styles.searchGo, isSearching && styles.searchDisabled]}
              onPress={handleSearchByTicket}
              disabled={isSearching}
            >
              {isSearching ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Search color="#FFFFFF" size={20} />}
            </TouchableOpacity>
          </View>

          {hasSearched && foundContraventions && (
            <View style={styles.quickResults}>
              {foundContraventions.length > 0 ? (
                foundContraventions.map((ticket) => (
                  <TicketCard key={ticket.numero_contravention} ticket={ticket} showPayButton={true} onPay={() => Linking.openURL("https://gesparc.ca/#payer")} />
                ))
              ) : (
                <View style={styles.noResultBox}>
                  <AlertCircle size={24} color={COLORS.textLight} />
                  <Text style={styles.emptySearch}>{t('no_ticket_found')}</Text>
                </View>
              )}
            </View>
          )}

        </View>
      </Card>



      <View style={styles.featuresGrid}>
        <Card style={styles.featureMiniCard}>
          <View style={styles.miniIconBox}>
            <Ticket size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.miniTitle}>{t('digital_tickets')}</Text>
          <Text style={styles.miniDesc}>{t('digital_tickets_desc')}</Text>
        </Card>

        <Card style={styles.featureMiniCard}>
          <View style={styles.miniIconBox}>
            <CreditCard size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.miniTitle}>{t('fast_payment')}</Text>
          <Text style={styles.miniDesc}>{t('fast_payment_desc')}</Text>
        </Card>
      </View>

      <View style={styles.publicInfoSection}>
        <View style={styles.sectionHeader}>
          <ShieldCheck size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>{t('parking_info')}</Text>
        </View>

        <View style={styles.infoCardsRow}>
          <Card style={styles.infoCard}>
            <View style={styles.infoIconHeader}>
              <Clock size={20} color={COLORS.primary} />
              <Text style={styles.infoCardTitle}>{t('schedule')}</Text>
            </View>
            <View style={styles.scheduleRow}>
              <Text style={styles.dayText}>{t('mon_ven')}</Text>
              <Text style={styles.hourText}>08h - 21h</Text>
            </View>
            <View style={styles.scheduleRow}>
              <Text style={styles.dayText}>{t('saturday')}</Text>
              <Text style={styles.hourText}>09h - 18h</Text>
            </View>
            <View style={styles.scheduleRow}>
              <Text style={styles.dayText}>{t('sunday')}</Text>
              <Text style={[styles.hourText, styles.hourTextSuccess]}>{t('free')}</Text>
            </View>
          </Card>

          <Card style={styles.infoCard}>
            <View style={styles.infoIconHeader}>
              <CreditCard size={20} color={COLORS.primary} />
              <Text style={styles.infoCardTitle}>{t('payment')}</Text>
            </View>
            <View style={styles.paymentMethod}>
              <CreditCard size={14} color={COLORS.textLight} />
              <Text style={styles.paymentText}>App ParkFlow</Text>
            </View>
            <View style={styles.paymentMethod}>
              <CreditCard size={14} color={COLORS.textLight} />
              <Text style={styles.paymentText}>Bornes & Cartes</Text>
            </View>
            <View style={styles.paymentMethod}>
              <Ticket size={14} color={COLORS.textLight} />
              <Text style={styles.paymentText}>SMS (Plaque)</Text>
            </View>
          </Card>
        </View>
      </View>

      {/* Actions principales */}
      <View style={styles.footer}>
        {/* Menu de connection */}
        <Modal visible={afficherLogin} transparent={true} animationType="none">
          <TouchableWithoutFeedback onPress={() => {setAfficherLogin(false); setAfficherConfirmationRegister(false)}}>
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
                    <Button
                      title={t('register')}
                      variant="outline"
                      onPress={() => {
                        setAfficherLogin(false);
                        setAfficherRegister(true);
                      }}
                      style={styles.btn}
                    />
                      <View style={styles.header}>
                          {afficherConfirmationRegister &&
                          <Text style={styles.infoText}>{t('register_success')}</Text>}
                      </View>
                  </Card>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Menu d'inscription */}
        <Modal visible={afficherRegister} transparent={true} animationType="none">
          <TouchableWithoutFeedback onPress={() => setAfficherRegister(false)}>
            <View style={styles.overlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalContent}>
                  <Card>
                    <View style={styles.header}>
                      <Text style={styles.modalTitle}>{t('inscription_title')}</Text>
                    </View>
                    <Input
                      label={t('first_name')}
                      placeholder=""
                      value={registerPrenom}
                      onChangeText={(texte) => {
                        setRegisterPrenom(texte);
                        setRegisterPrenomEstModifier(true);
                      }}
                      error={registerPrenomEstModifier && !verifPrenomInscription() ? t('err_enter_first_name') : undefined}
                    />
                    <Input
                      label={t('last_name')}
                      placeholder=""
                      value={registerNom}
                      onChangeText={(texte) => {
                        setRegisterNom(texte);
                        setRegisterNomEstModifier(true);
                      }}
                      error={registerNomEstModifier && !verifNomInscription() ? t('err_enter_last_name') : undefined}
                    />
                    <Input
                      label={t('email')}
                      placeholder=""
                      value={registerCourriel}
                      onChangeText={(texte) => {
                        setRegisterCourriel(texte);
                        setRegisterCourrielEstModifier(true);
                      }}
                      keyboardType="email-address"
                      error={registerCourrielEstModifier && !verifCourrielInscription() ? t('err_enter_email') : undefined}
                    />
                    <Input
                      label={t('password')}
                      placeholder=""
                      value={registerMotDePasse}
                      onChangeText={(texte) => {
                        setRegisterMotDePasse(texte);
                        setRegisterMotDePasseEstModifier(true);
                      }}
                      secureTextEntry={true}
                      error={registerMotDePasseEstModifier && !verifMotDePasseInscription() ? t('err_enter_password') : undefined}
                    />
                    <Input
                      label={t('confirm_password')}
                      placeholder=""
                      value={registerConfirmation}
                      onChangeText={(texte) => {
                        setRegisterConfirmation(texte);
                        setRegisterConfirmationEstModifier(true);
                      }}
                      secureTextEntry={true}
                      error={registerConfirmationEstModifier && !verifConfirmationMotDePasseInscription() ? t('err_passwords_match') : undefined}
                    />
                    <Button title={t('register_submit')} onPress={handleInscription} style={styles.btn} disabled={!verifFormulaireValide}/>
                  </Card>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('About')}
          activeOpacity={0.6}
        >
          <Text style={[styles.secondaryBtnText, styles.primaryText]}>{t('discover')}</Text>
          <ArrowRight size={18} color={COLORS.primary} />
        </TouchableOpacity>

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
