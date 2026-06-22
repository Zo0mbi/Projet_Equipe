import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ScrollView,
  LayoutRectangle,
} from 'react-native';
import ScreenContainer from '../../components/common/ScreenContainer';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { ApiService } from '../../api/api';
import { SPACING, SIZES } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import { Check, FileText, Search } from 'lucide-react-native';
import Svg, { Path, Polyline, Line } from 'react-native-svg';
import { getScale } from '../../utils/responsive';
import { Car, ChevronDown } from 'lucide-react';

const PlusIcon = ({ size = 24, color = "#000000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

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

const XIcon = ({ size = 24, color = "#000000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const PencilIcon = ({ size = 24, color = "#000000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Svg>
);

interface Vehicule {
  id: number;
  marque: string;
  modele: string;
  numero_plaque: string;
  province?: string;
  owner?: {
    id: number;
    nom: string;
  };
}

const regexVerifPlaque = /^[A-Za-z0-9]{2,10}$/;

const PROVINCES = ['QC', 'ON', 'NB', 'NS', 'PE', 'NL', 'MB', 'SK', 'AB', 'BC', 'YT', 'NT', 'NU', 'Autre'];

const VehiculeManagementScreen = ({ navigation }: any) => {
  const { width } = useWindowDimensions();
  const { COLORS, t } = useSettings();
  const styles = getStyles(COLORS, width);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [filteredVehicules, setFilteredVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour la recherche et pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 5;

  //États des formulaires d'ajout et de modification
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [numeroPlaque, setNumeroPlaque] = useState('');
  const [idProprietaire, setIdProprietaire] = useState('');
  const [aucunProprietaire, setAucunProprietaire] = useState(false);
  const [formulaireEnChargement, setFormulaireEnChargement] = useState(false);

  //États pour le dropdown de provinces
  const [provinceChoisie, setProvinceChoisie] = useState('QC');
  const [provinceEstOuvert, setProvinceEstOuvert] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState<LayoutRectangle | null>(null,);
  const dropdownRef = useRef<View>(null);

  const getRotation = (open: boolean): '0deg' | '180deg' => open ? '180deg' : '0deg';


  useEffect(() => {
    fetchVehicules();
  }, []);


  useEffect(() => {
    if (!search.trim()) {
      setFilteredVehicules(vehicules);
    } else {
      const s = search.toLowerCase();

      setFilteredVehicules(
        //Permet la recherche par la marque, modele, plaque et le propriétaire
        vehicules.filter(
          v =>
            v.marque.toLowerCase().includes(s) ||
            v.modele.toLowerCase().includes(s) ||
            v.numero_plaque.toLowerCase().includes(s) ||
            v.owner?.nom?.toLowerCase().includes(s),
        ),
      );
    }

    setPage(1);
  }, [search, vehicules]);

  const fetchVehicules = async () => {
    setLoading(true);

    try {
      const response = await ApiService.adminGetVehicules();

      setVehicules(response.vehicules || []);
      setFilteredVehicules(response.vehicules || []);
    } catch (error) {
      console.error('Erreur chargement véhicules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (vehicule?: Vehicule) => {
    if (vehicule) {
      const aUnProprietaire = vehicule.owner?.id != null;

      setEditingId(vehicule.id);
      setMarque(vehicule.marque);
      setModele(vehicule.modele);
      setNumeroPlaque(vehicule.numero_plaque);
      setProvinceChoisie(vehicule.province || 'QC');
      setAucunProprietaire(!aUnProprietaire);
      setIdProprietaire(aUnProprietaire ? vehicule.owner!.id.toString() : '');
    } else {
      setEditingId(null);
      setMarque('');
      setModele('');
      setNumeroPlaque('');
      setProvinceChoisie('QC');
      setAucunProprietaire(false);
      setIdProprietaire('');
    }

    setIsFormVisible(true);
  };

  const handleCloseForm = () => {
    setIsFormVisible(false);
    setEditingId(null);

    setMarque('');
    setModele('');
    setNumeroPlaque('');
    setProvinceChoisie('QC');
    setAucunProprietaire(false);
    setIdProprietaire('');
  };

  const handleSubmit = async () => {
    if (!verifFormulaireValide()) {
      Alert.alert(t('error'), 'Tous les champs sont requis');
      return;
    }

    setFormulaireEnChargement(true);

    try {
      const payload = {
        marque: marque,
        modele: modele,
        numero_plaque: numeroPlaque,
        province: provinceChoisie,
        owner_id: aucunProprietaire ? null : Number(idProprietaire),
      };

      await ApiService.adminUpdateVehicule(editingId || 0, payload);

      handleCloseForm();
      fetchVehicules();
    } catch (error) {
      console.error(error);
      Alert.alert(t('error'), 'Erreur sauvegarde véhicule');
    } finally {
      setFormulaireEnChargement(false);
    }
  };

  //Méthode passée à FlatList pour afficher chaque véhicule comme voulu
  const afficherVehicule = ({ item }: { item: Vehicule }) => (
    <Card style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.iconCircle}>
          <Car size={20} color="#FFFFFF" />
        </View>

        <View style={styles.cardDetails}>
          <Text style={styles.cardTitle}>
            #{item.id} - {item.marque} {item.modele}
          </Text>

          <Text style={styles.cardSubtitle}>Plaque: {item.numero_plaque}</Text>

          <Text style={styles.cardSubtitle}>
            Province: {item.province || '-'}
          </Text>

          <Text style={styles.cardSubtitle}>
            Propriétaire: {item.owner?.nom || '-'}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => handleOpenForm(item)}
          >
            <PencilIcon size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const verifMarque = () => {
    return marque.trim().length > 0;
  };

  const verifModele = () => {
    return modele.trim().length > 0;
  };

  const verifPlaque = () => {
    return regexVerifPlaque.test(numeroPlaque.trim());
  };

  const verifProvince = () => {
    return provinceChoisie.trim().length > 0;
  };

  const verifIdProprietaire = () => {
    if (aucunProprietaire) return true;

    return /^\d+$/.test(idProprietaire.trim());
  };

  const verifFormulaireValide = () => {
    return verifMarque() &&
      verifModele() &&
      verifPlaque() &&
      verifProvince() &&
      verifIdProprietaire();
  }



  // @ts-ignore
  return (
    <ScreenContainer
      scrollable={false}
      title={t('vehicule_title')}
      withBackButton
      typePageAccess={'Admin'}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('admin_vehicules')}</Text>
          <Text style={styles.subtitle}>{t('admin_vehicules_desc')}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => handleOpenForm()}
        >
          <PlusIcon size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>{t('new')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <Input
          placeholder={t('vehicule_search')}
          value={search}
          onChangeText={setSearch}
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
          data={filteredVehicules.slice((page - 1) * limit, page * limit)}
          keyExtractor={item => item.id.toString()}
          renderItem={afficherVehicule}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>{t('vehicule_none')}</Text>
            </View>
          }
        />
      )}

      {/* Pagination */}
      {Math.ceil(filteredVehicules.length / limit) > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
            onPress={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeftIcon
              size={18}
              color={page === 1 ? COLORS.textLight : '#FFFFFF'}
            />
          </TouchableOpacity>

          <Text style={styles.pageInfo}>
            Page {page} / {Math.ceil(filteredVehicules.length / limit) || 1}
          </Text>

          <TouchableOpacity
            style={[
              styles.pageBtn,
              page >= Math.ceil(filteredVehicules.length / limit) &&
                styles.pageBtnDisabled,
            ]}
            onPress={() =>
              setPage(p =>
                Math.min(Math.ceil(filteredVehicules.length / limit), p + 1),
              )
            }
            disabled={page >= Math.ceil(filteredVehicules.length / limit)}
          >
            <ChevronRightIcon
              size={18}
              color={
                page >= Math.ceil(filteredVehicules.length / limit)
                  ? COLORS.textLight
                  : '#FFFFFF'
              }
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Modal formulaire ajout / modification */}
      <Modal
        visible={isFormVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseForm}
      >
        <TouchableWithoutFeedback onPress={handleCloseForm}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalSheet}
              >
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.formTitle}>
                      {editingId ? t('vehicule_edit') : t('vehicule_new')}
                    </Text>
                    <TouchableOpacity
                      onPress={handleCloseForm}
                      style={styles.closeBtn}
                    >
                      <Text style={styles.closeBtnText}>{t('cancel')}</Text>
                    </TouchableOpacity>
                  </View>

                  <Input
                    label="Marque"
                    value={marque}
                    onChangeText={setMarque}
                    error={
                      verifMarque() ? undefined : 'Veuillez entrer une marque'
                    }
                  />

                  <Input
                    label="Modèle"
                    value={modele}
                    onChangeText={setModele}
                    error={
                      verifModele() ? undefined : 'Veuillez entrer un modèle'
                    }
                  />

                  <Input
                    label="Numéro de plaque"
                    value={numeroPlaque}
                    onChangeText={setNumeroPlaque}
                    error={verifPlaque() ? undefined : 'Plaque invalide'}
                  />

                  <View style={styles.formRow}>
                    <View style={styles.flex1}>
                      <Text style={styles.inputLabel}>Province</Text>

                      <TouchableOpacity
                        ref={dropdownRef}
                        style={[
                          styles.dropdownHeader,
                          provinceEstOuvert && styles.dropdownHeaderOpen,
                          styles.dropdownHeight55,
                        ]}
                        onPress={() => {
                          if (!provinceEstOuvert) {
                            dropdownRef.current?.measureInWindow(
                              (x, y, w, h) => {
                                setDropdownLayout({
                                  x,
                                  y,
                                  width: w,
                                  height: h,
                                });
                                setProvinceEstOuvert(true);
                              },
                            );
                          } else {
                            setProvinceEstOuvert(false);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.selectedText}>
                          {provinceChoisie}
                        </Text>

                        <ChevronDown
                          size={20}
                          color={COLORS.textLight}
                        />
                      </TouchableOpacity>

                      {provinceEstOuvert && dropdownLayout && (
                        <Modal transparent animationType="fade">
                          <TouchableWithoutFeedback
                            onPress={() => setProvinceEstOuvert(false)}
                          >
                            <View style={styles.flex1}>
                              <View
                                style={[
                                  styles.dropdownAbsolute,
                                  {
                                    top:
                                      dropdownLayout.y + dropdownLayout.height,
                                    left: dropdownLayout.x,
                                    width: dropdownLayout.width,
                                  },
                                ]}
                              >
                                <View style={styles.dropdownList}>
                                  <ScrollView style={styles.scrollMaxHeight150}>
                                    {PROVINCES.map(p => (
                                      <TouchableOpacity
                                        key={p}
                                        style={[
                                          styles.dropdownItem,
                                          provinceChoisie === p &&
                                            styles.dropdownItemActive,
                                        ]}
                                        onPress={() => {
                                          setProvinceChoisie(p);
                                          setProvinceEstOuvert(false);
                                        }}
                                      >
                                        <Text
                                          style={[
                                            styles.dropdownText,
                                            provinceChoisie === p &&
                                              styles.dropdownTextActive,
                                          ]}
                                        >
                                          {p}
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

                  <View style={styles.formRow}>
                    <View style={styles.flex1}>
                      <Input
                        label="ID de propriétaire"
                        value={idProprietaire}
                        onChangeText={setIdProprietaire}
                        keyboardType="numeric"
                        editable={!aucunProprietaire}
                        containerStyle={
                          aucunProprietaire ? styles.disabledInput : undefined
                        }
                        error={
                          verifIdProprietaire() ? undefined : 'ID invalide'
                        }
                      />
                    </View>

                    <View style={styles.flex1}>
                      <Text style={styles.inputLabel}>Aucun propriétaire</Text>

                      <TouchableOpacity
                        style={[styles.checkboxRow]}
                        onPress={() => {
                          const nextValue = !aucunProprietaire;
                          setAucunProprietaire(nextValue);

                          if (nextValue) {
                            setIdProprietaire('');
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            aucunProprietaire && styles.checkboxActive,
                          ]}
                        >
                          {aucunProprietaire && (
                            <Check size={14} color="#FFFFFF" />
                          )}
                        </View>

                        <Text style={styles.checkboxLabel}>
                          Retirer propriétaire
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      (formulaireEnChargement || !verifFormulaireValide()) &&
                        styles.opacityDisabled,
                    ]}
                    onPress={() => {
                      if (!verifFormulaireValide()) return;
                      handleSubmit();
                    }}
                    disabled={
                      formulaireEnChargement || !verifFormulaireValide()
                    }
                  >
                    {formulaireEnChargement ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>{t('save')}</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
    searchWrapper: {
      marginBottom: SPACING.md * scale,
    },
    searchInput: {
      marginBottom: 0,
    },
    listContainer: {
      paddingBottom: SPACING.xl * scale,
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
    modalSheet: {
      backgroundColor: COLORS.background,
      borderTopLeftRadius: 24 * scale,
      borderTopRightRadius: 24 * scale,
      padding: SPACING.lg * scale,
      paddingBottom: SPACING.xl * scale,
      borderWidth: 1,
      borderColor: COLORS.border,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.lg * scale,
      paddingBottom: SPACING.md * scale,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    formTitle: {
      fontSize: 18 * scale,
      fontWeight: '800',
      color: COLORS.text,
    },
    closeBtn: {
      padding: 8 * scale,
    },
    closeBtnText: {
      color: COLORS.primary,
      fontWeight: '600',
      fontSize: 14 * scale,
    },
    submitBtn: {
      marginTop: SPACING.md * scale,
      paddingVertical: 14 * scale,
      borderRadius: SIZES.radius * scale,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
    },
    submitBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15 * scale,
    },
    iconCircleTransparent: { backgroundColor: 'transparent' },
    emojiText: { fontSize: 24 },
    formRow: { flexDirection: 'row', gap: 10 },
    flex1: { flex: 1 },
    opacityDisabled: { opacity: 0.7 },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 55,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: SIZES.radius,
      paddingHorizontal: SPACING.md,
      gap: 12 * scale,
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
    checkboxActive: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    checkboxLabel: {
      color: COLORS.text,
      fontSize: 14,
      fontWeight: '500',
    },
    disabledInput: {
      opacity: 0.5,
    },
    inputLabel: {
      fontSize: 14,
      color: COLORS.text,
      marginBottom: SPACING.xs,
      fontWeight: '500',
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
      marginBottom: SPACING.md
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
    sectionRelative: {
      position: 'relative',
    },
    dropdownAbsolute: {
      position: 'absolute',
      zIndex: 999,
      elevation: 10, // Android fix
    },
    scrollMaxHeight150: {
      maxHeight: 150,
    },
    scrollMaxHeight250: {
      maxHeight: 250,
    },
    dropdownHeight55: {
      height: 55,
    },
  });
};

export default VehiculeManagementScreen;
