import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform, useWindowDimensions, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, ScrollView } from 'react-native';
import ScreenContainer from '../../components/common/ScreenContainer';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { ApiService } from '../../api/api';
import { SPACING, SIZES } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import { FileText, Search } from 'lucide-react-native';
import Svg, { Path, Polyline, Line } from 'react-native-svg';
import { getScale } from '../../utils/responsive';
import { useRef } from 'react';
import { LayoutRectangle } from 'react-native';
import { ChevronDown, MapPin } from 'lucide-react';

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

const Trash2Icon = ({ size = 24, color = "#000000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18" />
    <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <Line x1="10" y1="11" x2="10" y2="17" />
    <Line x1="14" y1="11" x2="14" y2="17" />
  </Svg>
);

interface Emplacement {
  id: number;
  nom: string;
  adresse?: string;
  ville?: string;
  province?: string;
  code_postal?: string;
  description?: string;
}

const regexCodePostal = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
const regexProvince = /^[A-Z]{2}$/;

const PROVINCES = ['QC', 'ON', 'NB', 'NS', 'PE', 'NL', 'MB', 'SK', 'AB', 'BC', 'YT', 'NT', 'NU', 'Autre'];

const EmplacementManagementScreen = ({ navigation }: any) => {
  const { width } = useWindowDimensions();
  const { COLORS, t } = useSettings();
  const styles = getStyles(COLORS, width);
  const [emplacements, setEmplacements] = useState<Emplacement[]>([]);
  const [filteredEmplacements, setFilteredEmplacements] = useState<Emplacement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour la recherche et pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 5;
  
  // États du formulaire d'ajout/modification
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('Québec');
  const [province, setProvince] = useState('QC');
  const [codePostal, setCodePostal] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  //États et ref pour dropdown de province
  const [provinceEstOuvert, setProvinceEstOuvert] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState<LayoutRectangle | null>(null);
  const dropdownRef = useRef<View>(null);

  useEffect(() => {
    fetchEmplacements();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredEmplacements(emplacements);
    } else {
      const s = search.toLowerCase();
      setFilteredEmplacements(
        emplacements.filter(e => 
          e.nom.toLowerCase().includes(s) || 
          (e.adresse && e.adresse.toLowerCase().includes(s))
        )
      );
    }
    setPage(1); // Reset page on search
  }, [search, emplacements]);

  // Récupère la liste de toutes les zones
  const fetchEmplacements = async () => {
    setLoading(true);
    try {
      const data = await ApiService.adminGetEmplacements();
      setEmplacements(data);
      setFilteredEmplacements(data);
    } catch (error) {
      console.error("Erreur chargement emplacements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (emplacement?: Emplacement) => {
    if (emplacement) {
      setEditingId(emplacement.id);
      setNom(emplacement.nom);
      setAdresse(emplacement.adresse || '');
      setVille(emplacement.ville || 'Québec');
      setProvince(emplacement.province || 'QC');
      setCodePostal(emplacement.code_postal || '');
      setDescription(emplacement.description || '');
    } else {
      setEditingId(null);
      setNom('');
      setAdresse('');
      setVille('Québec');
      setProvince('QC');
      setCodePostal('');
      setDescription('');
    }
    setIsFormVisible(true);
  };

  const handleCloseForm = () => {
    setIsFormVisible(false);
    setEditingId(null);
    setNom('');
    setAdresse('');
    setVille('Québec');
    setProvince('QC');
    setCodePostal('');
    setDescription('');
  };

  // Gère la soumission du formulaire (création ou modification)
  const handleSubmit = async () => {
    if (!verifFormulaireValide()) {
      Alert.alert(
        t('error'),
        'Veuillez corriger les champs invalides'
      );

      return;
    }

    setFormLoading(true);
    try {
      const payload = { 
        nom, 
        adresse: adresse || undefined,
        ville: ville || undefined,
        province: province || undefined,
        code_postal: codePostal || undefined,
        description: description || undefined
      };
      if (editingId) {
        await ApiService.adminUpdateEmplacement(editingId, payload);
      } else {
        await ApiService.adminCreateEmplacement(payload);
      }
      handleCloseForm();
      fetchEmplacements();
    } catch (error) {
      console.error("Erreur sauvegarde emplacement:", error);
      Alert.alert(t('error'), t('err_save'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('confirm_delete_zone'))) {
        confirmDelete(id);
      }
    } else {
      Alert.alert(
        t('delete_label'),
        t('confirm_delete_zone'),
        [
          { text: t('cancel'), style: "cancel" },
          { text: t('delete_label'), style: "destructive", onPress: () => confirmDelete(id) }
        ]
      );
    }
  };

  const confirmDelete = async (id: number) => {
    try {
      await ApiService.adminDeleteEmplacement(id);
      fetchEmplacements();
    } catch (error) {
      console.error("Erreur suppression:", error);
      Alert.alert(t('error'), t('err_delete_zone'));
    }
  };

  const renderEmplacement = ({ item }: { item: Emplacement }) => (
    <Card style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.iconCircle}>
          <MapPin size={20} color="#FFFFFF" />
        </View>
        <View style={styles.cardDetails}>
          <Text style={styles.cardTitle}>#{item.id} - {item.nom}</Text>
          <Text style={styles.cardSubtitle}>
            {item.adresse || t('zone_no_address')}
            {item.ville ? `, ${item.ville}` : ''}
            {item.province ? ` (${item.province})` : ''}
            {item.code_postal ? `  ${item.code_postal}` : ''}
          </Text>
          {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.editBtn]} 
            onPress={() => handleOpenForm(item)}
          >
            <PencilIcon size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.deleteBtn]} 
            onPress={() => handleDelete(item.id)}
          >
            <Trash2Icon size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  //Vérif
  const verifNom = () => {
    return nom.trim().length > 0;
  };

  //Vérif
  const verifVille = () => {
    return ville.trim().length > 0;
  };

  //Méthode appellée pour vérifier les champs du formulaire avant de le soumettre
  const verifFormulaireValide = () => {
    return verifNom() && verifVille();
  };

  return (
    <ScreenContainer scrollable={false} title={t('zones_title')} withBackButton typePageAccess={"Admin"}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('admin_zones')}</Text>
          <Text style={styles.subtitle}>{t('zones_subtitle')}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenForm()}>
          <PlusIcon size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>{t('new')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <Input
          placeholder={t('zones_search')}
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
          data={filteredEmplacements.slice((page - 1) * limit, page * limit)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderEmplacement}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>{t('zones_none')}</Text>
            </View>
          }
        />
      )}

      {/* Pagination */}
      {Math.ceil(filteredEmplacements.length / limit) > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
            onPress={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeftIcon size={18} color={page === 1 ? COLORS.textLight : "#FFFFFF"} />
          </TouchableOpacity>

          <Text style={styles.pageInfo}>
            Page {page} / {Math.ceil(filteredEmplacements.length / limit) || 1}
          </Text>

          <TouchableOpacity
            style={[styles.pageBtn, page >= Math.ceil(filteredEmplacements.length / limit) && styles.pageBtnDisabled]}
            onPress={() => setPage(p => Math.min(Math.ceil(filteredEmplacements.length / limit), p + 1))}
            disabled={page >= Math.ceil(filteredEmplacements.length / limit)}
          >
            <ChevronRightIcon size={18} color={page >= Math.ceil(filteredEmplacements.length / limit) ? COLORS.textLight : "#FFFFFF"} />
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
                      {editingId ? t('zone_edit') : t('zone_new')}
                    </Text>
                    <TouchableOpacity onPress={handleCloseForm} style={styles.closeBtn}>
                      <Text style={styles.closeBtnText}>{t('cancel')}</Text>
                    </TouchableOpacity>
                  </View>

                  <Input
                    placeholder={t('zone_name')}
                    value={nom}
                    onChangeText={setNom}
                    label={t('zone_name_label')}
                    error={
                      verifNom() ? undefined : 'Veuillez entrer un nom'
                    }
                  />
                  <Input
                    placeholder={t('zone_address')}
                    value={adresse}
                    onChangeText={setAdresse}
                    label={t('zone_address_label')}
                  />
                  <View style={styles.formRow}>
                    <View style={styles.flex1}>
                      <Input
                        placeholder={t('zone_city_ph')}
                        value={ville}
                        onChangeText={setVille}
                        label={t('zone_city')}
                        error={
                          verifVille() ? undefined : 'Veuillez entrer une ville'
                        }
                      />
                    </View>
                    <View style={styles.flex1}>
                      <View style={styles.flex1}>
                        <Text style={styles.inputLabel}>
                          {t('zone_province_label')}
                        </Text>

                        <TouchableOpacity
                          ref={dropdownRef}
                          style={[
                            styles.dropdownHeader,
                            provinceEstOuvert &&
                            styles.dropdownHeaderOpen,
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
                        >
                          <Text style={styles.selectedText}>
                            {province}
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
                                        dropdownLayout.y +
                                        dropdownLayout.height,
                                      left: dropdownLayout.x,
                                      width: dropdownLayout.width,
                                    },
                                  ]}
                                >
                                  <View style={styles.dropdownList}>
                                    <ScrollView
                                      style={styles.scrollMaxHeight150}
                                    >
                                      {PROVINCES.map(p => (
                                        <TouchableOpacity
                                          key={p}
                                          style={[
                                            styles.dropdownItem,
                                            province === p &&
                                            styles.dropdownItemActive,
                                          ]}
                                          onPress={() => {
                                            setProvince(p);
                                            setProvinceEstOuvert(false);
                                          }}
                                        >
                                          <Text
                                            style={[
                                              styles.dropdownText,
                                              province === p &&
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
                  </View>
                  <Input
                    placeholder={t('zone_postal_ex')}
                    value={codePostal}
                    onChangeText={setCodePostal}
                    label={t('zone_postal')}
                    autoCapitalize="characters"
                  />
                  <Input
                    placeholder={t('zone_desc')}
                    value={description}
                    onChangeText={setDescription}
                    label={t('zone_desc_label')}
                  />

                  <TouchableOpacity
                    style={[styles.submitBtn, (formLoading || !verifFormulaireValide()) && styles.opacityDisabled]}
                    onPress={() => {
                      if (!verifFormulaireValide()) return;
                      handleSubmit();
                    }}
                    disabled={formLoading || !verifFormulaireValide()}
                  >
                    {formLoading ? (
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
    backgroundColor: '#22c55e',
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

export default EmplacementManagementScreen;
