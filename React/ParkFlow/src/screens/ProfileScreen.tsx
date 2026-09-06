import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { getScale } from '../utils/responsive';
import * as Lucide from 'lucide-react-native';
const { User, ShieldCheck, ArrowLeft } = Lucide;
const Phone = (Lucide as any).Phone || (Lucide as any).PhoneCall || (Lucide as any).Smartphone || User;
const Mail = (Lucide as any).Mail || User;
import { SPACING, SIZES } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import ScreenContainer from '../components/common/ScreenContainer';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { ApiService } from '../api/api';
import { Utilisateur } from '../types/database';

/**
 * Écran de profil utilisateur.
 * Permet de consulter et modifier ses informations personnelles (nom, courriel, téléphone).
 */
const ProfileScreen = ({ navigation }: any) => {
  const { COLORS, t } = useSettings();
  const { width } = useWindowDimensions();
  const styles = getStyles(COLORS, width);
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [vehicules, setVehicules] = useState<any[]>([]);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [erreurMessage, setErreurMessage] = useState("");

  //États pour le changement du mot de passe
  const [afficherChangerPassword, setAfficherChangerPassword] = useState(false);
  const [passwordActuel, setPasswordActuel] = useState("");
  const [nouveauPassword, setNouveauPassword] = useState("");
  const [confirmationNouveauPassword, setConfirmationNouveauPassword] = useState("");

  //État pour connaitre les informations actuelles
  const [infosActuelles, setInfosActuelles] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
  });

  const champsOntChanges = (
    prenom !== infosActuelles.prenom ||
    nom !== infosActuelles.nom ||
    email !== infosActuelles.email ||
    telephone !== infosActuelles.telephone
  );


  // Chargement du profil au montage du composant
  useEffect(() => {
    fetchUserData();
  }, []);

  //Méthode pour transformer le téléphone reçu au format voulu
  const formatAffichageTelephone = (telephone: string) => {
    if(!telephone.length) return "";

    const chiffres = telephone.replace(/\D/g, '');

    if (chiffres.length !== 10) {
      return telephone;
    }
    return chiffres.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  /**
   * Récupère les données de l'utilisateur connecté via l'API
   * et pré-remplit les champs du formulaire.
   */
  const fetchUserData = async () => {
    try {
      const [userData, vehiculesData] = await Promise.all([
        ApiService.getMe(),
        ApiService.getMesVehicules()
      ]);
      setUser(userData);
      setPrenom(userData.prenom || '');
      setNom(userData.nom || '');
      setEmail(userData.email || '');
      setVehicules(vehiculesData);

      const telephoneAffichage = formatAffichageTelephone((userData as any).numero_telephone || '')
      setTelephone(telephoneAffichage);

      setInfosActuelles({
        prenom: userData.prenom || '',
        nom: userData.nom || '',
        email: userData.email || '',
        telephone: telephoneAffichage,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      Alert.alert('Erreur', 'Impossible de charger les informations du profil.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifPrenom = () => {
    //S'assure que le champ n'est pas undefined
    if(!prenom) return false
    //Logique de vérification
    return prenom.length > 0
  };

  const verifNom = () => {
    //S'assure que le champ n'est pas undefined
    if(!nom) return false
    //Logique de vérification
    return nom.length > 0
  };

  const verifCourriel = () => {
    //S'assure que le champ n'est pas undefined
    if(!email) return false
    //Logique de vérification
    const regexCourriel = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexCourriel.test(email)
  };

  const verifTelephone = () => {
    //Logique de vérification
    const regexTelephone = /^$|^(?:\(\d{3}\)\s?|\d{3}[ -]?)(\d{3})[ -]?(\d{4})$/;
    return regexTelephone.test(telephone)
  };


  //Boolean pour vérifier si le formulaire est valide, appele tout les autres verifs
  const verifInfosValide = (
    verifPrenom() &&
    verifNom() &&
    verifCourriel() &&
    verifTelephone()
  );

  /**
   * Soumet les modifications du profil à l'API.
   * Déclenche la validation avant l'envoi.
   */
  const handleSave = async () => {
    if (!verifInfosValide || !user) return;

    setIsSaving(true);
    setSuccessMessage('');
    try {
      const telephoneChiffres = telephone.replace(/\D/g, '');

      await ApiService.updateUtilisateur(user.id, { nom, prenom, email, numero_telephone: telephoneChiffres } as any);

      const telephoneAffichage = formatAffichageTelephone(telephoneChiffres)

      //Change les infos actuelles dans le frontend
      setInfosActuelles({
        prenom,
        nom,
        email,
        telephone: telephoneAffichage,
      });

      setSuccessMessage('Sauvegarde complétée avec succès.');
      setTimeout(() => setSuccessMessage(''), 5000);
      Alert.alert('Succès', 'Vos informations ont été mises à jour avec succès.');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangerPassword = async () => {
    if (!verifChangementPasswordValide || !user) return;

    try {

      const utilisateur = await ApiService.modifierPassword(
        passwordActuel,
        nouveauPassword
      );

      setSuccessMessage('Mot de passe changé avec succès.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch {
      setErreurMessage('Erreur lors du changement de mot de passe.');
      setTimeout(() => setErreurMessage(''), 5000);
    } finally {
      setAfficherChangerPassword(false);
      setPasswordActuel("");
      setNouveauPassword("");
      setConfirmationNouveauPassword("");
    }
  };

  const verifPasswordActuel = () => {
    //S'assure que le champ n'est pas undefined
    if(!passwordActuel) return false
    //Logique de vérification
    return passwordActuel.length > 0
  };

  const verifNouveauPassword = () => {
    //S'assure que le champ n'est pas undefined
    if(!nouveauPassword) return false
    //Logique de vérification
    return nouveauPassword.length >= 8
  };

  const verifConfirmationNouveauPassword = () => {
    //S'assure que le champ n'est pas undefined
    if(!confirmationNouveauPassword) return false
    //Logique de vérification
    return confirmationNouveauPassword.length >= 8 && confirmationNouveauPassword === nouveauPassword
  };

  //Boolean pour vérifier si le formulaire est valide, appele tout les autres verifs
  const verifChangementPasswordValide = (
    verifPasswordActuel() &&
    verifNouveauPassword() &&
    verifConfirmationNouveauPassword()
  );



  // Affiche un spinner pendant le chargement initial
  if (isLoading) {
    return (
      <ScreenContainer style={styles.loadingContainer} typePageAccess={"Utilisateurs"}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable typePageAccess={"Utilisateurs"} withBackButton={true}>

      {/* En-tête : avatar, rôle, nom et date d'inscription */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <User size={60} color={COLORS.text} />
          </View>
          {/* Badge de rôle positionné en bas à droite de l'avatar */}
          <View style={styles.roleBadge}>
            <ShieldCheck size={12} color={COLORS.text} />
            <Text style={styles.roleText}>
              {String((user as any)?.role?.nom || 'CLIENT').toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.userName}>{infosActuelles.prenom ? `${infosActuelles.prenom} ${infosActuelles.nom}` : nom}</Text>
        <Text style={styles.userJoined}>
          Membre depuis le {new Date((user as any)?.date_inscription || '').toLocaleDateString('fr-CA')}
        </Text>
      </View>

      {/* Formulaire de modification des informations */}
      <Card style={styles.profileCard}>
        <Text style={styles.cardTitle}>{t('profile_personal')}</Text>

        <View style={styles.inputGroup}>
          <View style={styles.inputLabelContainer}>
            <User size={16} color={COLORS.primary} />
            <Text style={styles.inputLabel}>{t('first_name')}</Text>
          </View>
          <Input
            placeholder={t('profile_first_name_ph')}
            value={prenom}
            onChangeText={setPrenom}
            error={
              verifPrenom() ? undefined : 'Veuillez entrer votre prenom.'
            }
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputLabelContainer}>
            <User size={16} color={COLORS.primary} />
            <Text style={styles.inputLabel}>{t('last_name')}</Text>
          </View>
          <Input
            placeholder={t('profile_last_name_ph')}
            value={nom}
            onChangeText={setNom}
            error={
              verifNom() ? undefined : 'Veuillez entrer votre nom.'
            }
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputLabelContainer}>
            <Mail size={16} color={COLORS.primary} />
            <Text style={styles.inputLabel}>{t('email')}</Text>
          </View>
          <Input
            placeholder="votre@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={
              verifCourriel() ? undefined : 'Veuillez entrer un courriel valide.'
            }
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputLabelContainer}>
            <Phone size={16} color={COLORS.primary} />
            <Text style={styles.inputLabel}>{t('phone')}</Text>
          </View>
          <Input
            placeholder={t('profile_phone_ph')}
            value={telephone}
            onChangeText={(txt) => setTelephone(txt.replace(/[^\d\s()-]/g, ''))}
            keyboardType="phone-pad"
            error={
              verifTelephone() ? undefined : 'Veuillez entrer un telephone valide.'
            }
          />
        </View>

        {successMessage ? (
          <View style={styles.successMessageContainer}>
            <Text style={styles.successMessageText}>{successMessage}</Text>
          </View>
        ) : null}

        {erreurMessage ? (
          <View style={styles.erreurMessageContainer}>
            <Text style={styles.erreurMessageText}>{erreurMessage}</Text>
          </View>
        ) : null}

        <Button
          title={t('profile_save')}
          onPress={handleSave}
          loading={isSaving}
          style={styles.saveBtn}
          disabled={!champsOntChanges || !verifInfosValide}
        />
      </Card>

      {/* Mes Véhicules */}
      <View style={styles.vehiculesSection}>
        <Text style={styles.vehiculesTitle}>{t('profile_vehicles')}</Text>
        {vehicules.length > 0 ? (
          vehicules.map((v, i) => (
            <Card key={i} style={styles.vehiculeCard}>
              <View style={styles.vehiculeIconBox}>
                <Lucide.Car size={20} color={COLORS.primary} />
              </View>
              <View style={styles.vehiculeInfo}>
                <Text style={styles.plateText}>{v.numero_plaque}</Text>
                <Text style={styles.brandText}>{v.marque} {v.modele}</Text>
              </View>
              <View style={styles.provinceBadge}>
                <Text style={styles.provinceText}>{v.province}</Text>
              </View>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyVehicules}>
            <Text style={styles.emptyVehiculesText}>{t('profile_no_vehicles')}</Text>
          </Card>
        )}
      </View>

      {/* Section sécurité — navigation vers le changement de mot de passe */}
      <View style={styles.securitySection}>
        <Text style={styles.securityTitle}>{t('profile_security')}</Text>
        <TouchableOpacity
          style={styles.securityItem}
          activeOpacity={0.7}
          onPress={() => {setAfficherChangerPassword(true)}}
        >
          <View style={styles.securityIconBox}>
            <ShieldCheck size={20} color={COLORS.textLight} />
          </View>
          <View style={styles.securityTextContainer}>
            <Text style={styles.securityItemTitle}>{t('profile_change_pw')}</Text>
            <Text style={styles.securityItemDesc}>
              Mettez à jour votre mot de passe pour plus de sécurité.
            </Text>
          </View>
          {/* ArrowLeft pivoté à 180° pour simuler un chevron de navigation */}
          <ArrowLeft
            size={20}
            color={COLORS.textLight}
            style={styles.rotated180}
          />
        </TouchableOpacity>
      </View>

      <Modal visible={afficherChangerPassword} transparent={true} animationType="none">
        <TouchableWithoutFeedback onPress={() => {
          setAfficherChangerPassword(false);
          setPasswordActuel("");
          setNouveauPassword("");
          setConfirmationNouveauPassword("");
        }}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Card>
                  <View style={styles.header}>
                    <Text style={styles.modalTitle}>{t('profile_changement_password_title')}</Text>
                  </View>
                  <Input
                    label={t('password_actuel')}
                    placeholder=""
                    value={passwordActuel}
                    onChangeText={setPasswordActuel}
                    secureTextEntry={true}
                    error={
                      verifPasswordActuel() ? undefined : 'Veuillez entrer votre ancien mot de passe.'
                    }
                  />
                  <Input
                    label={t('password_nouveau')}
                    placeholder=""
                    value={nouveauPassword}
                    onChangeText={setNouveauPassword}
                    secureTextEntry={true}
                    error={
                      verifNouveauPassword() ? undefined : 'Veuillez entrer un nouveau mot de passe valide.'
                    }
                  />
                  <Input
                    label={t('password_nouveau_confirmation')}
                    placeholder=""
                    value={confirmationNouveauPassword}
                    onChangeText={setConfirmationNouveauPassword}
                    secureTextEntry={true}
                    error={
                      verifConfirmationNouveauPassword() ? undefined : 'Le mot de passe doit être le même que celui entré.'
                    }
                  />
                  <Button title={t('profile_changement_password')} onPress={handleChangerPassword} style={styles.btn} disabled={!verifChangementPasswordValide}/>
                </Card>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </ScreenContainer>
  );
};

const getStyles = (COLORS: any, width: number) => {
  const scale = getScale(width);

  return StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginVertical: SPACING.xl * scale,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md * scale,
  },
  avatarCircle: {
    width: 120 * scale,
    height: 120 * scale,
    borderRadius: 60 * scale,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: `0px 10px 15px ${COLORS.primary}4D`,
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
      }
    }),
  },
  roleBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 12 * scale,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 * scale,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  roleText: {
    color: COLORS.text,
    fontSize: 10 * scale,
    fontWeight: '800',
  },
  userName: {
    fontSize: 24 * scale,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4 * scale,
  },
  userJoined: {
    fontSize: 14 * scale,
    color: COLORS.textLight,
    opacity: 0.7,
  },
  profileCard: {
    padding: SPACING.lg * scale,
    marginBottom: SPACING.xl * scale,
  },
  cardTitle: {
    fontSize: 18 * scale,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.lg * scale,
  },
  inputGroup: {
    marginBottom: SPACING.md * scale,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * scale,
    marginBottom: 8 * scale,
  },
  inputLabel: {
    fontSize: 14 * scale,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  successMessageContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: SPACING.md * scale,
    borderRadius: SIZES.radius * scale,
    marginBottom: SPACING.md * scale,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successMessageText: {
    color: '#22c55e',
    fontWeight: '800',
    fontSize: 14 * scale,
    textAlign: 'center',
  },
  erreurMessageContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    padding: SPACING.md * scale,
    borderRadius: SIZES.radius * scale,
    marginBottom: SPACING.md * scale,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  erreurMessageText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 14 * scale,
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: SPACING.md * scale,
  },
  securitySection: {
    marginBottom: SPACING.xl * scale,
  },
  securityTitle: {
    fontSize: 18 * scale,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md * scale,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md * scale,
    borderRadius: SIZES.radius * scale,
    gap: 12 * scale,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  securityIconBox: {
    width: 44 * scale,
    height: 44 * scale,
    borderRadius: 12 * scale,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityTextContainer: {
    flex: 1,
  },
  securityItemTitle: {
    fontSize: 15 * scale,
    fontWeight: '700',
    color: COLORS.text,
  },
  securityItemDesc: {
    fontSize: 12 * scale,
    color: COLORS.textLight,
  },
  vehiculesSection: {
    marginBottom: SPACING.xl * scale,
  },
  vehiculesTitle: {
    fontSize: 18 * scale,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md * scale,
  },
  vehiculeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md * scale,
    marginBottom: SPACING.sm * scale,
    gap: 12 * scale,
  },
  vehiculeIconBox: {
    width: 44 * scale,
    height: 44 * scale,
    borderRadius: 12 * scale,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehiculeInfo: {
    flex: 1,
  },
  plateText: {
    fontSize: 16 * scale,
    fontWeight: '800',
    color: COLORS.text,
  },
  brandText: {
    fontSize: 12 * scale,
    color: COLORS.textLight,
  },
  provinceBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 8 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 6 * scale,
  },
  provinceText: {
    fontSize: 10 * scale,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptyVehicules: {
    padding: SPACING.md * scale,
    alignItems: 'center',
  },
  emptyVehiculesText: {
    color: COLORS.textLight,
    fontStyle: 'italic',
    fontSize: 14 * scale,
  },
  rotated180: {
    transform: [{ rotate: '180deg' }]
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
  modalTitle: {
    fontSize: 24 * scale,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: SPACING.md * scale,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  btn: {
    marginBottom: 10 * scale,
  },
});
};

export default ProfileScreen;