import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, useWindowDimensions, Modal, TouchableWithoutFeedback, ScrollView,
  LayoutRectangle
} from 'react-native';
import ScreenContainer from '../../components/common/ScreenContainer';
import Input from '../../components/common/Input';
import { ApiService } from '../../api/api';
import { SPACING, SIZES } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import {
  Check,
  ChevronDown,
  FileText,
  Search,
} from 'lucide-react-native';
import Svg, {Polyline} from 'react-native-svg';
import { getScale } from '../../utils/responsive';
import TicketCard from '../../components/common/TicketCard';
import {
  Contravention,
  EmplacementContravention,
  RaisonContravention,
} from '../../types/database';
import { formatEmplacement } from '../../utils/ticket';
import StyledDateTimePicker from '../../components/common/StyledDateTimePicker';
import Button from '../../components/common/Button';

const ChevronLeftIcon = ({ size = 24, color = "#000000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="15 18 9 12 15 6" />
  </Svg>
);

const ChevronRightIcon = ({ size = 24, color = "#000000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);

const raisonPersonnaliseeTexte = "(+) Motif personnalisé"

const regexVerifPlaque = /^[A-Za-z0-9]{2,7}$/
const regexVerifMontant = /^\d+([.,]\d+)?$/

const PROVINCES = ["QC", "ON", "NB", "NS", "PE", "NL", "MB", "SK", "AB", "BC", "YT", "NT", "NU", "Autre"];

const ContraventionManagementScreen = ({ navigation }: any) => {
  const { width } = useWindowDimensions();
  const { COLORS, t } = useSettings();
  const styles = getStyles(COLORS, width);
  const [contraventions, setContraventions] = useState<Contravention[]>([]);
  const [contraventionsFiltrees, setContraventionsFiltrees] = useState<Contravention[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour la recherche et pagination
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);
  const limit = 5;

  //État pour l'affichage du menu de modification
  const [afficherModalModifier, setAfficherModalModifier] = useState(false);

  //États pour les informations de la contravention
  const [plaque, setPlaque] = useState('');
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [montant, setMontant] = useState('');
  const [raisonCustom, setRaisonCustom] = useState('');
  const [date, setDate] = useState(new Date());
  const [emplacementSelectionnee, setEmplacementSelectionnee] = useState<EmplacementContravention | null>(null);
  const [raisonSelectionnee, setRaisonSelectionnee] = useState<RaisonContravention | null>(null);
  const [emplacements, setEmplacements] = useState<EmplacementContravention[] | null>(null);
  const [raisons, setRaisons] = useState<RaisonContravention[] | null>(null);
  const [estAvertissement, setEstAvertissement] = useState(false);
  const [provinceChoisie, setProvinceChoisie] = useState("QC");
  const [numeroContravention, setNumeroContravention] = useState("");

  //États pour l'ouverture des dropdowns
  const [raisonEstOuvert, setRaisonEstOuvert] = useState(false);
  const [emplacementEstOuvert, setEmplacementEstOuvert] = useState(false);
  const [provinceEstOuvert, setProvinceEstOuvert] = useState(false);

  //État et ref pour dropdown
  const [dropdownLayout, setDropdownLayout] = useState<LayoutRectangle | null>(null);
  const dropdownRef = useRef<View>(null);

  //État pour détecter pour l'affichage mobile
  const isMobile = width < 768;

  //Load les contraventions à l'ouverture de la page
  useEffect(() => {
    fetchContraventions();
  }, []);

  //Recharge la liste de contraventions lorsque le champ de recherche est changé
  useEffect(() => {
    if (recherche.trim() === '') {
      setContraventionsFiltrees(contraventions);
    } else {
      setContraventionsFiltrees(
        contraventions.filter(contravention => {
          const rechercheString = recherche.toLowerCase();

          //Affiche toute contravention dont la recherche est présente dans un de ses champs
          return (
            contravention.numero_contravention?.toLowerCase().includes(rechercheString) ||
            contravention.vehicule?.numero_plaque?.toLowerCase().includes(rechercheString) ||
            contravention.attribuer_par_utilisateur?.nom?.toLowerCase().includes(rechercheString) ||
            contravention.raison_contravention?.nom?.toLowerCase().includes(rechercheString) ||
            contravention.emplacement.nom?.toLowerCase().includes(rechercheString)
          );
        })
      );
    }
    setPage(1);
  }, [recherche, contraventions]);

  //Appelle l'API pour avoir toutes les contraventions du système
  const fetchContraventions = async () => {
    setLoading(true);

    try {
      const data = await ApiService.adminGetContraventions();

      setContraventions(data);
      setContraventionsFiltrees(data);
    } catch (error) {
      console.error("Erreur chargement contraventions:", error);
    } finally {
      setLoading(false);
    }
  };

  //Méthode passée à FlatList pour afficher chaque contravention
  const afficherContravention = ({ item }: { item: Contravention }) => (
    <TicketCard
      ticket={item}
      showEditButton
      showCancelButton
      showPayerButton={true}
      onEdit={() => handleRemplirFormulaireModifierContravention(item)}
      onCancel={() => handleCancel(item)}
      onPayer={() => handlePayer(item)}
    />
  );

  //Méthode pour remplir le formulaire de modification avec les infos existantes
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

      setAfficherModalModifier(true);
    } catch (e: any) {
      console.error(e);
      Alert.alert(t('error'), t('err_generic'));
    }
  };

  //Appelle l'API pour obtenir tous les emplacements
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

  //Appelle l'API pour obtenir toutes les raisons
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

  //Change l'état de la contravention à Annulée dans la bd
  const handleCancel = async (contravention: Contravention) => {
    await ApiService.changerEtatContravention(contravention.numero_contravention, {
      etat_contravention: 'annulee',
    });

    //Reload la page pour afficher le changement
    fetchContraventions();
  };

  //Change l'état de la contravention à Annulée dans la bd
  const handlePayer = async (contravention: Contravention) => {
    await ApiService.changerEtatContravention(contravention.numero_contravention, {
      etat_contravention: 'payee',
    });

    //Reload la page pour afficher le changement
    fetchContraventions();
  };

  //Méthode pour modifier dans la bd la contravention choisie avec les infos entrées
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

      //Reload la page pour afficher le changement
      fetchContraventions()
      setAfficherModalModifier(false);

    } catch {
      Alert.alert(t('error'), t('err_generic'));
    }
  };

  //Vérif
  const verifPlaque = () => {
    //Logique de vérification
    return regexVerifPlaque.test(plaque)
  };

  //Vérif
  const verifMarque = () => {
    //S'assure que le champ n'est pas undefined
    if(!marque) return false
    //Logique de vérification
    return marque.length > 0
  };

  //Vérif
  const verifModele = () => {
    //S'assure que le champ n'est pas undefined
    if(!modele) return false
    //Logique de vérification
    return modele.length > 0
  };

  //Vérif
  const verifRaisonCustom = () => {
    //S'assure que le champ n'est pas undefined
    if(!raisonCustom) return false
    //Logique de vérification
    return raisonCustom.length > 0
  };

  //Vérif
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

  return (
    <ScreenContainer scrollable={false} title={t('contravention_title')} withBackButton typePageAccess={"Admin"}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('admin_contraventions')}</Text>
          <Text style={styles.subtitle}>{t('admin_contraventions_desc')}</Text>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <Input
          placeholder={t('contravention_search')}
          value={recherche}
          onChangeText={setRecherche}
          containerStyle={styles.searchInput}
          icon={<Search size={18} color={COLORS.textLight} />}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={contraventionsFiltrees.slice(
            (page - 1) * limit,
            page * limit
          )}
          keyExtractor={(item) => item.numero_contravention}
          renderItem={afficherContravention}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>{t('contravention_none')}</Text>
            </View>
          }
        />
      )}

      {/* Pagination */}
      {Math.ceil(contraventionsFiltrees.length / limit) > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
            onPress={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeftIcon size={18} color={page === 1 ? COLORS.textLight : "#FFFFFF"} />
          </TouchableOpacity>

          <Text style={styles.pageInfo}>
            Page {page} / {Math.ceil(contraventionsFiltrees.length / limit) || 1}
          </Text>

          <TouchableOpacity
            style={[styles.pageBtn, page >= Math.ceil(contraventionsFiltrees.length / limit) && styles.pageBtnDisabled]}
            onPress={() => setPage(p => Math.min(Math.ceil(contraventionsFiltrees.length / limit), p + 1))}
            disabled={page >= Math.ceil(contraventionsFiltrees.length / limit)}
          >
            <ChevronRightIcon size={18} color={page >= Math.ceil(contraventionsFiltrees.length / limit) ? COLORS.textLight : "#FFFFFF"} />
          </TouchableOpacity>
        </View>
      )}

      {/* Modal formulaire ajout / modification */}
      <Modal
        visible={afficherModalModifier}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAfficherModalModifier(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('ticket_reason_detail')}</Text>
              <TouchableOpacity onPress={() => setAfficherModalModifier(false)} style={styles.closeBtn}>
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
    </ScreenContainer>
  );
};

// Styles du composant
const getStyles = (COLORS: any, width: number) => {
  const scale = getScale(width);

  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: SPACING.lg * scale,
    },
    title: {
      fontSize: 24 * scale,
      fontWeight: '900',
      color: COLORS.text,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14 * scale,
      color: COLORS.textLight,
      opacity: 0.6,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.primary,
      paddingHorizontal: SPACING.md * scale,
      paddingVertical: 10 * scale,
      borderRadius: SIZES.radius * scale,
      gap: 6 * scale,
    },
    addBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 14 * scale,
    },
    searchBtn: {
      marginTop: SPACING.md * scale,
      height: 55 * scale,
    },
    searchWrapper: {
      marginBottom: SPACING.md * scale,
    },
    searchInput: {
      marginBottom: 0,
    },
    listContainer: {
      paddingBottom: SPACING.xl * scale,
      backgroundColor: COLORS.card + '90',
      borderRadius: SIZES.radius * scale,
      padding: SPACING.sm * scale,
    },
    card: {
      padding: SPACING.md * scale,
      marginBottom: SPACING.sm * scale,
    },
    cardInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconCircle: {
      width: 40 * scale,
      height: 40 * scale,
      borderRadius: 20 * scale,
      backgroundColor: '#a855f7',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.md * scale,
    },
    cardDetails: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16 * scale,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: 2 * scale,
    },
    cardSubtitle: {
      fontSize: 13 * scale,
      color: COLORS.textLight,
    },
    cardDesc: {
      fontSize: 12 * scale,
      color: COLORS.textLight,
      opacity: 0.8,
      marginTop: 4 * scale,
      fontStyle: 'italic',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 8 * scale,
    },
    actionBtn: {
      width: 32 * scale,
      height: 32 * scale,
      borderRadius: 8 * scale,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editBtn: {
      backgroundColor: '#3b82f6',
    },
    deleteBtn: {
      backgroundColor: '#ef4444',
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.xl * scale,
    },
    emptyText: {
      color: COLORS.textLight,
      fontSize: 14 * scale,
    },
    pagination: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.md * scale,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      marginTop: 'auto',
    },
    pageBtn: {
      width: 36 * scale,
      height: 36 * scale,
      borderRadius: 18 * scale,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageBtnDisabled: {
      backgroundColor: COLORS.background,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    pageInfo: {
      color: COLORS.text,
      fontSize: 14 * scale,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    submitBtn: {
      marginTop: SPACING.md * scale,
      paddingVertical: 14 * scale,
      borderRadius: SIZES.radius * scale,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
    },
    flex1: { flex: 1 },
    modalContent: {
      backgroundColor: COLORS.background,
      borderTopLeftRadius: 30 * scale,
      borderTopRightRadius: 30 * scale,
      height: '90%',
      padding: SPACING.lg * scale,
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
    vehicleRowMobile: { flexDirection: 'column', gap: 10, alignItems: 'stretch', paddingTop: '1.5%' as any, width: '100%' },
    vehicleRowDesktop: { flexDirection: 'row', gap: 10, alignItems: 'stretch', paddingTop: '1.5%' as any, width: '100%' },
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
  });
};

export default ContraventionManagementScreen;
