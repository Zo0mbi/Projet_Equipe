import React, { useCallback, useState } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  View, 
  ViewStyle, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  Text,
  Image
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ArrowLeft, UserCircle, LogOut, User, Settings } from 'lucide-react-native';

import { SPACING, SIZES } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import { ApiService } from '../../api/api';
import { Utilisateur } from '../../types/database';

/**
 * Conteneur de base pour tous les écrans de l'application.
 */
interface ScreenContainerProps {
  children?: React.ReactNode;
  style?: ViewStyle; 
  scrollable?: boolean; 
  title?: string; 
  withBackButton?: boolean; 
  hideMenuBar?: boolean;
  peutSeConnecter?: (value: boolean) => void;
  typePageAccess: "Visiteur" | "Utilisateurs" | "Employe" | "Admin";
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({ 
  children, 
  style, 
  scrollable = false,
  title,
  withBackButton,
  hideMenuBar = false,
  peutSeConnecter,
  typePageAccess
}) => {
  const navigation = useNavigation<any>();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { COLORS, t } = useSettings();
  
  const styles = getStyles(COLORS);

  const canGoBack = navigation.canGoBack();
  const showBack = withBackButton !== undefined ? withBackButton : canGoBack;

  const Content = scrollable ? ScrollView : View;

  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)

  const checkAccesPage = async () => {
    try{
      if(typePageAccess === "Visiteur") return;

      //Vérifie si un token existe avant de vérifier les accès
      let token = null;
      if (Platform.OS === 'web') {
        token = localStorage.getItem('token');
      } else {
        token = await SecureStore.getItemAsync('token');
      }

      if (!token) {
        console.log("Accès refusé (Pas de token).");
        await handleLogout();
        return;
      }

      //Appelle à l'api pour vérifier si l'utilisateur connecté à accès
      const aAcces = await ApiService.checkPageAccess(typePageAccess);

      if (!aAcces){
        console.error("Accès refusé.")
        await handleLogout()
      }

    } catch (e) {
      console.error(e)
    }
  };

  //Méthode pour afficher les informations de l'utilisateur connecté dans le menu du haut
  const afficherInfosUtilisateur = async () => {
    try{
      // Vérifier si un token existe avant de tenter de récupérer l'utilisateur
      let token = null;
      if (Platform.OS === 'web') {
        token = localStorage.getItem('token');
      } else {
        token = await SecureStore.getItemAsync('token');
      }

      if (!token) {
        setUtilisateur(null);
        return;
      }

      //Appelle à l'api pour obtenir l'utilisateur connecté grâce à son token
      const userData = await ApiService.getMe();

      //Place l'utilisateur obtenu dans le state
      setUtilisateur(userData);

    } catch (e: any) {
      // Si on reçoit une erreur 401 (non autorisé), cela signifie que le token est expiré ou invalide.
      // On déconnecte l'utilisateur pour nettoyer l'état de l'application.
      if (e?.response?.status === 401) {
        await ApiService.logout();
        setUtilisateur(null);
      }
    }
  };

  const handleLogout = async () => {
    try{
      //Appelle à l'api pour logout l'utilisateur(détruire le token)
      await ApiService.logout();

      //Ferme le menu et redirige vers la page d'accueil
      setIsMenuOpen(false);
      navigation.navigate('Home');
    } catch (e) {
      console.error(e);
    }
  };

  //Pour que les données de l'utilisateur s'affichent au chargement de la page
  useFocusEffect(
    useCallback(() => {
      checkAccesPage()
      afficherInfosUtilisateur();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        {!hideMenuBar && (
          <View style={styles.menuBar}>
            <View style={styles.leftGroup}>
              {showBack && (
                <TouchableOpacity
                  onPress={() => {
                    if (navigation.canGoBack()) {
                      navigation.goBack();
                    } else if (
                      typePageAccess === 'Admin' ||
                      typePageAccess === 'Utilisateurs'
                    ) {
                      navigation.navigate('AdminDashboard' as any);
                    } else if (typePageAccess === 'Employe') {
                      navigation.navigate('EmployeeDashboard' as any);
                    } else {
                      navigation.navigate('Home' as any);
                    }
                  }}
                  style={styles.backBtn}
                  activeOpacity={0.7}
                >
                  <ArrowLeft
                    size={20}
                    color={COLORS.primary}
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => navigation.navigate('Home' as any)}
                activeOpacity={0.8}
                style={styles.logoContainer}
              >
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Titre au centre (optionnel) */}
            {!!title && (
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {title}
                </Text>
              </View>
            )}

            {/* Côté Droit : Utilisateur / Menu déroulant */}
            <View style={styles.menuRightZone}>
              <TouchableOpacity
                style={styles.userBtn}
                onPress={() => setIsMenuOpen(!isMenuOpen)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.userIconCircle,
                    isMenuOpen && styles.userIconCircleOpen,
                  ]}
                >
                  <UserCircle
                    size={22}
                    color={isMenuOpen ? COLORS.primary : COLORS.text}
                  />
                </View>
              </TouchableOpacity>

              {/* Menu Déroulant (Dropdown) dynamique selon le rôle */}
              {isMenuOpen && (
                <View style={styles.dropdownMenu}>
                  {/* Check s'il y a un utilisateur connecté, si non affichage le menu de visiteur */}
                  {utilisateur === null ? (
                    <>
                      <View style={styles.dropdownHeader}>
                        <Text style={styles.dropdownUserRole}>
                          {t('welcome')}
                        </Text>
                        <Text style={styles.dropdownUserName}>
                          {t('visitor')}
                        </Text>
                      </View>
                      <View style={styles.dropdownDivider} />
                      <TouchableOpacity
                        style={styles.dropdownOption}
                        onPress={() => {
                          setIsMenuOpen(false);
                          if (peutSeConnecter) {
                            peutSeConnecter(true);
                          }
                        }}
                      >
                        <View
                          style={[styles.iconCircleSmall, styles.loginIconBg]}
                        >
                          <UserCircle size={16} color="#3b82f6" />
                        </View>
                        <Text style={styles.dropdownOptionText}>
                          {t('login')}
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.dropdownDivider} />

                      <TouchableOpacity
                        style={styles.dropdownOption}
                        onPress={() => {
                          setIsMenuOpen(false);
                          navigation.navigate('Settings');
                        }}
                      >
                        <View style={styles.iconCircleSmall}>
                          <Settings size={16} color={COLORS.text} />
                        </View>
                        <Text style={styles.dropdownOptionText}>
                          {t('settings')}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      {/* Check s'il y a un utilisateur connecté, si oui affichage le menu qui correspond à son role et ses informations */}
                      <View style={styles.dropdownHeader}>
                        <Text style={styles.dropdownUserRole}>
                          {utilisateur.role.id === 2
                            ? t('agent_role')
                            : utilisateur.role.id === 3
                            ? t('admin_role')
                            : t('my_space')}
                        </Text>
                        <Text style={styles.dropdownUserName}>
                          {utilisateur.nom}
                        </Text>
                      </View>

                      <View style={styles.dropdownDivider} />

                      {/* Seuls les utilisateurs réguliers peuvent modifier leurs infos */}
                      <>
                        <TouchableOpacity
                          style={styles.dropdownOption}
                          onPress={() => {
                            setIsMenuOpen(false);
                            navigation.navigate('Profile');
                          }}
                        >
                          <View style={styles.iconCircleSmall}>
                            <User size={16} color={COLORS.text} />
                          </View>
                          <Text style={styles.dropdownOptionText}>
                            {t('my_profile')}
                          </Text>
                        </TouchableOpacity>

                        <View style={styles.dropdownDivider} />
                      </>

                      <TouchableOpacity
                        style={styles.dropdownOption}
                        onPress={() => {
                          setIsMenuOpen(false);
                          navigation.navigate('Settings');
                        }}
                      >
                        <View style={styles.iconCircleSmall}>
                          <Settings size={16} color={COLORS.text} />
                        </View>
                        <Text style={styles.dropdownOptionText}>
                          {t('settings')}
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.dropdownDivider} />

                      <TouchableOpacity
                        style={[styles.dropdownOption, styles.logoutOption]}
                        onPress={handleLogout}
                      >
                        <View
                          style={[styles.iconCircleSmall, styles.logoutIconBg]}
                        >
                          <LogOut size={16} color={COLORS.primary} />
                        </View>
                        <Text
                          style={[styles.dropdownOptionText, styles.logoutText]}
                        >
                          {t('logout')}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        <Content
          style={[styles.container, style]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={scrollable ? styles.flexGrow1 : undefined}
        >
          {children}
        </Content>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (COLORS: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background, 
  },
  menuBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    height: 60,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 1000, // Crucial pour Android
    elevation: 10, // Crucial pour Android
    overflow: 'visible', // Pour permettre au dropdown de dépasser
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  logoContainer: {
    height: 35,
    width: 100,
    justifyContent: 'center',
  },
  logo: {
    height: '100%',
    width: '100%',
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  userBtn: {
    padding: SPACING.xs,
  },
  userIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  // DROPDOWN MENU STYLES
  dropdownMenu: {
    position: 'absolute',
    top: 45, // Un peu plus haut pour être collé au bouton
    right: 0,
    width: 220, // Légèrement plus large pour le contenu
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
      }
    }),
    zIndex: 5000,
  },
  dropdownHeader: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: 4,
  },
  dropdownUserRole: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dropdownUserName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    gap: 12,
  },
  iconCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownOptionText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
    marginHorizontal: SPACING.md,
  },
  logoutOption: {
    marginTop: 2,
  },
  flex1: { flex: 1 },
  menuRightZone: { zIndex: 2000 },
  userIconCircleOpen: { borderColor: COLORS.primary },
  loginIconBg: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  logoutIconBg: { backgroundColor: 'rgba(220, 38, 38, 0.1)' },
  logoutText: { color: COLORS.primary },
  flexGrow1: { flexGrow: 1 },
});

export default ScreenContainer;


