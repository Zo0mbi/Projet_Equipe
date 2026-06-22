import React, { useState, useCallback, useRef } from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TouchableWithoutFeedback, LayoutRectangle,
  useWindowDimensions,
} from 'react-native';
import { getScale } from '../../utils/responsive';
import { SPACING, SIZES } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import Card from '../../components/common/Card';
import ScreenContainer from '../../components/common/ScreenContainer';
import {
  PlusCircle,
  Search,
  TrendingUp,
  Car,
  FileText,
  ChevronDown,
  Check,
} from 'lucide-react-native';

import { ApiService } from '../../api/api';
import { formatEmplacement } from '../../utils/ticket';
import {
  Contravention,
  EmplacementContravention,
  RaisonContravention,
} from '../../types/database';
import { useFocusEffect } from '@react-navigation/native';
import TicketCard from '../../components/common/TicketCard';
import Input from '../../components/common/Input';
import StyledDateTimePicker from '../../components/common/StyledDateTimePicker';
import Button from '../../components/common/Button';
import { AffichagePDF } from '../../utils/AffichagePDF';

const raisonPersonnaliseeTexte = "(+) Motif personnalisé"

const regexVerifPlaque = /^[A-Za-z0-9]{2,7}$/
const regexVerifMontant = /^\d+([.,]\d+)?$/

const PROVINCES = ["QC", "ON", "NB", "NS", "PE", "NL", "MB", "SK", "AB", "BC", "YT", "NT", "NU", "Autre"];

const DashboardEmployeeScreen = ({ navigation }: any) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { COLORS, t } = useSettings();
  const styles = getStyles(COLORS, width);

  const [user, setUser] = useState<any>(null);
  const [contraventions, setContraventions] = useState<Contravention[] | null>(null);

  const [plaque, setPlaque] = useState('');
  const [afficherPopup, setAfficherPopup] = useState(false);

  const [marque, setMarque] = useState("")
  const [modele, setModele] = useState("")
  const [montant, setMontant] = useState("");

  const [numeroContravention, setNumeroContravention] = useState("");

  const [raisonCustom, setRaisonCustom] = useState("");
  const [date, setDate] = useState(new Date());

  const [emplacementSelectionnee, setEmplacementSelectionnee] = useState<EmplacementContravention | null>(null)
  const [raisonSelectionnee, setRaisonSelectionnee] = useState<RaisonContravention| null>(null)

  const [raisonEstOuvert, setRaisonEstOuvert] = useState(false);
  const [emplacementEstOuvert, setEmplacementEstOuvert] = useState(false);

  const [emplacements, setEmplacements] = useState<EmplacementContravention[] | null>(null);
  const [raisons, setRaisons] = useState<RaisonContravention[] | null>(null);

  const [contraventionCreee, setContraventionCreee] = useState<Contravention | null>(null);
  const [afficherPDF, setAfficherPDF] = useState(false);

  const [estAvertissement, setEstAvertissement] = useState(false);

  const [provinceChoisie, setProvinceChoisie] = useState(PROVINCES[0]);
  const [provinceEstOuvert, setProvinceEstOuvert] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState<LayoutRectangle | null>(null);
  const dropdownRef = useRef<View>(null);

  const handleRemplirFormulaireModifierContravention = async (contravention: Contravention) => {
    try {
      await getEmplacements(contravention.emplacement.nom)
      await getRaisons(contravention)

      if(contravention.etat_contravention === "avertissement"){
        setEstAvertissement(true)
      }else{
        setEstAvertissement(false)
      }

      if(contravention){
        setMarque(contravention.vehicule.marque ?? "")
        setModele(contravention.vehicule.modele ?? "")
        setPlaque(contravention.vehicule.numero_plaque ?? "")
        setNumeroContravention(contravention.numero_contravention)
        setProvinceChoisie(contravention.vehicule.province)
      }

      // Générer date/heure actuelle
      setDate(new Date(contravention.date_entrer));

      setAfficherPopup(true);
    } catch (e: any) {
      console.error(e);
      Alert.alert(t('error'), t('err_generic'));
    }
  };


  const getEmplacements = async (emplacement: string) => {
    try{
      //Appelle à l'api pour obtenir les contraventions de l'utilisateur
      const listeEmplacements = await ApiService.getEmplacementsForForm();

      //Place les contraventions obtenues dans le state
      setEmplacements(listeEmplacements);

      if (listeEmplacements.length > 0) {
        for (let i = 0; i < listeEmplacements.length; i++) {
          if(listeEmplacements[i].nom === emplacement){
            setEmplacementSelectionnee(listeEmplacements[i])
          }
        }
      } else {
        setEmplacementSelectionnee(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getRaisons = async (contravention: Contravention) => {
    try{
      //Appelle à l'api pour obtenir les contraventions de l'utilisateur
      const listeRaisons = await ApiService.getRaisonsForForm();

      //Place la liste de raisons obtenue dans le state et ajoute l'option de raison personnalisée
      const raisonCustomOption = {id: 1000, nom: raisonPersonnaliseeTexte, montant: 0}
      setRaisons([...(listeRaisons ?? []), raisonCustomOption]);

      if (listeRaisons.length > 0) {
        if(contravention.raison_custom){
          setRaisonSelectionnee(raisonCustomOption)
          setRaisonCustom(contravention.raison_custom)
        }else{
          for (let i = 0; i < listeRaisons.length; i++) {
            if(listeRaisons[i].nom === contravention.raison_contravention?.nom){
              setRaisonSelectionnee(listeRaisons[i])
            }
          }
        }
        setMontant(contravention.montant.toString())
      } else {
        setRaisonSelectionnee(null);
      }

    } catch (e) {
      console.error(e);
    }
  };

  const handleModifierContravention = async () => {
    try {
      const utilisateur = await ApiService.getMe();

      if(!emplacementSelectionnee) return;
      if(!raisonSelectionnee) return;

      const contravention = await ApiService.updateContravention(numeroContravention, {
        attribuer_par: utilisateur.id,
        emplacement_id: emplacementSelectionnee.id,
        etat_contravention: estAvertissement ? "avertissement" : "impayee",
        montant: estAvertissement ? 0 : Number(montant),
        raisons_id: (raisonSelectionnee.id !== 1000 ? raisonSelectionnee.id : undefined),
        raison_custom: (raisonSelectionnee.id === 1000 && raisonCustom ? raisonCustom : undefined),
        vehicule: {
          marque: marque || "",
          modele: modele || "",
          numero_plaque: plaque,
          province: provinceChoisie,
        },
      });

      setContraventionCreee(contravention);
      setAfficherPopup(false);
      setAfficherPDF(true);

    } catch {
      Alert.alert(t('error'), t('err_generic'));
    }
  };

  const verifPlaque = () => {
    //Logique de vérification
    return regexVerifPlaque.test(plaque)
  };

  const verifMarque = () => {
    //S'assure que le champ n'est pas undefined
    if(!marque) return false
    //Logique de vérification
    return marque.length > 0
  };

  const verifModele = () => {
    //S'assure que le champ n'est pas undefined
    if(!modele) return false
    //Logique de vérification
    return modele.length > 0
  };

  const verifRaisonCustom = () => {
    //S'assure que le champ n'est pas undefined
    if(!raisonCustom) return false
    //Logique de vérification
    return raisonCustom.length > 0
  };

  const verifMontant = () => {
    //S'assure que le champ n'est pas undefined et qu'il respecte la format demandé
    if(!montant || !regexVerifMontant.test(montant) && !estAvertissement) return false
    //S'assure que le montant entré est plus grand que 0
    const montantFloat = parseFloat(montant.replace(',', '.'));
    return montantFloat > 0 || estAvertissement;
  };

  //Boolean pour vérifier si le formulaire est valide, appele tout les autres verifs
  const verifFormulaireValide = (
    verifPlaque() &&
    verifMarque() &&
    verifModele() &&
    verifMontant() &&
    (
      raisonSelectionnee?.nom !== raisonPersonnaliseeTexte ||
      verifRaisonCustom()
    )
  );
  
  const isEditable = (dateStr?: string) => {
    if (!dateStr) return false;
    // Le backend renvoie une date "naïve" en heure de l'Est (EDT). On ajoute l'offset -04:00 pour la parser correctement en local.
    const dateWithTz = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : `${dateStr}-04:00`;
    const createdDate = new Date(dateWithTz);
    const now = new Date();
    const diffInMinutes = (now.getTime() - createdDate.getTime()) / (1000 * 60);
    return diffInMinutes >= 0 && diffInMinutes <= 30;
  };

  const handleCancel = async (contravention: Contravention) => {
    await ApiService.changerEtatContravention(contravention.numero_contravention, {
      etat_contravention: "annulee",
    });

    fetchData()

    Alert.alert(
      t('cancel') + ' ' + t('ticket'),
      t('confirm_delete') + ' ' + t('action_irreversible'),
      [
        { text: t('no'), style: 'cancel' },
        {
          text: t('yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.updateContravention(contravention.numero_contravention, {
                etat_contravention: 'annulee'
              });
              Alert.alert(t('success'), t('cancelled') + '.');
              fetchData();
            } catch (e: any) {
              console.error(e);
              Alert.alert(t('error'), t('err_generic'));
            }
          }
        }
      ]
    );
  };

  const fetchData = async () => {
    try {
      const [u, c] = await Promise.all([
        ApiService.getMe(),
        ApiService.getContraventionsRecentes()
      ]);
      setUser(u);
      setContraventions(c);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );


  return (
    <ScreenContainer scrollable typePageAccess="Employe" withBackButton={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('dashboard')}</Text>
          <Text style={styles.subtitle}>{t('emp_subtitle')}</Text>
        </View>
        {user?.role?.id === 3 && (
          <TouchableOpacity 
            style={styles.adminBackBtn}
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <TrendingUp size={16} color={COLORS.primary} />
            <Text style={styles.adminBackText}>{t('emp_console_admin')}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={[styles.grid, isMobile && styles.gridMobile]}>
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => navigation.navigate('CreateTicket')}
          activeOpacity={0.7}
        >
          <Card style={styles.cardInner}>
            <View style={[styles.iconBox, styles.iconBoxRed]}>
              <PlusCircle color={COLORS.primary} size={28} />
            </View>
            <Text style={styles.cardTitle}>{t('emp_title')}</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => navigation.navigate('SearchVehicle')}
          activeOpacity={0.7}
        >
          <Card style={styles.cardInner}>
            <View style={[styles.iconBox, styles.iconBoxBlue]}>
              <Search color="#3b82f6" size={28} />
            </View>
            <Text style={styles.cardTitle}>{t('emp_search_vehicle')}</Text>
          </Card>
        </TouchableOpacity>
      </View>

      <Card style={styles.recentCard}>
        <Text style={styles.sectionTitle}>{t('emp_recent')}</Text>

          {contraventions?.length === 0 ? (
            <View style={styles.emptyState}>
              <Car color={COLORS.textLight} size={40} opacity={0.2} />
              <Text style={styles.emptyText}>{t('emp_no_activity')}</Text>
            </View>
            ) : (
            contraventions?.map(ticket => (
              <TicketCard
                key={ticket.numero_contravention}
                ticket={ticket}
                showEditButton={isEditable(ticket.date_entrer)}
                showCancelButton={isEditable(ticket.date_entrer)}
                onEdit={() => handleRemplirFormulaireModifierContravention(ticket)}
                onCancel={() => handleCancel(ticket)}
              />
          )))}
      </Card>
      <Modal
        visible={afficherPopup}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAfficherPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('ticket_reason_detail')}</Text>
              <TouchableOpacity onPress={() => setAfficherPopup(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Infos Véhicule (Auto-remplis) */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('ticket_vehicle_detected')}</Text>
                <View style={[styles.infoBadge]}>
                  <View style={isMobile ? styles.vehicleRowMobile : styles.vehicleRowDesktop}>
                    <View style={styles.flex1}>
                      <Input
                        value={marque}
                        onChangeText={setMarque}
                        placeholder={t('ticket_vehicle_make')}
                        style={styles.inputHeight55}
                        error={verifMarque() ? undefined : t('ticket_make_error')}
                      />
                    </View>

                    <View style={styles.flex1}>
                      <Input
                        value={modele}
                        onChangeText={setModele}
                        placeholder={t('ticket_model')}
                        style={styles.inputHeight55}
                        error={verifModele() ? undefined : t('ticket_model_error')}
                      />
                    </View>

                    <View style={[styles.section, styles.sectionRelative]}>
                      <TouchableOpacity
                        style={[
                          styles.dropdownHeader,
                          provinceEstOuvert && styles.dropdownHeaderOpen,
                          styles.dropdownHeight55,
                        ]}
                        onPress={() => {
                          if (!provinceEstOuvert) {
                            dropdownRef.current?.measureInWindow((x, y, w, h) => {
                              setDropdownLayout({ x, y, width: w, height: h });
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
                          style={{
                            transform: [{ rotate: provinceEstOuvert ? '180deg' : '0deg' }] as any,
                          }}
                        />
                      </TouchableOpacity>

                      {provinceEstOuvert && dropdownLayout && (
                        <Modal transparent animationType="fade">
                          <TouchableWithoutFeedback onPress={() => setProvinceEstOuvert(false)}>
                            <View style={styles.flex1}>
                                { }
                                <View
                                  style={[
                                    styles.dropdownAbsolute,
                                    {
                                      top: dropdownLayout.y + dropdownLayout.height,
                                      left: dropdownLayout?.x,
                                      width: dropdownLayout?.width,
                                    },
                                  ]}
                                >
                                <View style={styles.dropdownList}>
                                  <ScrollView style={styles.scrollMaxHeight150}>
                                    {PROVINCES.map((province) => (
                                      <TouchableOpacity
                                        key={province}
                                        style={[
                                          styles.dropdownItem,
                                          provinceChoisie === province && styles.dropdownItemActive,
                                        ]}
                                        onPress={() => {
                                          setProvinceChoisie(province);
                                          setProvinceEstOuvert(false);
                                        }}
                                      >
                                        <Text
                                          style={[
                                            styles.dropdownText,
                                            provinceChoisie === province && styles.dropdownTextActive,
                                          ]}
                                        >
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
                    <Text style={[styles.plateBadgeText, styles.plateMargin]}>{plaque.toUpperCase()}</Text>
                  </View>
                </View>
              </View>



              {/* Emplacement */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('location').toUpperCase()}</Text>
                <TouchableOpacity
                  style={[styles.dropdownHeader, emplacementEstOuvert && styles.dropdownHeaderOpen]}
                  onPress={() => setEmplacementEstOuvert(!emplacementEstOuvert)}
                  activeOpacity={0.8}
                >
                  <View style={styles.dropdownHeaderLeft}>
                    <FileText size={18} color={COLORS.primary} />
                    <Text style={styles.selectedText}>{formatEmplacement(emplacementSelectionnee)}</Text>
                  </View>
                  { }
                  <ChevronDown
                    size={20}
                    color={COLORS.textLight}
                    style={{ transform: [{ rotate: emplacementEstOuvert ? '180deg' : '0deg' }] }}
                  />
                </TouchableOpacity>

                {emplacementEstOuvert && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.scrollMaxHeight250} nestedScrollEnabled>
                      {emplacements?.map((r) => (
                        <TouchableOpacity
                          key={r.id}
                          style={[styles.dropdownItem, emplacementSelectionnee?.nom === r.nom && styles.dropdownItemActive]}
                          onPress={() => {
                            setEmplacementSelectionnee(r)
                            setEmplacementEstOuvert(false);
                          }}
                        >
                          <Text style={[styles.dropdownText, emplacementSelectionnee?.nom === r.nom && styles.dropdownTextActive]}>
                            {formatEmplacement(r)}
                          </Text>
                          {emplacementSelectionnee?.nom === r.nom && <Check size={16} color={COLORS.primary} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Raisons (Dropdown) */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('ticket_reason')}</Text>
                <TouchableOpacity
                  style={[styles.dropdownHeader, raisonEstOuvert && styles.dropdownHeaderOpen]}
                  onPress={() => setRaisonEstOuvert(!raisonEstOuvert)}
                  activeOpacity={0.8}
                >
                  <View style={styles.dropdownHeaderLeft}>
                    <FileText size={18} color={COLORS.primary} />
                    <Text style={styles.selectedText}>{raisonSelectionnee?.nom}</Text>
                  </View>
                  { }
                  <ChevronDown
                    size={20}
                    color={COLORS.textLight}
                    style={{ transform: [{ rotate: raisonEstOuvert ? '180deg' : '0deg' }] }}
                  />
                </TouchableOpacity>

                {raisonEstOuvert && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.scrollMaxHeight250} nestedScrollEnabled>
                      {raisons?.map((r) => (
                        <TouchableOpacity
                          key={r.id}
                          style={[styles.dropdownItem, raisonSelectionnee?.nom === r.nom && styles.dropdownItemActive]}
                          onPress={() => {
                            setRaisonSelectionnee(r)
                            setMontant(r.montant.toString())
                            setRaisonEstOuvert(false);
                          }}
                        >
                          <Text style={[styles.dropdownText, raisonSelectionnee?.nom === r.nom && styles.dropdownTextActive, r.nom === raisonPersonnaliseeTexte && styles.boldText]}>
                            {r.nom}
                          </Text>
                          {raisonSelectionnee?.nom === r.nom && <Check size={16} color={COLORS.primary} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Raison personnalisé (Conditionnel) */}
              {raisonSelectionnee?.nom === raisonPersonnaliseeTexte && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>{t('ticket_reason_custom')}</Text>
                  <Input
                    value={raisonCustom}
                    onChangeText={setRaisonCustom}
                    placeholder={t('ticket_reason_detail_ph')}
                    autoFocus
                    error={verifRaisonCustom() ? undefined : t('ticket_custom_reason_error')}
                  />
                </View>
              )}

              {/* Montant (Conditionnel) */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('ticket_amount')}</Text>
                <Input
                  value={montant}
                  onChangeText={setMontant}
                  keyboardType="numeric"
                  editable={raisonSelectionnee?.nom === raisonPersonnaliseeTexte}
                  containerStyle={raisonSelectionnee?.nom !== raisonPersonnaliseeTexte ? styles.disabledInput : {}}
                  placeholder={t('ticket_amount_ph')}
                  error={verifMontant() ? undefined : t('error')}
                />
                {raisonSelectionnee?.nom !== raisonPersonnaliseeTexte && (
                  <Text style={[styles.fixedInfo, styles.noMarginTop]}>{t('ticket_fixed_amount')}</Text>
                )}
              </View>

              {/* Horodatage + Avertissement */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('ticket_date_time')}</Text>
                <View style={isMobile ? styles.dateRowMobile : styles.dateRowDesktop}>
                  <View style={isMobile ? styles.datePickerMobile : styles.flex1}>
                    <StyledDateTimePicker
                      value={date}
                      onChange={setDate}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.checkboxRow, styles.flex1]}
                    onPress={() => {setEstAvertissement(!estAvertissement)}}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, estAvertissement && styles.checkboxActive]}>
                      {estAvertissement && <Check size={14} color="white" />}
                    </View>
                    <Text style={styles.checkboxLabel}>{t('ticket_warning')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Button
                title={t('emp_modify')}
                onPress={handleModifierContravention}
                style={styles.searchBtn}
                disabled={!verifFormulaireValide}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal
        visible={afficherPDF}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setAfficherPDF(false);
          fetchData();
        }}
      >
        <View style={styles.pdfModalOverlay}>
          <View style={[styles.pdfModalContent, styles.pdfModalContentOverride]}>
            <View style={[styles.modalHeader, styles.modalHeaderCenter]}>
              <Text style={styles.modalTitle}>{t('ticket_created')}</Text>
              <TouchableOpacity
                onPress={() => {
                  setAfficherPDF(false);
                  fetchData();
                }}
                style={[styles.closeBtn, styles.closeBtnRight]}
              >
                <Text style={styles.closeBtnText}>{t('close')}</Text>
              </TouchableOpacity>
            </View>
            {contraventionCreee && (
              <AffichagePDF contravention={contraventionCreee} />
            )}
          </View>
        </View>
      </Modal>
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
    fontSize: 32 * scale,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16 * scale,
    color: COLORS.textLight,
    opacity: 0.6,
  },
  grid: {
    flexDirection: 'row',
    gap: SPACING.md * scale,
    marginBottom: SPACING.lg * scale,
  },
  actionCard: {
    flex: 1,
  },
  cardInner: {
    padding: SPACING.lg * scale,
    alignItems: 'center',
    justifyContent: 'center',
    height: 140 * scale,
  },
  iconBox: {
    width: 60 * scale,
    height: 60 * scale,
    borderRadius: 20 * scale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md * scale,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 14 * scale,
    fontWeight: '700',
    textAlign: 'left',
  },
  sectionTitle: {
    fontSize: 12 * scale,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm * scale,
  },
  recentCard: {
    padding: SPACING.lg * scale,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * scale,
    gap: SPACING.md * scale,
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: 14 * scale,
    opacity: 0.4,
    textAlign: 'center',
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
    backgroundColor: COLORS.border,
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
  editBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4 * scale,
    backgroundColor: COLORS.primary + '15',
    width: 24 * scale,
    height: 24 * scale,
    borderRadius: 12 * scale,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  adminBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 12 * scale,
    paddingVertical: 8 * scale,
    borderRadius: 12 * scale,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    gap: 8 * scale,
  },
  adminBackText: {
    fontSize: 10 * scale,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  entryCard: {
    padding: SPACING.xl * scale,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * scale,
    marginBottom: SPACING.md * scale,
  },
  inputLabel: {
    fontSize: 12 * scale,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  mainPlateInput: {
    fontSize: 24 * scale,
    fontWeight: '900',
    height: 65 * scale,
    textAlign: 'left',
  },
  searchBtn: {
    marginTop: SPACING.md * scale,
    height: 55 * scale,
  },
  helperText: {
    color: COLORS.textLight,
    fontSize: 12 * scale,
    textAlign: 'center',
    marginTop: SPACING.sm * scale,
    opacity: 0.5,
  },
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30 * scale,
    borderTopRightRadius: 30 * scale,
    height: '90%',
    padding: SPACING.lg * scale,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pdfModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfModalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 16 * scale,
    width: '90%',
    maxWidth: 480,
    padding: 20 * scale,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl * scale,
    paddingBottom: SPACING.md * scale,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 20 * scale,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 8 * scale,
  },
  closeBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.xl * scale,
  },
  sectionLabel: {
    color: COLORS.textLight,
    fontSize: 11 * scale,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: SPACING.md * scale,
    opacity: 0.6,
  },
  infoBadge: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg * scale,
    borderRadius: SIZES.radius * scale,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.textLight,
  },
  infoBadgeText: {
    color: COLORS.text,
    fontSize: 16 * scale,
    fontWeight: '700',
  },
  plateBadgeText: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 20 * scale,
    letterSpacing: 1,
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
  dropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 * scale,
    flex: 1,
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
  disabledInput: {
    opacity: 0.6,
  },
  fixedInfo: {
    color: COLORS.textLight,
    fontSize: 11 * scale,
    marginTop: 4 * scale,
    fontStyle: 'italic',
    opacity: 0.5,
  },
  modalFooter: {
    paddingVertical: SPACING.xl * scale,
  },
  confirmBtn: {
    height: 60 * scale,
    width: '100%',
  },
  unpaidWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 * scale,
    marginTop: 4 * scale,
  },
  unpaidText: {
    color: COLORS.primary,
    fontSize: 12 * scale,
    fontWeight: '700',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 * scale,
    backgroundColor: COLORS.card,
    padding: SPACING.md * scale,
    borderRadius: SIZES.radius * scale,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  checkbox: {
    width: 22 * scale,
    height: 22 * scale,
    borderRadius: 4 * scale,
    borderWidth: 2,
    borderColor: COLORS.textLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    color: COLORS.text,
    fontSize: 15 * scale,
    fontWeight: '600',
  },
  gridMobile: { flexDirection: 'column' },
  iconBoxRed: { backgroundColor: 'rgba(220, 38, 38, 0.1)' },
  iconBoxBlue: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  vehicleRowMobile: { flexDirection: 'column', gap: 10, alignItems: 'stretch', paddingTop: '1.5%' as any, width: '100%' },
  vehicleRowDesktop: { flexDirection: 'row', gap: 10, alignItems: 'stretch', paddingTop: '1.5%' as any, width: '100%' },
  flex1: { flex: 1 },
  sectionRelative: { position: 'relative' },
  dropdownAbsolute: { position: 'absolute' },
  dropdownHeight55: { height: 55 },
  inputHeight55: { height: 55 },
  scrollMaxHeight150: { maxHeight: 150 },
  scrollMaxHeight250: { maxHeight: 250 },
  plateMargin: { marginLeft: '10%', marginTop: '1%' } as any,
  boldText: { fontWeight: 'bold' },
  noMarginTop: { marginTop: 0 },
  dateRowMobile: { flexDirection: 'column', gap: 10 },
  dateRowDesktop: { flexDirection: 'row', gap: 10 },
  datePickerMobile: { flex: 1, width: '100%' },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pdfModalContentOverride: { alignSelf: 'center', width: '90%', maxWidth: 480, height: 'auto', borderRadius: 16, padding: 20 } as any,
  modalHeaderCenter: { justifyContent: 'center' },
  closeBtnRight: { position: 'absolute', right: 0 },
});
};

export default DashboardEmployeeScreen;

