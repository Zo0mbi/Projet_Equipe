import React, { useState, useRef } from 'react';
import {
  Text,
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  TouchableWithoutFeedback, LayoutRectangle,
  useWindowDimensions,
} from 'react-native';
import ScreenContainer from '../../components/common/ScreenContainer';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { SPACING, SIZES } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import { FileText, Car, ChevronDown, Check, AlertCircle } from 'lucide-react-native';
import { ApiService } from '../../api/api';
import { formatEmplacement } from '../../utils/ticket';
import { ActivityIndicator } from 'react-native';
import {
  Contravention,
  EmplacementContravention,
  RaisonContravention,
} from '../../types/database';
import StyledDateTimePicker from '../../components/common/StyledDateTimePicker';
import { AffichagePDF } from '../../utils/AffichagePDF';
import { getScale } from '../../utils/responsive';


const raisonPersonnaliseeTexte = "(+) Motif personnalisé"

const regexVerifPlaque = /^[A-Za-z0-9]{2,7}$/
const regexVerifMontant = /^\d+([.,]\d+)?$/

const PROVINCES = ["QC", "ON", "NB", "NS", "PE", "NL", "MB", "SK", "AB", "BC", "YT", "NT", "NU", "Autre"];

const CreateTicketScreen = ({ navigation }: any) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { COLORS, t } = useSettings();
  const styles = getStyles(COLORS, width);
  
  const [plaque, setPlaque] = useState('');
  const [afficherPopup, setAfficherPopup] = useState(false);
  const [estEnRecherche, setEstEnRecherche] = useState(false);
  const [nbNonPayee, setNbNonPayee] = useState(0);
  const [nbAvertissement, setNbAvertissement] = useState(0);

  const [marqueTrouvee, setMarqueTrouvee] = useState<string | null>(null);
  const [marque, setMarque] = useState("")
  const [modele, setModele] = useState("")
  const [montant, setMontant] = useState("");

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

  const [aAjouterContravention, setAAjouterContravention] = useState(false);
  const [numeroContraventionAjoutee, setNumeroContraventionAjoutee] = useState("");

  const [provinceChoisie, setProvinceChoisie] = useState(PROVINCES[0]);
  const [provinceEstOuvert, setProvinceEstOuvert] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState<LayoutRectangle | null>(null);
  const dropdownRef = useRef<View>(null);

  const [provinceCreerEstOuvert, setProvinceCreerEstOuvert] = useState(false);
  const [dropdownLayoutCreer, setDropdownLayoutCreer] = useState<LayoutRectangle | null>(null);
  const dropdownRefCreer = useRef<View>(null);


  const getEmplacements = async () => {
    try{
      //Appelle à l'api pour obtenir les contraventions de l'utilisateur
      const listeEmplacements = await ApiService.getEmplacementsForForm();

      //Place les contraventions obtenues dans le state
      setEmplacements(listeEmplacements);

      if (listeEmplacements.length > 0) {
        setEmplacementSelectionnee(listeEmplacements[0]);
      } else {
        setEmplacementSelectionnee(null);
      }

    } catch (e) {
      console.error(e);
    }
  };

  const getRaisons = async () => {
    try{
      //Appelle à l'api pour obtenir les contraventions de l'utilisateur
      const listeRaisons = await ApiService.getRaisonsForForm();

      //Place la liste de raisons obtenue dans le state et ajoute l'option de raison personnalisée
      setRaisons([...(listeRaisons ?? []), {id: 1000, nom: raisonPersonnaliseeTexte, montant: 0}]);
      setMontant(raisonSelectionnee?.montant.toString() ?? "")

      if (listeRaisons.length > 0) {
        setRaisonSelectionnee(listeRaisons[0]);
        setMontant(listeRaisons[0].montant.toString())
      } else {
        setRaisonSelectionnee(null);
      }

    } catch (e) {
      console.error(e);
    }
  };

  const handleCreerContravention = async () => {
    try {
      const utilisateur = await ApiService.getMe();

      if(!emplacementSelectionnee) return;
      if(!raisonSelectionnee) return;

      //Pour remettre la date dans le bon format de string pour le backend
      const pad = (n: number) => n.toString().padStart(2, "0");
      const localISO = (d: Date) => {
        return (
          d.getFullYear() +
          "-" + pad(d.getMonth() + 1) +
          "-" + pad(d.getDate()) +
          "T" + pad(d.getHours()) +
          ":" + pad(d.getMinutes()) +
          ":" + pad(d.getSeconds())
        );
      };
      const dateString = localISO(date);

      const contravention = await ApiService.createContravention({
        attribuer_par: utilisateur.id,
        emplacement_id: emplacementSelectionnee.id,
        date_entrer: dateString,
        etat_contravention: estAvertissement ? "avertissement" : "impayee",
        marque: marque || "",
        modele: modele || "",
        montant: estAvertissement ? 0 : Number(montant),
        numero_plaque: plaque,
        province: provinceChoisie,
        raisons_id: (raisonSelectionnee.id !== 1000 ? raisonSelectionnee.id : null),
        raison_custom: (raisonSelectionnee.id === 1000 && raisonCustom ? raisonCustom : null),
      });

      setContraventionCreee(contravention);
      setAfficherPopup(false);
      setPlaque(''); // Reset pour la prochaine saisie
      setNumeroContraventionAjoutee(contravention.numero_contravention)
      setAfficherPDF(true);

    } catch (e) {
      Alert.alert(t('error'), t('err_generic'));
    }
  };

  const handleSearch = async () => {
    //Regex pour s'assurer du bon format du numéro de contravention
    const regexVerif = /^[A-Za-z0-9 -]{2,7}$/;
    if (!regexVerif.test(plaque.trim())) {
      Alert.alert(t('error'), t('search_enter_number'));
      return;
    }

    setEstEnRecherche(true);
    try {
      getEmplacements()
      getRaisons()

      // Appel API réel
      const data = await ApiService.verifierPlaque(plaque, provinceChoisie);

      if(data){
        setMarqueTrouvee(data.marque ?? null)
        setMarque(data.marque ?? "")
        setModele(data.modele ?? "")
        setNbNonPayee(data.count_impayee);
        setNbAvertissement(data.count_avertissement);
      }
      
      // Générer date/heure actuelle
      const now = new Date();
      setDate(now);
      
      setAfficherPopup(true);
    } catch (e: any) {
      if (e.response?.status === 404) {
        // Véhicule non trouvé, on peut quand même créer un ticket
        setMarqueTrouvee(null)
        setMarque("")
        setModele("")
        setNbNonPayee(0);
        setNbAvertissement(0);
        // Générer date/heure actuelle
        const now = new Date();
        setDate(now);
        setAfficherPopup(true);
      } else {
        console.error(e);
        Alert.alert(t('error'), t('err_generic'));
      }
    } finally {
      setEstEnRecherche(false);
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
    if(!montant || !regexVerifMontant.test(montant)) return false
    //S'assure que le montant entré est plus grand que 0
    const montantFloat = parseFloat(montant.replace(',', '.'));
    return montantFloat > 0;
  };

  //Check pour vérifier la validité de la date
  const verifDateEtTempsValide = () => {
    // La date est gérée par StyledDateTimePicker, donc elle est toujours valide si elle est un objet Date
    return date instanceof Date && !isNaN(date.getTime());
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
    <ScreenContainer scrollable title={t('ticket_new')} typePageAccess="Employe" withBackButton={true}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('ticket_emit')}</Text>
        <Text style={styles.subtitle}>{t('ticket_plate_hint')}</Text>
      </View>

      <Card style={styles.entryCard}>
        <View style={styles.iconRow}>
          <Car size={24} color={COLORS.primary} strokeWidth={2.5} />
          <Text style={styles.inputLabel}>{t('ticket_search_label')}</Text>
        </View>
        <View style={isMobile ? styles.inputRowMobile : styles.inputRowDesktop}>

          <View style={styles.flex1}>
            <Input
              placeholder={t('ticket_plate_ex')}
              value={plaque}
              onChangeText={setPlaque}
              autoCapitalize="characters"
              style={[
                styles.mainPlateInput,
                styles.height55,
                {
                  borderColor: COLORS.primary + '40',
                },
              ]}
            />
          </View>

          <View style={[styles.section, styles.sectionRelativeNoTop]}>
            <TouchableOpacity
              style={[
                styles.dropdownHeader,
                provinceEstOuvert && styles.dropdownHeaderOpen,
                styles.dropdownHeight55,
              ]}
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
                    <View style={[styles.dropdownAbsolute, { top: dropdownLayout.y + dropdownLayout.height, left: dropdownLayout?.x, width: dropdownLayout?.width }]}>
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
        </View>
        <Button 
          title={t('search').toUpperCase()}
          onPress={handleSearch}
          style={styles.searchBtn}
          disabled={estEnRecherche || !verifPlaque() }
        />
        {estEnRecherche && (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.activityMarginTop} />
        )}
        {aAjouterContravention && (
          <Text style={[styles.infoBadgeText, styles.successTextCenter]}>{t('ticket')} {numeroContraventionAjoutee} {t('success').toLowerCase()}.</Text>
        )}

        <Text style={styles.helperText}>{t('ticket_search_helper')}</Text>
      </Card>

      {/* POP-UP (MODAL) */}
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
              {/* Infos Véhicule (Auto-générées) */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('ticket_vehicle_detected')}</Text>
                {marqueTrouvee ? (
                  <View style={[styles.infoBadge, nbNonPayee > 0 && { borderColor: COLORS.primary }]}>
                    <View>
                      <Text style={styles.infoBadgeText}>
                        {`${marque} ${modele}`}
                      </Text>
                      {nbNonPayee > 0 && (
                        <View style={styles.unpaidWarning}>
                          <AlertCircle size={14} color={COLORS.primary} />
                          <Text style={styles.unpaidText}>{nbNonPayee} {t('unpaid').toLowerCase()}</Text>
                        </View>
                      )}
                      {nbAvertissement > 0 && (
                        <View style={styles.unpaidWarning}>
                          <AlertCircle size={14} color={COLORS.text} />
                          <Text style={styles.warningText}>{nbAvertissement} avertissement(s)</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.plateBadgeText}>{plaque.toUpperCase()} ({provinceChoisie})</Text>
                  </View>
                ) : (
                  <View style={[styles.infoBadge, nbNonPayee > 0 && { borderColor: COLORS.danger }]}>
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
                          style={[styles.dropdownHeader, provinceCreerEstOuvert && styles.dropdownHeaderOpen]}
                          onPress={() => {
                            if (!provinceCreerEstOuvert) {
                              dropdownRefCreer.current?.measureInWindow((x, y, width, height) => {
                                setDropdownLayoutCreer({ x, y, width, height });
                                setProvinceCreerEstOuvert(true);
                              });
                            } else {
                              setProvinceCreerEstOuvert(false);
                            }
                          }}
                          ref={dropdownRefCreer}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.selectedText}>{provinceChoisie}</Text>
                          <ChevronDown
                            size={20}
                            color={COLORS.textLight}
                            style={{ transform: [{ rotate: provinceCreerEstOuvert ? '180deg' : '0deg' }] as any }}
                          />
                        </TouchableOpacity>

                        {provinceCreerEstOuvert && dropdownLayoutCreer &&(
                          <Modal transparent animationType="fade">
                            <TouchableWithoutFeedback onPress={() => setProvinceCreerEstOuvert(false)}>
                              <View style={styles.flex1}>
                                <View style={[styles.dropdownAbsolute, { top: dropdownLayoutCreer.y + dropdownLayoutCreer.height, left: dropdownLayoutCreer?.x, width: dropdownLayoutCreer?.width }]}>
                                  <View style={styles.dropdownList}>
                                    <ScrollView style={styles.scrollMaxHeight150}>
                                      {PROVINCES.map((province) => (
                                        <TouchableOpacity
                                          key={province}
                                          style={[styles.dropdownItem, provinceChoisie === province && styles.dropdownItemActive]}
                                          onPress={() => {
                                            setProvinceChoisie(province);
                                            setProvinceCreerEstOuvert(false);
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
                      <Text style={[styles.plateBadgeText, styles.plateMargin]}>{plaque.toUpperCase()}</Text>
                    </View>
                  </View>
                )}
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
                          <Text style={[styles.dropdownText, raisonSelectionnee?.nom === r.nom && styles.dropdownTextActive, r.nom === raisonPersonnaliseeTexte && styles.boldRaison]}>
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
                    onPress={() => setEstAvertissement(!estAvertissement)}
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
                title={t('emp_create')}
                onPress={handleCreerContravention}
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
          setPlaque('');
          navigation.goBack();
        }}
      >
        <View style={styles.pdfModalOverlay}>
          <View style={[styles.pdfModalContent, styles.pdfModalContentOverride]}>
            <View style={[styles.modalHeader, styles.modalHeaderCenter]}>
              <Text style={styles.modalTitle}>{t('ticket_created')}</Text>
              <TouchableOpacity
                onPress={() => {
                  setAfficherPDF(false);
                  setPlaque('');
                  setAAjouterContravention(true)
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
    color: COLORS.primary,
    fontWeight: '700',
  },
  boldRaison: {
    fontWeight: 'bold',
  },
  disabledInput: {
    opacity: 0.6,
  },
  height55: {
    height: 55,
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
  warningText: {
    color: COLORS.text,
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
  inputRowMobile: { flexDirection: 'column', gap: 10, alignItems: 'stretch' },
  inputRowDesktop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  flex1: { flex: 1 },
  sectionRelativeNoTop: { position: 'relative', marginTop: 0 },
  sectionRelative: { position: 'relative' },
  dropdownHeight55: { height: 55 },
  dropdownAbsolute: { position: 'absolute' },
  scrollMaxHeight150: { maxHeight: 150 },
  activityMarginTop: { marginTop: 10 },
  successTextCenter: { alignSelf: 'center', marginTop: 10 },
  inputHeight55: { flex: 1, height: 55 },
  plateMargin: { marginLeft: '10%', marginTop: '1%' },
  noMarginTop: { marginTop: 0 },
  dateRowMobile: { flexDirection: 'column', gap: 10 },
  dateRowDesktop: { flexDirection: 'row', gap: 10 },
  datePickerMobile: { flex: 1, width: '100%' },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pdfModalContentOverride: { alignSelf: 'center', width: '90%', maxWidth: 480, height: 'auto', borderRadius: 16, padding: 20 },
  modalHeaderCenter: { justifyContent: 'center' },
  closeBtnRight: { position: 'absolute', right: 0 },
  vehicleRowMobile: { flexDirection: 'column', gap: 10, alignItems: 'stretch', paddingTop: '1.5%' as any, width: '100%' },
  vehicleRowDesktop: { flexDirection: 'row', gap: 10, alignItems: 'stretch', paddingTop: '1.5%' as any, width: '100%' },
  scrollMaxHeight250: { maxHeight: 250 },
});
};

export default CreateTicketScreen;


