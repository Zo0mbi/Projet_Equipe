import React, { useRef, useState } from 'react';
import {
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  LayoutRectangle,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SPACING, SIZES } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ScreenContainer from '../../components/common/ScreenContainer';
import { Car, Search, AlertCircle, CheckCircle } from 'lucide-react-native';
import { ApiService } from '../../api/api';
import { Contravention, Vehicule } from '../../types/database';
import { ChevronDown } from 'lucide-react-native';
import TicketCard from '../../components/common/TicketCard';
import { getScale } from '../../utils/responsive';

const PROVINCES = ["QC", "ON", "NB", "NS", "PE", "NL", "MB", "SK", "AB", "BC", "YT", "NT", "NU", "Autre"];

const SearchVehicleScreen = ({ navigation }: any) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { COLORS, t } = useSettings();
  const styles = getStyles(COLORS, width);
  const [plaque, setPlaque] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [donneesVehicule, setDonneesVehicule] = useState<Vehicule | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [afficherErreur, setAfficherErreur] = useState(false);

  const [contraventions, setContraventions] = useState<Contravention[] | null>(null);

  const [provinceChoisie, setProvinceChoisie] = useState(PROVINCES[0]);
  const [provinceEstOuvert, setProvinceEstOuvert] = useState(false);

  const [dropdownLayout, setDropdownLayout] = useState<LayoutRectangle | null>(null);
  const dropdownRef = useRef<View>(null);

//Méthode pour afficher les informations de véhicule et les contraventions dépendamment de la plaque entrée
  const handleRechercheParPlaque = async () => {
    //S'assure que la plaque ai la bonne taille
    if (plaque.trim().length < 2) return;

    //Pour afficher le chargement en attendant les données
    setIsSearching(true);
    setHasSearched(false);

    try {
      //Appel à l'api pour obtenir les contraventions
      const listeContraventions = await ApiService.getContraventionsParPlaque(
        plaque,
        provinceChoisie
      );

      //Place les contraventions obtenues dans le state
      setContraventions(listeContraventions);

      //Si des contraventions sont trouvées, place les informations du véhicule dans le state
      if (listeContraventions.length > 0) {
        setDonneesVehicule(listeContraventions[0].vehicule);
      } else {
        setDonneesVehicule(null);
      }

      //Complète la recherche
      setHasSearched(true);
      setAfficherErreur(false);

    } catch (e) {
      console.error(e);
      setContraventions([]);
      setAfficherErreur(true);
    } finally {
      //Complète la recherche
      setIsSearching(false);
    }
  };

  const getUnpaidCount = () => contraventions?.filter(t => t.etat_contravention === 'impayee').length || 0;

  const isEditable = (dateStr?: string) => {
    if (!dateStr) return false;
    // Le backend renvoie une date "naïve" en heure de l'Est (EDT). On ajoute l'offset -04:00 pour la parser correctement en local.
    const dateWithTz = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : `${dateStr}-04:00`;
    const createdDate = new Date(dateWithTz);
    const now = new Date();
    const diffInMinutes = (now.getTime() - createdDate.getTime()) / (1000 * 60);
    return diffInMinutes >= 0 && diffInMinutes <= 30;
  };

  const handleCancel = (ticket: Contravention) => {
    Alert.alert(
      'Annuler la contravention',
      'Êtes-vous sûr de vouloir annuler cette contravention ? Cette action est irréversible.',
      [
        { text: 'Non', style: 'cancel' },
        { 
          text: 'Oui, annuler', 
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.updateContravention(ticket.numero_contravention, {
                etat_contravention: 'annulee'
              });
              Alert.alert('Succès', 'La contravention a été annulée.');
              handleRechercheParPlaque();
            } catch (e: any) {
              console.error(e);
              Alert.alert('Erreur', 'Impossible d\'annuler la contravention.');
            }
          }
        }
      ]
    );
  };

  return (
    <ScreenContainer scrollable typePageAccess={"Employe"} withBackButton={true}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('search_vehicle_title')}</Text>
        <Text style={styles.subtitle}>{t('search_vehicle_subtitle')}</Text>
      </View>
      
      <Card style={styles.searchCard}>
        <View style={[styles.searchRow, isMobile ? styles.searchRowMobile : styles.searchRowDesktop]}>
          <Input
            placeholder={t('ticket_plate_ex')}
            value={plaque}
            onChangeText={setPlaque}
            autoCapitalize="characters"
            containerStyle={styles.searchInputContainer}
          />
          <View style={[styles.section, isMobile ? styles.sectionMobile : styles.sectionDesktop]}>
            <TouchableOpacity
              style={[styles.dropdownHeader, provinceEstOuvert && styles.dropdownHeaderOpen]}
              onPress={() => {
                if (!provinceEstOuvert) {
                  dropdownRef.current?.measureInWindow((x, y, width, height) => {
                    setDropdownLayout({ x, y, width, height });
                    setProvinceEstOuvert(true);
                  });
                } else {
                  setProvinceEstOuvert(false);
                }
              }}
              ref={dropdownRef}
              activeOpacity={0.8}
            >
              <Text style={styles.selectedText}>{provinceChoisie}</Text>
              { }
              <ChevronDown
                size={20}
                color={COLORS.textLight}
                style={{ transform: [{ rotate: provinceEstOuvert ? '180deg' : '0deg' }] as any }}
              />
            </TouchableOpacity>

            {provinceEstOuvert && dropdownLayout &&(
              <Modal transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => setProvinceEstOuvert(false)}>
                  <View style={styles.flex1}>
                    { }
                    <View style={[styles.dropdownAbsolute, { top: dropdownLayout.y + dropdownLayout.height, left: dropdownLayout?.x, width: dropdownLayout?.width }]}>
                      <View style={styles.dropdownList}>
                        <ScrollView style={styles.scrollMaxHeight150}>
                          {PROVINCES.map((province) => (
                            <TouchableOpacity
                              key={province}
                              style={[styles.dropdownItem, provinceChoisie === province && styles.dropdownItemActive]}
                              onPress={() => {
                                setProvinceChoisie(province);
                                setProvinceEstOuvert(false);
                              }}
                            >
                              <Text style={[styles.dropdownText, provinceChoisie === province && styles.dropdownTextActive]}>
                                {province}
                              </Text>

                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            )}
          </View>
        </View>
        <Button 
          title={t('search_btn')} 
          onPress={handleRechercheParPlaque}
          disabled={isSearching || plaque.trim().length < 3}
          style={styles.searchBtn}
        />
      </Card>

      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('search_db')}</Text>
        </View>
      )}

      {!isSearching && hasSearched && (
        <View style={styles.resultsContainer}>
          
          <Card style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <View style={styles.vehicleIconCircle}>
                <Car color="#FFFFFF" size={24} />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.plateText}>{donneesVehicule?.numero_plaque.toUpperCase()}</Text>
                <Text style={styles.brandText}>{donneesVehicule?.marque} {donneesVehicule?.modele}</Text>
              </View>
            </View>

            <View style={styles.statusBanner}>
              {getUnpaidCount() > 0 ? (
                <View style={[styles.statusBox, styles.statusDanger]}>
                  <AlertCircle color="#ef4444" size={20} />
                  <Text style={styles.statusTextDanger}>{getUnpaidCount()} {t('tickets').toUpperCase()} {t('unpaid').toUpperCase()}</Text>
                </View>
              ) : (
                <View style={[styles.statusBox, styles.statusSuccess]}>
                  <CheckCircle color="#22c55e" size={20} />
                  <Text style={styles.statusTextSuccess}>{t('search_no_unpaid')}</Text>
                </View>
              )}
            </View>
          </Card>

          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>{t('search_history')}</Text>
            
            {contraventions?.length === 0 ? (
              <View style={styles.emptyHistory}>
                <CheckCircle color={COLORS.textLight} size={32} opacity={0.3} />
                <Text style={styles.emptyHistoryText}>{t('search_clean')}</Text>
              </View>
            ) : (
              contraventions?.map((ticket, index) => (
                <TicketCard
                  key={ticket.id || `ticket-${index}`}
                  ticket={ticket}
                  showPayButton={false}
                  showEditButton={isEditable(ticket.date_entrer)}
                  showCancelButton={isEditable(ticket.date_entrer)}
                  onEdit={() => navigation.navigate('EditTicket', { ticket })}
                  onCancel={() => handleCancel(ticket)}
                />
              ))
            )}
          </View>

        </View>
      )}

      {!isSearching && !hasSearched && (
        <View>
          {afficherErreur ? (
            <Card style={styles.infoCard}>
              <View style={styles.infoContainer}>
                <Search size={48} color={COLORS.primary} opacity={0.8} />
                <Text style={[styles.infoTitle, styles.infoTitlePrimary]}>{t('search_not_found')}</Text>
              </View>
            </Card>
          ) : (
            <Card style={styles.infoCard}>
              <View style={styles.infoContainer}>
                <Search size={48} color={COLORS.textLight} opacity={0.8} />
                <Text style={[styles.infoTitle, styles.infoTitleLight]}>{t('search_prompt')}</Text>
              </View>
            </Card>
          )}
        </View>
      )}
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
  subtitle: {
    fontSize: 16 * scale,
    color: COLORS.textLight,
    opacity: 0.6,
  },
  searchCard: {
    padding: SPACING.lg * scale,
    marginBottom: SPACING.xl * scale,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md * scale,
    marginBottom: SPACING.md * scale,
  },
  searchBtn: {
    height: 55 * scale,
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl * 2 * scale,
    gap: SPACING.md * scale,
  },
  loadingText: {
    color: COLORS.textLight,
    fontSize: 14 * scale,
    fontWeight: '600',
  },
  infoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl * 2 * scale,
    gap: SPACING.md * scale,
  },
  info: {
    color: COLORS.textLight,
    textAlign: 'center',
    fontSize: 14 * scale,
    lineHeight: 20 * scale,
    opacity: 0.5,
  },
  resultsContainer: {
    paddingBottom: SPACING.xl * 2 * scale,
  },
  vehicleCard: {
    padding: SPACING.lg * scale,
    marginBottom: SPACING.xl * scale,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md * scale,
    marginBottom: SPACING.lg * scale,
  },
  vehicleIconCircle: {
    width: 50 * scale,
    height: 50 * scale,
    borderRadius: 25 * scale,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  plateText: {
    fontSize: 22 * scale,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 1,
  },
  brandText: {
    fontSize: 14 * scale,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  statusBanner: {
    marginTop: SPACING.xs * scale,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md * scale,
    borderRadius: SIZES.radius * scale,
    gap: SPACING.sm * scale,
    borderWidth: 1,
  },
  statusDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statusTextDanger: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 12 * scale,
  },
  statusTextSuccess: {
    color: '#22c55e',
    fontWeight: '800',
    fontSize: 12 * scale,
  },
  historySection: {
    marginTop: SPACING.sm * scale,
  },
  historyTitle: {
    fontSize: 14 * scale,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md * scale,
    paddingHorizontal: SPACING.xs * scale,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl * scale,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius * scale,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm * scale,
  },
  emptyHistoryText: {
    color: COLORS.textLight,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  ticketCard: {
    padding: SPACING.lg * scale,
    marginBottom: SPACING.md * scale,
    borderLeftWidth: 4 * scale,
    borderLeftColor: COLORS.border,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm * scale,
  },
  ticketId: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 14 * scale,
  },
  badge: {
    paddingHorizontal: 8 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 10 * scale,
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  badgeText: {
    fontSize: 10 * scale,
    fontWeight: '900',
  },
  badgeTextSuccess: {
    color: '#22c55e',
  },
  badgeTextDanger: {
    color: '#ef4444',
  },
  ticketReason: {
    fontSize: 16 * scale,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md * scale,
  },
  ticketDetails: {
    gap: 6 * scale,
    marginBottom: SPACING.md * scale,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs * scale,
  },
  detailText: {
    color: COLORS.textLight,
    fontSize: 13 * scale,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm * scale,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  amountLabel: {
    color: COLORS.textLight,
    fontSize: 14 * scale,
  },
  amountValue: {
    color: COLORS.text,
    fontSize: 18 * scale,
    fontWeight: '900',
  },
  infoCard: {
    padding: SPACING.xl * scale,
    alignItems: 'center',
    marginTop: SPACING.md * scale,
  },
  infoTitle: {
    color: COLORS.text,
    fontSize: 18 * scale,
    fontWeight: '800',
    marginBottom: 8 * scale,
  },
  infoTitlePrimary: { color: COLORS.primary, opacity: 0.8 },
  infoTitleLight: { color: COLORS.textLight, opacity: 0.8 },
  searchInputContainer: { flex: 1, marginBottom: 0 },
  searchRowMobile: { alignItems: 'stretch', flexDirection: 'column' },
  searchRowDesktop: { alignItems: 'center', flexDirection: 'row' },
  sectionMobile: { position: 'relative', alignSelf: 'stretch' },
  sectionDesktop: { position: 'relative', alignSelf: 'center' },
  flex1: { flex: 1 },
  dropdownAbsolute: { position: 'absolute' },
  scrollMaxHeight150: { maxHeight: 150 },
  section: {
    position:"relative",
    zIndex:100,
    elevation:5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: SPACING.md * scale,
    borderRadius: SIZES.radius * scale,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownHeaderOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: COLORS.primary,
  },
  selectedText: {
    color: COLORS.text,
    fontSize: 15 * scale,
    fontWeight: '600',
  },
  dropdownList: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.primary,
    borderBottomLeftRadius: SIZES.radius * scale,
    borderBottomRightRadius: SIZES.radius * scale,
    overflow: 'hidden',
    width:"100%"
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md * scale,
    gap: 12 * scale,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primary + '10',
  },
  dropdownText: {
    color: COLORS.textLight,
    flex: 1,
    fontSize: 14 * scale,
  },
  dropdownTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
});
};

export default SearchVehicleScreen;
