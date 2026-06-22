import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, useWindowDimensions, Platform, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, ScrollView } from 'react-native';
import ScreenContainer from '../../components/common/ScreenContainer';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { ApiService } from '../../api/api';
import { SPACING, SIZES } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import { Search, FileText } from 'lucide-react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { RaisonContravention } from '../../types/database';
import { getScale } from '../../utils/responsive';

const PlusIcon = ({ size = 24, color = "#000000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
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

const ChevronLeftIcon = ({ size = 24, color = "#000000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m15 18-6-6 6-6"/>
  </Svg>
);

const ChevronRightIcon = ({ size = 24, color = "#000000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m9 18 6-6-6-6"/>
  </Svg>
);

const RaisonManagementScreen = () => {
  const { width } = useWindowDimensions();
  const { COLORS, t } = useSettings();
  const styles = getStyles(COLORS, width);
  const [raisons, setRaisons] = useState<RaisonContravention[]>([]);
  const [filteredRaisons, setFilteredRaisons] = useState<RaisonContravention[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour la recherche
  const [search, setSearch] = useState('');
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // États du formulaire
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [montant, setMontant] = useState('');
  const [formLoading, setFormLoading] = useState(false);


  const [nomEstModifie, setNomEstModifie] = useState(false);
  const [montantEstModifie, setMontantEstModifie] = useState(false);

  useEffect(() => {
    fetchRaisons();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Réinitialiser à la première page lors d'une recherche
    if (search.trim() === '') {
      setFilteredRaisons(raisons);
    } else {
      const s = search.toLowerCase();
      setFilteredRaisons(
        raisons.filter(r => 
          r.nom.toLowerCase().includes(s) || 
          (r.description && r.description.toLowerCase().includes(s))
        )
      );
    }
  }, [search, raisons]);

  // Calcul pour la pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedRaisons = filteredRaisons.slice(startIndex, endIndex);
  const totalPages = Math.max(1, Math.ceil(filteredRaisons.length / itemsPerPage));

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const fetchRaisons = async () => {
    setLoading(true);
    try {
      const data = await ApiService.adminGetRaisons();
      setRaisons(data);
      setFilteredRaisons(data);
    } catch (error) {
      console.error("Erreur chargement raisons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (raison?: RaisonContravention) => {
    if (raison) {
      setEditingId(raison.id);
      setNom(raison.nom);
      setDescription(raison.description || '');
      setMontant(raison.montant ? raison.montant.toString() : '');
    } else {
      setEditingId(null);
      setNom('');
      setDescription('');
      setMontant('');
    }
    setIsFormVisible(true);
  };

  const handleCloseForm = () => {
    setIsFormVisible(false);
    setEditingId(null);
    setNom('');
    setDescription('');
    setMontant('');
  };

  const handleSubmit = async () => {
    if (!nom.trim() || !montant.trim()) {
      Alert.alert(t('error'), t('err_name_amount'));
      return;
    }

    setFormLoading(true);
    try {
      const payload = { 
        nom, 
        description: description || undefined,
        montant: parseFloat(montant)
      };
      if (editingId) {
        await ApiService.adminUpdateRaison(editingId, payload);
      } else {
        await ApiService.adminCreateRaison(payload);
      }
      handleCloseForm();
      fetchRaisons();
    } catch (error) {
      console.error("Erreur sauvegarde raison:", error);
      Alert.alert(t('error'), t('err_save_reason'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('confirm_delete'))) {
        confirmDelete(id);
      }
    } else {
      Alert.alert(
        t('delete_label'),
        t('confirm_delete'),
        [
          { text: t('cancel'), style: "cancel" },
          { text: t('delete_label'), style: "destructive", onPress: () => confirmDelete(id) }
        ]
      );
    }
  };

  const confirmDelete = async (id: number) => {
    try {
      await ApiService.adminDeleteRaison(id);
      fetchRaisons();
    } catch (error) {
      console.error("Erreur suppression:", error);
      Alert.alert(t('error'), t('err_delete_reason'));
    }
  };

  const renderRaison = ({ item }: { item: RaisonContravention }) => (
    <Card style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.iconCircle}>
          <FileText size={20} color="#FFFFFF" />
        </View>
        <View style={styles.cardDetails}>
          <Text style={styles.cardTitle}>#{item.id} - {item.nom}</Text>
          <Text style={styles.cardSubtitle}>
            {t('reason_amount')} : {item.montant} $
          </Text>
          {/* @ts-ignore : description is optional but typed strictly in some places */}
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
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
  const verifMontant = () => {
    if (!montant.trim()) return false;

    const valeur = Number(montant.replace(',', '.'));
    return !isNaN(valeur) && valeur > 0;
  };

  //Méthode appellée pour vérifier les champs du formulaire avant de le soumettre
  const verifFormulaireValide = () => {
    return verifNom() && verifMontant();
  }


  return (
    <ScreenContainer scrollable={false} title={t('reasons_title')} withBackButton typePageAccess={"Admin"}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('admin_reasons')}</Text>
          <Text style={styles.subtitle}>{t('reasons_subtitle')}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenForm()}>
          <PlusIcon size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>{t('new')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <Input
          placeholder={t('reasons_search')}
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
          data={displayedRaisons}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRaison}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>{t('reasons_none')}</Text>
            </View>
          }
        />
      )}

      {!loading && filteredRaisons.length > 0 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity 
            style={[styles.paginationBtn, currentPage === 1 && styles.paginationBtnDisabled]} 
            onPress={goToPrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeftIcon size={20} color={currentPage === 1 ? COLORS.textLight : COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.paginationText}>
            Page {currentPage} sur {totalPages}
          </Text>
          <TouchableOpacity 
            style={[styles.paginationBtn, currentPage === totalPages && styles.paginationBtnDisabled]} 
            onPress={goToNextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronRightIcon size={20} color={currentPage === totalPages ? COLORS.textLight : COLORS.primary} />
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
                      {editingId ? t('reason_edit') : t('reason_new')}
                    </Text>
                    <TouchableOpacity onPress={handleCloseForm} style={styles.closeBtn}>
                      <Text style={styles.closeBtnText}>{t('cancel')}</Text>
                    </TouchableOpacity>
                  </View>

                  <Input
                    placeholder={t('reason_name')}
                    value={nom}
                    onChangeText={setNom}
                    label={t('reason_name_label')}
                    error={!verifNom() ? t('Veuillez entrer un nom valide') : undefined}
                  />
                  <Input
                    placeholder={t('reason_amount')}
                    value={montant}
                    onChangeText={setMontant}
                    label={t('reason_amount') + ' *'}
                    keyboardType="numeric"
                    error={!verifMontant() ? t('Veuillez entrer un montant valide plus grand que 0') : undefined}
                  />
                  <Input
                    placeholder={t('zone_desc')}
                    value={description}
                    onChangeText={setDescription}
                    label={t('zone_desc_label')}
                  />

                  <TouchableOpacity
                    style={[styles.submitBtn, (formLoading || !verifFormulaireValide()) && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md * scale,
    gap: SPACING.md * scale,
  },
  paginationBtn: {
    padding: 8 * scale,
    borderRadius: SIZES.radius * scale,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paginationBtnDisabled: {
    opacity: 0.5,
    backgroundColor: 'transparent',
  },
  paginationText: {
    fontSize: 14 * scale,
    color: COLORS.text,
    fontWeight: '600',
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
  submitBtnDisabled: {
    opacity: 0.7,
  },
});
};

export default RaisonManagementScreen;
