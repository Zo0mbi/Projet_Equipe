import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Text, 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Animated,
  Platform,
  useWindowDimensions
} from 'react-native';
import { SPACING, SIZES } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import Card from '../../components/common/Card';
import ScreenContainer from '../../components/common/ScreenContainer';
import {
  Users,
  DollarSign,
  FileBarChart,
  Map,
  Shield,
  ArrowRight,
  Ticket,
  Car,
} from 'lucide-react-native';
import { ApiService } from '../../api/api';
import { useFocusEffect } from '@react-navigation/native';
import { getScale } from '../../utils/responsive';
import { FileText } from 'lucide-react';


const AdminDashboardScreen = ({ navigation }: any) => {
  const { COLORS, t } = useSettings();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = getStyles(COLORS, width, isMobile);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const getTop3 = (data?: Record<string, number>) => {
    if (!data) return [];

    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label, value]) => ({ label, value }));
  };

  const [mainStats, setMainStats] = useState<{
    total_contraventions: number;
    contraventions_aujourdhui: number;
    contraventions_7_derniers_jours: number;
    revenu_mois_courant_total: number;
    revenu_mois_courant_paye: number;
    leaderboard_agents: {
      agent_id: number;
      agent_prenom: string;
      agent_nom: string;
      montant_total: string;
      contraventions_count: number;
      avertissements_count: number;
    }[];
  }>({
    total_contraventions: 0,
    contraventions_aujourdhui: 0,
    contraventions_7_derniers_jours: 0,
    revenu_mois_courant_total: 0,
    revenu_mois_courant_paye: 0,
    leaderboard_agents: [],
  });

  const [contraventionStats, setContraventionStats] = useState({
    pourcentage_paye: "0",
    pourcentage_impaye: "0",
    contravention_par_emplacement: {},
    contravention_par_raison: {},
  });

  const topEmplacementsParContravention = getTop3(contraventionStats.contravention_par_emplacement);
  const topRaisonsParContravention = getTop3(contraventionStats.contravention_par_raison);

  const fetchData = async () => {
    try {
      const [main, contraventions] = await Promise.all([
        ApiService.getAdminStats(),
        ApiService.getContraventionStats()
      ]);

      setMainStats(main);
      setContraventionStats(contraventions);
    } catch (e) {
      console.error("Erreur lors du chargement des données admin:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    // Animation d'entrée globale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatNombre = (v: any) => Number(v ?? 0);

  const formatPourcentage = (v: any) => {
    const n = Number(v);
    if (!isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  };

  const stats = [
    {
      label: t('stat_revenue'),
      value: `$${formatNombre(mainStats.revenu_mois_courant_total).toFixed(2)}`,
      icon: DollarSign,
      color: '#22c55e',
      trend: t('trend_month'),
    },
    {
      label: t('stat_tickets_today'),
      value: String(mainStats.contraventions_aujourdhui ?? 0),
      icon: FileBarChart,
      color: COLORS.primary,
      trend: t('trend_today'),
    },
    {
      label: t('stat_tickets_total'),
      value: String(mainStats.total_contraventions ?? 0),
      icon: Users,
      color: '#3b82f6',
      trend: t('trend_global'),
    },
    {
      label: t('stat_tickets_week'),
      value: String(mainStats.contraventions_7_derniers_jours ?? 0),
      icon: Map,
      color: '#a855f7',
      trend: t('trend_week'),
    },
  ];




  return (
    <ScreenContainer scrollable={true} typePageAccess="Admin" withBackButton={false}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.headerBadge}>
            <Shield size={14} color={COLORS.primary} />
            <Text style={styles.headerBadgeText}>{t('admin_secure')}</Text>
          </View>
          <Text style={styles.mainTitle}>{t('admin_title')}<Text style={styles.primaryText}>{t('admin_title_highlight')}</Text></Text>
          <Text style={styles.subtitle}>{t('admin_subtitle')}</Text>
        </View>

        {/* Management Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('admin_quick_mgmt')}</Text>
        </View>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionButtonWrapper} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EmployeeDashboard')}
          >
            <View style={[styles.actionButton, styles.actionBtnBorderPrimary]}>
              <View style={[styles.actionIconBg, styles.actionBgPrimary]}>
                <FileBarChart color={COLORS.primary} size={24} />
              </View>
              <View style={styles.actionTextContent}>
                <Text style={styles.actionTitle}>{t('admin_agent_interface')}</Text>
                <Text style={styles.actionDesc}>{t('admin_agent_desc')}</Text>
              </View>
              <ArrowRight color={COLORS.textLight} size={18} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButtonWrapper} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('UserManagement')}
          >
            <View style={[styles.actionButton, styles.actionBtnBorderBlue]}>
              <View style={[styles.actionIconBg, styles.actionBgBlue]}>
                <Users color="#3b82f6" size={24} />
              </View>
              <View style={styles.actionTextContent}>
                <Text style={styles.actionTitle}>{t('admin_users')}</Text>
                <Text style={styles.actionDesc}>{t('admin_users_desc')}</Text>
              </View>
              <ArrowRight color={COLORS.textLight} size={18} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonWrapper}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ContraventionManagement')}
          >
            <View style={[styles.actionButton, styles.actionBtnBorderMauve]}>
              <View style={[styles.actionIconBg, styles.actionBgMauve]}>
                <Ticket color="#a855f7" size={24} />
              </View>
              <View style={styles.actionTextContent}>
                <Text style={styles.actionTitle}>{t('admin_contraventions')}</Text>
                <Text style={styles.actionDesc}>{t('admin_contraventions_desc')}</Text>
              </View>
              <ArrowRight color={COLORS.textLight} size={18} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonWrapper}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('VehiculeManagement')}
          >
            <View style={[styles.actionButton, styles.actionBtnBorderMauve]}>
              <View style={[styles.actionIconBg, styles.actionBgMauve]}>
                <Car color="#a855f7" size={24} />
              </View>
              <View style={styles.actionTextContent}>
                <Text style={styles.actionTitle}>{t('admin_vehicules')}</Text>
                <Text style={styles.actionDesc}>{t('admin_vehicules_desc')}</Text>
              </View>
              <ArrowRight color={COLORS.textLight} size={18} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButtonWrapper} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EmplacementManagement')}
          >
            <View style={[styles.actionButton, styles.actionBtnBorderVert]}>
              <View style={[styles.actionIconBg, styles.actionBgVert]}>
                <Map color="#22c55e" size={24} />
              </View>
              <View style={styles.actionTextContent}>
                <Text style={styles.actionTitle}>{t('admin_zones')}</Text>
                <Text style={styles.actionDesc}>{t('admin_zones_desc')}</Text>
              </View>
              <ArrowRight color={COLORS.textLight} size={18} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButtonWrapper} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('RaisonManagement')}
          >
            <View style={[styles.actionButton, styles.actionBtnBorderVert]}>
              <View style={[styles.actionIconBg, styles.actionBgVert]}>
                <FileText color="#22c55e" size={24} />
              </View>
              <View style={styles.actionTextContent}>
                <Text style={styles.actionTitle}>{t('admin_reasons')}</Text>
                <Text style={styles.actionDesc}>{t('admin_reasons_desc')}</Text>
              </View>
              <ArrowRight color={COLORS.textLight} size={18} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('stat_titre_global')}</Text>
        </View>

        {/* Statistiques générales */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <Card key={stat.label} style={[styles.statCard, { borderBottomWidth: 4, borderBottomColor: stat.color } as any]}>
              <View style={styles.statCardHeader}>
                <View style={[
                  styles.iconContainer, 
                  { backgroundColor: `${stat.color}15` },
                  Platform.OS === 'web' 
                    ? { boxShadow: `0px 4px 6px ${stat.color}66` } 
                    : { shadowColor: stat.color }
                ]}>
                  <stat.icon color={stat.color} size={22} strokeWidth={2.5} />
                </View>
                <View style={[styles.trendBadge, { backgroundColor: `${stat.color}10` }]}>
                  <Text style={[styles.trendText, { color: stat.color }]}>{stat.trend}</Text>
                </View>
              </View>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{stat.value}</Text>
              <Text style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit>{stat.label}</Text>
            </Card>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('stat_titre_contravention')}</Text>
        </View>

        {/* Ratio de contraventions payées et impayées */}
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, { borderBottomWidth: 4, borderBottomColor: '#22c55e', width: isMobile ? (width - 48 - 12) / 2 : (width - 48 - 24) / 3 } as any]}>
            <View style={styles.statCardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#22c55e15' },
                Platform.OS === 'web' ? { boxShadow: '0px 4px 6px #22c55e66' } : { shadowColor: '#22c55e' }]}>
                <DollarSign color="#22c55e" size={22} strokeWidth={2.5} />
              </View>
              <View style={[styles.trendBadge, { backgroundColor: '#22c55e10' }]}>
                <Text style={[styles.trendText, { color: '#22c55e' }]}>{t('trend_global')}</Text>
              </View>
            </View>
            <Text style={styles.statLabel}>{t('stat_paid')}</Text>
            <View style={styles.miniBar}>
              <View style={[styles.miniBarFill, { width: `${formatPourcentage(contraventionStats.pourcentage_paye)}%`, backgroundColor: '#22c55e' }]} />
            </View>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatPourcentage(contraventionStats.pourcentage_paye).toFixed(1)}%
            </Text>
            <Text style={[styles.statLabel, { marginTop: 10 }]}>{t('stat_unpaid')}</Text>
            <View style={styles.miniBar}>
              <View style={[styles.miniBarFill, { width: `${formatPourcentage(contraventionStats.pourcentage_impaye)}%`, backgroundColor: '#ef4444' }]} />
            </View>
            <Text style={[styles.statValue, { color: '#ef4444' }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatPourcentage(contraventionStats.pourcentage_impaye).toFixed(1)}%
            </Text>
          </Card>

          {/* Top 3 Zones par contraventions */}
          <Card style={[styles.statCard, { borderBottomWidth: 4, borderBottomColor: '#3b82f6', width: isMobile ? (width - 48 - 12) / 2 : (width - 48 - 24) / 3 } as any]}>
            <View style={styles.statCardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#3b82f615' },
                Platform.OS === 'web' ? { boxShadow: '0px 4px 6px #3b82f666' } : { shadowColor: '#3b82f6' }]}>
                <Map color="#3b82f6" size={22} strokeWidth={2.5} />
              </View>
              <View style={[styles.trendBadge, { backgroundColor: '#3b82f610' }]}>
                <Text style={[styles.trendText, { color: '#3b82f6' }]}>Top 3 Zones</Text>
              </View>
            </View>
            <Text style={styles.statLabel}>Zones par nombre de contraventions</Text>
            <View style={styles.topListCompact}>
              {topEmplacementsParContravention.map((item, index) => (
                <View key={item.label} style={styles.topRowCompact}>
                  <Text style={[styles.topRankCompact, { color: '#3b82f6' }]}>#{index + 1}</Text>
                  <Text style={styles.topLabelCompact} numberOfLines={1}>{item.label}</Text>
                  <Text style={styles.topValueCompact}>{item.value}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Top 3 Raisons par contraventions */}
          <Card style={[styles.statCard, { borderBottomWidth: 4, borderBottomColor: '#a855f7', width: isMobile ? (width - 48 - 12) / 2 : (width - 48 - 24) / 3 } as any]}>
            <View style={styles.statCardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#a855f715' },
                Platform.OS === 'web' ? { boxShadow: '0px 4px 6px #a855f766' } : { shadowColor: '#a855f7' }]}>
                <FileText color="#a855f7" size={22} strokeWidth={2.5} />
              </View>
              <View style={[styles.trendBadge, { backgroundColor: '#a855f710' }]}>
                <Text style={[styles.trendText, { color: '#a855f7' }]}>Top 3 Raisons</Text>
              </View>
            </View>
            <Text style={styles.statLabel}>Raisons par nombre de contraventions</Text>
            <View style={styles.topListCompact}>
              {topRaisonsParContravention.map((item, index) => (
                <View key={item.label} style={styles.topRowCompact}>
                  <Text style={[styles.topRankCompact, { color: '#a855f7' }]}>#{index + 1}</Text>
                  <Text style={styles.topLabelCompact} numberOfLines={1}>{item.label}</Text>
                  <Text style={styles.topValueCompact}>{item.value}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Leaderboard des employés */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('stat_titre_leaderboard') ?? 'Leaderboard agents'}</Text>
        </View>

        <View style={styles.statsGrid}>
          {mainStats.leaderboard_agents.slice(0, 3).map((agent, index) => {
            const colors = ['#f59e0b', '#94a3b8', '#b45309'];
            const color = colors[index] ?? '#94a3b8';
            return (
              <Card key={agent.agent_id} style={[styles.statCard, { borderBottomWidth: 4, borderBottomColor: color, width: isMobile ? (width - 48 - 12) / 2 : (width - 48 - 24) / 3 } as any]}>
                <View style={styles.statCardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: `${color}15` },
                    Platform.OS === 'web' ? { boxShadow: `0px 4px 6px ${color}66` } : { shadowColor: color }]}>
                    <Users color={color} size={22} strokeWidth={2.5} />
                  </View>
                </View>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                  <Text style={{ color }}>#{index + 1} </Text>{agent.agent_prenom} {agent.agent_nom}
                </Text>
                <View style={styles.topListCompact}>
                  <View style={styles.topRowCompact}>
                    <Text style={styles.topLabelCompact}>Contraventions</Text>
                    <Text style={styles.topValueCompact}>{agent.contraventions_count}</Text>
                  </View>
                  <View style={styles.topRowCompact}>
                    <Text style={styles.topLabelCompact}>Avertissements</Text>
                    <Text style={styles.topValueCompact}>{agent.avertissements_count}</Text>
                  </View>
                  <View style={styles.topRowCompact}>
                    <Text style={styles.topLabelCompact}>Revenus</Text>
                    <Text style={styles.topValueCompact}>${parseFloat(agent.montant_total).toFixed(2)}</Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>

        {/* Spacer for bottom padding */}
        <View style={styles.spacer} />
      </Animated.View>
    </ScreenContainer>
  );
};

const getStyles = (COLORS: any, width: number, isMobile: boolean) => {
  const scale = getScale(width);

  return StyleSheet.create({
  headerContainer: {
    marginBottom: SPACING.xl * scale,
    marginTop: SPACING.md * scale,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    paddingHorizontal: 10,
  },
  headerBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 6,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    opacity: 0.8,
    fontWeight: '500',
  },
  
  // Grille des statistiques
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    gap: 12,
  },
  statCard: {
    width: isMobile ? (width - 48 - 12) / 2 : (width - 48 - 36) / 4,
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius * 1.5,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 6 },
      web: { boxShadow: '0px 8px 10px rgba(0,0,0,0.3)' }
    }),
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6 },
      android: { elevation: 4 },
      web: { boxShadow: '0px 4px 6px rgba(0,0,0,0.4)' }
    }),
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '600',
  },

  // Graphiques
  chartCard: {
    padding: SPACING.lg * scale,
    marginBottom: SPACING.xl * scale,
    borderRadius: SIZES.radius * 1.5 * scale,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl * scale,
  },
  chartTitle: {
    fontSize: 18 * scale,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4 * scale,
  },
  chartSubtitle: {
    fontSize: 12 * scale,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  chartIconWrap: {
    width: 40 * scale,
    height: 40 * scale,
    borderRadius: 20 * scale,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140 * scale,
    paddingTop: 10 * scale,
  },
  barColumn: {
    alignItems: 'center',
    width: 32 * scale,
  },
  barTrack: {
    width: 14 * scale,
    height: 100 * scale,
    backgroundColor: COLORS.border,
    borderRadius: 7 * scale,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8 * scale,
  },
  barFill: {
    width: '100%',
    borderRadius: 7 * scale,
  },
  barDayLabel: {
    fontSize: 11 * scale,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  barDayLabelActive: {
    color: COLORS.text,
    fontWeight: '800',
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md * scale,
    paddingHorizontal: 4 * scale,
  },
  sectionTitle: {
    fontSize: 18 * scale,
    fontWeight: '800',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: 13 * scale,
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Boutons d'action
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12 * scale,
    marginBottom: SPACING.xl * scale,
  },
  actionButtonWrapper: {
    width: isMobile ? '100%' : '48%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md * scale,
    borderRadius: SIZES.radius * 1.5 * scale,
    borderWidth: 1,
  },
  actionIconBg: {
    width: 48 * scale,
    height: 48 * scale,
    borderRadius: 14 * scale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md * scale,
  },
  actionTextContent: {
    flex: 1,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 16 * scale,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4 * scale,
  },
  actionDesc: {
    fontSize: 13 * scale,
    color: COLORS.textLight,
    fontWeight: '500',
  },

  // Historique des journaux
  logsCard: {
    padding: SPACING.md * scale,
    paddingHorizontal: SPACING.lg * scale,
    borderRadius: SIZES.radius * 1.5 * scale,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md * scale,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logRowLast: {
    borderBottomWidth: 0,
  },
  logIconWrap: {
    width: 36 * scale,
    height: 36 * scale,
    borderRadius: 18 * scale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12 * scale,
  },
  logContent: {
    flex: 1,
    justifyContent: 'center',
  },
  logAction: {
    fontSize: 14 * scale,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4 * scale,
  },
  logUser: {
    fontSize: 12 * scale,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  logTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.border,
    paddingHorizontal: 8 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 12 * scale,
    gap: 4 * scale,
  },
  logTimeText: {
    fontSize: 11 * scale,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  primaryText: { color: COLORS.primary },
  actionBtnBorderPrimary: { borderColor: COLORS.primary + '30' },
  actionBgPrimary: { backgroundColor: COLORS.primary + '15' },
  actionBtnBorderBlue: { borderColor: '#3b82f630' },
  actionBgBlue: { backgroundColor: '#3b82f615' },
  actionBtnBorderRed: { borderColor: 'rgba(220, 38, 38, 0.3)' },
  actionBgRed: { backgroundColor: 'rgba(220, 38, 38, 0.15)' },
  actionBtnBorderVert: { borderColor: '#22c55e30' },
  actionBgVert: { backgroundColor: '#22c55e15' },
  actionBtnBorderMauve: { borderColor: '#a855f730' },
  actionBgMauve: { backgroundColor: '#a855f715' },
  actionBgTransparent: { backgroundColor: 'transparent' },
  emojiLarge: { fontSize: 24 },
  spacer: { height: 40 },
  section: {
    marginTop: 20,
  },
  topCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius * 1.5,
    borderWidth: 1,
    borderColor: COLORS.border,
      gap: 10,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
        },
        android: { elevation: 5 },
        web: { boxShadow: '0px 6px 10px rgba(0,0,0,0.2)' },
      }),
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    topRank: {
      width: 30,
      fontSize: 12,
      fontWeight: '900',
      color: COLORS.primary,
    },
    topLabel: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: COLORS.text,
    },
    topValue: {
      fontSize: 13,
      fontWeight: '900',
      color: COLORS.text,
    },
    topCardTitle: {
      fontSize: 16 * scale,
      fontWeight: '800',
      color: COLORS.text,
      marginBottom: 12 * scale,
    },
    topLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    percentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    percentLabel: {
      fontSize: 13 * scale,
      fontWeight: '600',
      color: COLORS.text,
    },
    percentValue: {
      fontSize: 13 * scale,
      fontWeight: '800',
      color: COLORS.primary,
    },
    percentBar: {
      height: 8,
      borderRadius: 6,
      backgroundColor: COLORS.border,
      overflow: 'hidden',
      marginBottom: 6,
    },
    percentFillPaid: {
      height: '100%',
      backgroundColor: '#22c55e',
      borderRadius: 6,
    },
    percentFillUnpaid: {
      height: '100%',
      backgroundColor: '#ef4444',
      borderRadius: 6,
    },
    miniBar: {
      height: 6,
      borderRadius: 4,
      backgroundColor: COLORS.border,
      overflow: 'hidden',
      marginVertical: 6,
    },
    miniBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    topListCompact: {
      marginTop: 10,
      gap: 8,
    },
    topRowCompact: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    topRankCompact: {
      width: 28,
      fontSize: 14,
      fontWeight: '900',
    },
    topLabelCompact: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      color: COLORS.text,
      marginRight: 4,
    },
    topValueCompact: {
      fontSize: 12,
      fontWeight: '900',
      color: COLORS.text,
    },
});
};

export default AdminDashboardScreen;

