import React, { useState, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { getScale } from '../../utils/responsive';
import { SPACING } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import Card from '../../components/common/Card';
import ScreenContainer from '../../components/common/ScreenContainer';
import Input from '../../components/common/Input';
import {
  Search,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react-native';
import { ApiService } from '../../api/api';
import { Contravention } from '../../types/database';
import { useFocusEffect } from '@react-navigation/native';
import TicketCard from '../../components/common/TicketCard';

const MyTicketsScreen = ({ navigation, route }: any) => {
  const { COLORS, t } = useSettings();
  const { width } = useWindowDimensions();
  const styles = getStyles(COLORS, width);
  const [plaque, setPlaque] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [contraventions, setContraventions] = useState<Contravention[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [afficherErreur, setAfficherErreur] = useState(false);


  const verifNumeroContravention = () => {
    const regexNumero = /^[A-Z]{3,}-\d{6}$/
    return regexNumero.test(plaque);
  }
  
  const handleRechercheParPlaque = async () => {
    //Appelle la vérification du numéro avant de continuer
    if (!verifNumeroContravention()) return;

    //Pour afficher le chargement en attendant les données
    setIsSearching(true);
    setHasSearched(false);

    try {
      //Appel à l'api pour obtenir la contravention
      const contravention = await ApiService.getContraventionsParNumero(plaque);

      setContraventions([contravention]);
      setAfficherErreur(false)
      setHasSearched(true);

    } catch (e) {
      console.error(e);
      //S'il y a une erreur, met l'affichage à celui d'une erreur
      setContraventions([])
      setAfficherErreur(true)
    } finally {
      setIsSearching(false);
    }
  };

  //Méthode pour afficher les contraventions de l'utilisateur connecté
  const afficherContraventionsUtilisateur = async () => {
    try{
      //Appelle à l'api pour obtenir les contraventions de l'utilisateur
      const listeContraventions = await ApiService.getContraventionsUtilisateur();

      //Place les contraventions obtenues dans le state
      setContraventions(listeContraventions);

    } catch (e) {
      console.error(e);
    }
  };

  //S'assure que l'affichage est appelée au chargement de la page et lorsqu'il y a un rechargement
  useFocusEffect(
    useCallback(() => {
      const initialTicket = route.params?.initialTicketNumber;
      if (initialTicket) {
        setPlaque(initialTicket);
        // On force la recherche
        ApiService.getContraventionsParNumero(initialTicket).then(res => {
          setContraventions([res]);
          setHasSearched(true);
        }).catch(() => {
          setContraventions([]);
          setAfficherErreur(true);
        });
      } else {
        afficherContraventionsUtilisateur();
      }
    }, [route.params?.initialTicketNumber])
  );

  // Calcul des sommes dues uniquement sur les tickets impayés (déjà filtrés)
  //const contraventionNonPayees = contravention?.etat_contravention === 'impayee';
  //const totalAPayer = contraventionNonPayees.reduce((acc, contravention) => acc + Number(contravention.montant), 0);

  return (
    <ScreenContainer scrollable title={t('my_tickets_space')} typePageAccess={"Utilisateurs"} withBackButton={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('my_tickets_title')}</Text>
          <Text style={styles.subtitle}>{t('my_tickets_subtitle')}</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Input
            placeholder={t('my_tickets_number_ph')}
            value={plaque}
            onChangeText={setPlaque}
            autoCapitalize="characters"
            containerStyle={styles.searchInput}
            style={styles.searchInputPadding}
          />
          <TouchableOpacity 
            style={[styles.searchBtn, !verifNumeroContravention() && styles.searchBtnDisabled]}
            onPress={handleRechercheParPlaque}
            disabled={isSearching || plaque.trim().length < 3}
          >
            {isSearching ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Search color="#FFFFFF" size={22} />}
          </TouchableOpacity>
        </View>
      </View>

      {contraventions?.length === 0 ? (
        <View>
          {!hasSearched && !isSearching && (
            <View>
              {afficherErreur ? (
                <Card style={styles.infoCard}>
                  <View style={styles.infoIconCircle}>
                    <Search color={COLORS.primary} size={32} opacity={0.5} />
                  </View>
                  <Text style={[styles.infoTitle, styles.infoTitlePrimary]}>{t('my_tickets_error')}</Text>
                  <Text style={styles.infoDesc}>
                    Veuillez entrer un numéro de contravention valide (Ex: GES-000001).
                  </Text>
                </Card>
              ) : (
                <Card style={styles.infoCard}>
                  <View style={styles.infoIconCircle}>
                    <Search color={COLORS.primary} size={32} opacity={0.5} />
                  </View>
                  <Text style={styles.infoTitle}>{t('my_tickets_verify')}</Text>
                  <Text style={styles.infoDesc}>
                    En saisissant votre numéro de contravention, vous accédez aux informations de celle-ci.
                  </Text>
                </Card>
              )}
            </View>

          )}
        </View>
      ) : (
        contraventions?.map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket} showPayButton={true} onPay={() => Linking.openURL("https://gesparc.ca/#payer")} />
        )))}

      <View style={styles.supportActions}>
        <Text style={styles.supportLabel}>{t('my_tickets_help')}</Text>
        <View style={styles.supportGrid}>
          <TouchableOpacity style={styles.supportItem} onPress={() => Linking.openURL("https://gesparc.ca/nous-joindre/")}>
            <AlertCircle color={COLORS.textLight} size={20} />
            <Text style={styles.supportBtnText}>Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

const getStyles = (COLORS: any, width: number) => {
  const scale = getScale(width);

  return StyleSheet.create({
  header: {
    marginBottom: SPACING.xl * scale,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28 * scale,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15 * scale,
    color: COLORS.textLight,
    lineHeight: 20 * scale,
    opacity: 0.6,
  },
  searchSection: {
    marginBottom: SPACING.lg * scale,
  },
  searchBox: {
    position: 'relative',
    width: '100%',
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  searchBtn: {
    position: 'absolute',
    right: 5 * scale,
    top: 5 * scale,
    width: 50 * scale,
    height: 45 * scale,
    borderRadius: 10 * scale,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  searchBtnDisabled: {
    opacity: 0.5,
  },
  ticketCard: {
    padding: SPACING.md * scale,
    marginBottom: SPACING.sm * scale,
  },
  ticketMain: {
    flexDirection: 'row',
    gap: 12 * scale,
  },
  ticketIconBox: {
    width: 44 * scale,
    height: 44 * scale,
    borderRadius: 12 * scale,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketInfo: {
    flex: 1,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * scale,
    marginBottom: 4 * scale,
  },
  ticketId: {
    color: COLORS.text,
    fontSize: 13 * scale,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 6 * scale,
    paddingVertical: 2 * scale,
    borderRadius: 6 * scale,
  },
  statusUnpaid: {
    backgroundColor: COLORS.primary + '20',
  },
  statusPaid: {
    backgroundColor: '#22c55e20',
  },
  statusText: {
    fontSize: 9 * scale,
    fontWeight: '900',
    color: COLORS.text,
  },
  reasonText: {
    color: COLORS.text,
    fontSize: 15 * scale,
    fontWeight: '600',
    marginBottom: 6 * scale,
  },
  detailBox: {
    flexDirection: 'row',
    gap: 12 * scale,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 * scale,
  },
  detailText: {
    color: COLORS.textLight,
    fontSize: 11 * scale,
    opacity: 0.7,
  },
  priceColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  ticketPrice: {
    color: COLORS.text,
    fontSize: 18 * scale,
    fontWeight: '800',
  },
  smallPayBtn: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 10 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 6 * scale,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  smallPayText: {
    color: COLORS.text,
    fontSize: 11 * scale,
    fontWeight: '700',
  },
  infoCard: {
    padding: SPACING.xl * scale,
    alignItems: 'center',
    marginTop: SPACING.md * scale,
  },
  infoIconCircle: {
    width: 64 * scale,
    height: 64 * scale,
    borderRadius: 32 * scale,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg * scale,
  },
  infoTitle: {
    color: COLORS.text,
    fontSize: 18 * scale,
    fontWeight: '800',
    marginBottom: 8 * scale,
  },
  infoDesc: {
    color: COLORS.textLight,
    textAlign: 'center',
    fontSize: 14 * scale,
    lineHeight: 20 * scale,
    opacity: 0.6,
  },
  supportActions: {
    marginTop: 'auto',
    paddingTop: SPACING.xl * scale,
    alignItems: 'center',
  },
  supportLabel: {
    color: COLORS.textLight,
    fontSize: 12 * scale,
    fontWeight: '700',
    marginBottom: SPACING.md * scale,
    opacity: 0.4,
  },
  supportGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 15 * scale,
    padding: 2 * scale,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20 * scale,
    paddingVertical: 10 * scale,
    gap: 8 * scale,
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10 * scale,
  },
  supportBtnText: {
    color: COLORS.textLight,
    fontSize: 13 * scale,
    fontWeight: '600',
  },
  searchInputPadding: { paddingRight: 60 },
  infoTitlePrimary: { color: COLORS.primary },
});
};

export default MyTicketsScreen;


