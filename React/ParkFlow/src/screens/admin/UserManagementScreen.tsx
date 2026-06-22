import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, useWindowDimensions, Alert, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import ScreenContainer from '../../components/common/ScreenContainer';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { ApiService } from '../../api/api';
import { Utilisateur } from '../../types/database';
import { SPACING, SIZES } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import { Search, ShieldCheck, Clock, ChevronDown } from 'lucide-react-native';
import Svg, { Polyline, Path, Line } from 'react-native-svg';
import { getScale } from '../../utils/responsive';
import { BriefcaseBusiness, Crown, User } from 'lucide-react';

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
    <Polyline points="15 18 9 12 15 6" />
  </Svg>
);

const ChevronRightIcon = ({ size = 24, color = "#000000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);

const UserManagementScreen = () => {
  const { width } = useWindowDimensions();
  const { COLORS, t } = useSettings();
  const styles = getStyles(COLORS, width);
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination et filtres
  const [search, setSearch] = useState('');
  const [roleId, setRoleId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 5;

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [accessDenied, setAccessDenied] = useState(false);

  // État du menu déroulant pour le filtre des rôles
  const [showRoleFilter, setShowRoleFilter] = useState(false);

  const ROLES = [
    { id: undefined, nom: 'Tous les rôles' },
    { id: 1, nom: 'Public' },
    { id: 2, nom: 'Employé' },
    { id: 3, nom: 'Admin' }
  ];

  // On met un délai (debounce) pour ne pas spammer l'API à chaque frappe
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // On revient à la première page lors d'une nouvelle recherche
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Récupération de la liste des utilisateurs depuis le backend
  const fetchUsers = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const skip = (page - 1) * limit;
      const res = await ApiService.getUsers(skip, limit, roleId, debouncedSearch);
      setUsers(res.items);
      setTotal(res.total);
    } catch (error: any) {
      if (error?.response?.status === 403 || error?.status === 403) {
        setAccessDenied(true);
      }
      console.error("Erreur chargement utilisateurs:", error);
    } finally {
      setLoading(false);
    }
  };

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nom: '', prenom: '', email: '', numero_telephone: '', roleId: undefined as number | undefined, estActif: true });
  const [formLoading, setFormLoading] = useState(false);

  const handleOpenForm = (user: Utilisateur) => {
    setEditingUserId(user.id);
    setEditForm({
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email || '',
      numero_telephone: user.telephone || '',
      roleId: user.role?.id,
      estActif: user.est_actif !== false
    });
    setIsFormVisible(true);
  };

  const handleCloseForm = () => {
    setIsFormVisible(false);
    setEditingUserId(null);
  };

  const handleSaveUserInfo = async () => {
    if (!editingUserId) return;
    setFormLoading(true);
    try {
      await ApiService.adminUpdateUtilisateur(editingUserId, {
        nom: editForm.nom,
        prenom: editForm.prenom,
        email: editForm.email,
        numero_telephone: editForm.numero_telephone
      });
      
      const user = users.find(u => u.id === editingUserId);
      if (user && user.role?.id !== editForm.roleId && editForm.roleId !== undefined) {
        await ApiService.adminUpdateUserRole(editingUserId, editForm.roleId);
      }
      if (user && user.est_actif !== editForm.estActif) {
        await ApiService.adminUpdateUserActif(editingUserId);
      }

      handleCloseForm();
      fetchUsers();
    } catch {
      Alert.alert(t('error'), t('err_user_update'));
    } finally {
      setFormLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleId, debouncedSearch]);



  const handleDeleteUser = async (userId: number) => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir désactiver cet utilisateur ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Désactiver",
          style: "destructive",
          onPress: async () => {
            try {
              await ApiService.adminDeleteUser(userId);
              fetchUsers();
            } catch {
              Alert.alert(t('error'), t('err_user_deactivate'));
            }
          }
        }
      ]
    );
  };

  const renderDate = (dateString: string | undefined) => {
    if (!dateString) return "Date inconnue";
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? "Date inconnue" : d.toLocaleDateString('fr-CA');
  };

  const getIconeUtilisateur = (rId?: number) => {
    switch (rId) {
      //Admin
      case 3: return (
        <View style={[styles.iconCircleAdmin]}>
          <Crown size={20} color="#FFFFFF" />
        </View>
      );
      //Employé
      case 2: return (
        <View style={[styles.iconCircleEmploye]}>
          <BriefcaseBusiness size={20} color="#FFFFFF" />
        </View>
      );
      //Utilisateur
      default: return (
        <View style={[styles.iconCircle]}>
          <User size={20} color="#FFFFFF" />
        </View>
      );
    }
  };

  const renderUser = ({ item }: { item: Utilisateur }) => {
    return (
      <Card style={styles.userCard}>
        <View style={styles.userInfoTop}>
          {getIconeUtilisateur(item.role?.id)}
          <View style={styles.userDetails}>
            <View style={styles.userViewContainer}>
              <Text style={[styles.userIdText, styles.mb4]}>#{item.id} - {ROLES.find(r => r.id === item.role?.id)?.nom}</Text>
              <Text style={[styles.userSubText, styles.userSubTextMain]}>
                <Text style={styles.boldText}>{t('user_prenom_colon')} </Text>{item.prenom || 'N/A'}
              </Text>
              <Text style={[styles.userSubText, styles.userSubTextMain]}>
                <Text style={styles.boldText}>{t('user_nom_colon')} </Text>{item.nom || 'N/A'}
              </Text>
              <Text style={[styles.userSubText, styles.userSubTextMain]}>
                <Text style={styles.boldText}>{t('user_address_colon')} </Text>{item.email}
              </Text>
              <Text style={[styles.userSubText, styles.userSubTextMain]}>
                <Text style={styles.boldText}>{t('user_phone_colon')} </Text>{item.telephone || 'N/A'}
              </Text>
            </View>
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
              onPress={() => handleDeleteUser(item.id)}
            >
              <Trash2Icon size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.userInfoBottom}>
          <View style={styles.datesColumn}>
            <View style={styles.bottomLeft}>
              <Clock size={12} color={COLORS.textLight} />
              <Text style={styles.dateText}>
                Inscrit le {renderDate(item.date_inscription)}
              </Text>
            </View>
          </View>

          {/* Badges */}
          <View style={styles.badgesRow}>
            <View style={[styles.roleBadge, item.est_actif === false && styles.inactiveBadge]}>
              <ShieldCheck size={12} color="#FFFFFF" />
              <Text style={styles.roleText}>
                {String(item.role?.nom || 'N/A').toUpperCase()}
              </Text>
            </View>

            {item.est_actif === false && (
              <View style={[styles.roleBadge, styles.errorBadge]}>
                <Text style={styles.roleText}>INACTIF</Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  };

  if (accessDenied) {
    return (
      <ScreenContainer scrollable={false} title={t('users_access_denied')} withBackButton typePageAccess="Visiteur">
        <View style={styles.centerContainer}>
          <ShieldCheck size={64} color={COLORS.primary} style={styles.shieldMargin} />
          <Text style={styles.title}>{t('users_forbidden')}</Text>
          <Text style={[styles.subtitle, styles.subtitleCentered]}>
            Vous devez être administrateur pour accéder à cette page.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false} title={t('users_title')} withBackButton typePageAccess={"Utilisateurs"}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('admin_users')}</Text>
        <Text style={styles.subtitle}>{t('users_subtitle')}</Text>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.searchWrapper}>
          <Input
            placeholder={t('users_search')}
            value={search}
            onChangeText={setSearch}
            containerStyle={styles.searchInput}
            icon={<Search size={18} color={COLORS.textLight} />}
          />
        </View>

        <View style={styles.roleFilterWrapper}>
          <TouchableOpacity
            style={styles.roleFilterButton}
            onPress={() => setShowRoleFilter(!showRoleFilter)}
            activeOpacity={0.8}
          >
            <Text style={styles.roleFilterText}>
              {ROLES.find(r => r.id === roleId)?.nom}
            </Text>
            <ChevronDown size={16} color={COLORS.textLight} />
          </TouchableOpacity>

          {showRoleFilter && (
            <View style={styles.roleDropdown}>
              {ROLES.map((role, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.roleOption}
                  onPress={() => {
                    setRoleId(role.id);
                    setPage(1);
                    setShowRoleFilter(false);
                  }}
                >
                  <Text style={[styles.roleOptionText, roleId === role.id && styles.roleOptionActive]}>
                    {role.nom}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {loading && users.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUser}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>{t('users_none')}</Text>
            </View>
          }
        />
      )}

      {/* Pagination */}
      {Math.ceil(total / limit) > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
            onPress={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeftIcon size={18} color={page === 1 ? COLORS.textLight : "#FFFFFF"} />
          </TouchableOpacity>

          <Text style={styles.pageInfo}>
            Page {page} / {Math.ceil(total / limit) || 1}
          </Text>

          <TouchableOpacity
            style={[styles.pageBtn, page >= Math.ceil(total / limit) && styles.pageBtnDisabled]}
            onPress={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
            disabled={page >= Math.ceil(total / limit)}
          >
            <ChevronRightIcon size={18} color={page >= Math.ceil(total / limit) ? COLORS.textLight : "#FFFFFF"} />
          </TouchableOpacity>
        </View>
      )}

      {/* Modal formulaire modification utilisateur */}
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
                    <Text style={styles.formTitle}>{t('users_edit')}</Text>
                    <TouchableOpacity onPress={handleCloseForm} style={styles.closeBtn}>
                      <Text style={styles.closeBtnText}>{t('cancel')}</Text>
                    </TouchableOpacity>
                  </View>

                  <Input
                    placeholder={t('user_first_name_ph')}
                    value={editForm.prenom}
                    onChangeText={(txt) => setEditForm({ ...editForm, prenom: txt })}
                    label={t('first_name')}
                  />
                  <Input
                    placeholder={t('last_name')}
                    value={editForm.nom}
                    onChangeText={(txt) => setEditForm({ ...editForm, nom: txt })}
                    label={t('last_name')}
                  />
                  <Input
                    placeholder={t('email')}
                    value={editForm.email}
                    onChangeText={(txt) => setEditForm({ ...editForm, email: txt })}
                    label={t('user_address_label')}
                  />
                  <Input
                    placeholder={t('user_phone_ph')}
                    value={editForm.numero_telephone}
                    onChangeText={(txt) => setEditForm({ ...editForm, numero_telephone: txt.replace(/[^\d\s-]/g, '') })}
                    keyboardType="phone-pad"
                    label={t('user_phone_label')}
                  />

                  <Text style={styles.inputLabelModal}>{t('user_role_colon')}</Text>
                  <View style={[styles.roleEditContainer, styles.mb16]}>
                    {[1, 2, 3].map((rId) => (
                      <TouchableOpacity
                        key={rId}
                        style={[
                          styles.roleOptionBtn,
                          editForm.roleId === rId && styles.roleOptionBtnActive,
                          styles.primaryBorderStyle,
                          styles.roleOptionBtnModal
                        ]}
                        onPress={() => setEditForm({...editForm, roleId: rId})}
                      >
                        <Text style={[
                          styles.roleOptionBtnText,
                          editForm.roleId === rId && styles.whiteText,
                          styles.roleOptionBtnTextModal
                        ]}>
                          {rId === 1 ? 'Public' : rId === 2 ? (t('agent_role')) : 'Admin'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabelModal}>{t('user_status_colon')}</Text>
                  <View style={styles.roleEditContainer}>
                    <TouchableOpacity
                      style={[
                        styles.roleOptionBtn,
                        editForm.estActif && styles.roleOptionBtnActive,
                        styles.primaryBorderStyle,
                        styles.roleOptionBtnModal
                      ]}
                      onPress={() => setEditForm({...editForm, estActif: true})}
                    >
                      <Text style={[
                        styles.roleOptionBtnText,
                        editForm.estActif && styles.whiteText,
                        styles.roleOptionBtnTextModal
                      ]}>{t('active').toUpperCase()}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleOptionBtn,
                        !editForm.estActif && styles.errorActiveStyle,
                        editForm.estActif && styles.errorBorderStyle,
                        styles.roleOptionBtnModal
                      ]}
                      onPress={() => setEditForm({...editForm, estActif: false})}
                    >
                      <Text style={[
                        styles.roleOptionBtnText,
                        !editForm.estActif ? styles.whiteText : styles.errorTextStyle,
                        styles.roleOptionBtnTextModal
                      ]}>{t('inactive').toUpperCase()}</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, formLoading && styles.opacity70]}
                    onPress={handleSaveUserInfo}
                    disabled={formLoading}
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
    filtersContainer: {
      marginBottom: SPACING.md * scale,
      zIndex: 10, // For the dropdown
    },
    searchWrapper: {
      marginBottom: SPACING.sm * scale,
    },
    searchInput: {
      marginBottom: 0,
    },
    roleFilterWrapper: {
      position: 'relative',
    },
    roleFilterButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: SIZES.radius * scale,
      paddingHorizontal: SPACING.md * scale,
      paddingVertical: 12 * scale,
    },
    roleFilterText: {
      color: COLORS.text,
      fontSize: 14 * scale,
      fontWeight: '600',
    },
    roleDropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: SIZES.radius * scale,
      marginTop: 4 * scale,
      overflow: 'hidden',
    },
    roleOption: {
      paddingVertical: 12 * scale,
      paddingHorizontal: SPACING.md * scale,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    roleOptionText: {
      color: COLORS.textLight,
      fontSize: 14 * scale,
    },
    roleOptionActive: {
      color: COLORS.primary,
      fontWeight: '700',
    },
    listContainer: {
      paddingBottom: SPACING.xl * scale,
    },
    userCard: {
      padding: SPACING.md * scale,
      marginBottom: SPACING.sm * scale,
    },
    userInfoTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.sm * scale,
    },
    avatarCircle: {
      width: 40 * scale,
      height: 40 * scale,
      borderRadius: 20 * scale,
      backgroundColor: COLORS.primary + '30',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.md * scale,
    },
    avatarCircleTransparent: {
      backgroundColor: 'transparent',
    },
    userDetails: {
      flex: 1,
    },
    emojiText: {
      fontSize: 24 * scale,
    },
    userNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8 * scale,
      marginBottom: 2 * scale,
    },
    userName: {
      fontSize: 16 * scale,
      fontWeight: '700',
      color: COLORS.text,
    },
    userIdText: {
      fontSize: 12 * scale,
      color: COLORS.textLight,
      fontWeight: '600',
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4 * scale,
    },
    userSubText: {
      fontSize: 12 * scale,
      color: COLORS.textLight,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4 * scale,
      backgroundColor: COLORS.primary,
      paddingHorizontal: 8 * scale,
      paddingVertical: 4 * scale,
      borderRadius: 12 * scale,
    },
    roleText: {
      color: '#FFFFFF',
      fontSize: 10 * scale,
      fontWeight: '800',
    },
    userInfoBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: SPACING.sm * scale,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },
    bottomLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6 * scale,
    },
    dateText: {
      fontSize: 11 * scale,
      color: COLORS.textLight,
    },
    inputLabel: {
      fontSize: 12 * scale,
      fontWeight: '600',
      color: COLORS.textLight,
      marginBottom: 4 * scale,
      marginLeft: 4 * scale,
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
      backgroundColor: COLORS.primary,
    },
    restoreBtn: {
      backgroundColor: '#10b981', // Vert pour réactiver
    },
    roleEditContainer: {
      flexDirection: 'row',
      gap: 4 * scale,
    },
    roleOptionBtn: {
      paddingHorizontal: 8 * scale,
      paddingVertical: 4 * scale,
      borderRadius: 6 * scale,
      borderWidth: 1,
    },
    roleOptionBtnActive: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    roleOptionBtnText: {
      fontSize: 10 * scale,
      fontWeight: '800',
      color: COLORS.text,
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
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    pageInfo: {
      color: COLORS.text,
      fontSize: 14 * scale,
      fontWeight: '600',
    },
    editFormWrapper: { gap: 8, paddingRight: 8 },
    saveBtnInner: { backgroundColor: COLORS.primary, width: '100%', height: 40, marginTop: 4 },
    saveBtnText: { color: '#FFF', fontWeight: 'bold' },
    userViewContainer: { gap: 4, paddingVertical: 4 },
    mb4: { marginBottom: 4 },
    userSubTextMain: { color: COLORS.text, fontSize: 13 },
    boldText: { fontWeight: 'bold' },
    opacity70: { opacity: 0.7 },
    badgesRow: { flexDirection: 'row', gap: 6 },
    inactiveBadge: { backgroundColor: COLORS.border },
    errorBadge: { backgroundColor: COLORS.error || '#ef4444' },
    editActionsColumn: { flexDirection: 'column', gap: 6, alignItems: 'flex-end' },
    primaryBorderStyle: { borderColor: COLORS.primary },
    whiteText: { color: '#FFFFFF' },
    errorActiveStyle: { backgroundColor: COLORS.error || '#ef4444', borderColor: COLORS.error || '#ef4444' },
    errorBorderStyle: { borderColor: COLORS.error || '#ef4444' },
    errorTextStyle: { color: COLORS.error || '#ef4444' },
    shieldMargin: { marginBottom: 20 },
    subtitleCentered: { textAlign: 'center', marginTop: 10 },
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
      marginTop: SPACING.xl * scale,
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
    inputLabelModal: {
      fontSize: 14 * scale,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: 8 * scale,
      marginLeft: 4 * scale,
      marginTop: 8 * scale,
    },
    roleOptionBtnModal: {
      paddingVertical: 8 * scale,
      paddingHorizontal: 16 * scale,
      borderRadius: 8 * scale,
    },
    roleOptionBtnTextModal: {
      fontSize: 12 * scale,
    },
    mb16: {
      marginBottom: 16 * scale,
    },
    iconCircle: {
      width: 40 * scale,
      height: 40 * scale,
      borderRadius: 20 * scale,
      backgroundColor: '#3b82f6',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.md * scale,
    },
    iconCircleAdmin: {
      width: 40 * scale,
      height: 40 * scale,
      borderRadius: 20 * scale,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.md * scale,
    },
    iconCircleEmploye: {
      width: 40 * scale,
      height: 40 * scale,
      borderRadius: 20 * scale,
      backgroundColor: '#a855f7',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.md * scale,
    },
    datesColumn: {
      flexDirection: 'column',
      gap: 4,
    },
  });
};

export default UserManagementScreen;
