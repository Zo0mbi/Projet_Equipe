import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Clock, MapPin, Car, ShieldCheck, CreditCard } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import Card from './Card';
import { useSettings } from '../../context/SettingsContext';
import { formatEmplacement } from '../../utils/ticket';
import { SPACING } from '../../constants/theme';
import { Contravention } from '../../types/database';
import { getScale } from '../../utils/responsive';

interface TicketCardProps {
  key?: React.Key;
  ticket: Contravention;
  showPayButton?: boolean;
  onPay?: () => void;
  showEditButton?: boolean;
  onEdit?: () => void;
  showCancelButton?: boolean;
  onCancel?: () => void;
  showPayerButton?: boolean;
  onPayer?: () => void;
}

const PencilIcon = ({ size = 24, color = "#FFFFFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Svg>
);

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  showPayButton = false,
  onPay,
  showEditButton = false,
  onEdit,
  showCancelButton = false,
  onCancel,
  showPayerButton = false,
  onPayer,
}) => {
  const { COLORS } = useSettings();
  const { width } = useWindowDimensions();
  const styles = getStyles(COLORS, width);

  const etat = ticket.etat_contravention?.toLowerCase() || '';
  const isPayee = etat === 'payée' || etat === 'payee';

  return (
    <Card style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <View>
          <Text style={styles.resultLabel}>CONTRAVENTION</Text>
          <Text style={styles.resultId}>{ticket.numero_contravention}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isPayee
                ? COLORS.success + '20'
                : COLORS.primary + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: isPayee ? COLORS.success : COLORS.primary },
            ]}
          >
            {ticket.etat_contravention?.toUpperCase() || 'N/A'}
          </Text>
        </View>
      </View>

      <Text style={styles.resultMainReason}>
        {ticket.raison_contravention
          ? ticket.raison_contravention.nom
          : ticket.raison_custom || 'N/A'}
      </Text>

      <View style={styles.resultInfoGrid}>
        <View style={styles.infoItem}>
          <MapPin size={14} color={COLORS.textLight} />
          <Text style={styles.infoItemText}>
            {formatEmplacement(ticket.emplacement)}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Clock size={14} color={COLORS.textLight} />
          <Text style={styles.infoItemText}>
            {new Date(ticket.date_entrer).toLocaleDateString('fr-CA', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>

      <View style={styles.resultDetailsSection}>
        <View style={styles.detailRow}>
          <Car size={14} color={COLORS.primary} />
          <Text style={styles.detailLabel}>Véhicule:</Text>
          <Text style={styles.detailValue}>
            {`${ticket.vehicule?.numero_plaque || 'N/A'} (${
              ticket.vehicule?.province || ''
            }) - ${ticket.vehicule?.marque || ''} ${
              ticket.vehicule?.modele || ''
            }`}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <ShieldCheck size={14} color={COLORS.primary} />
          <Text style={styles.detailLabel}>Officier:</Text>
          <Text style={styles.detailValue}>
            {ticket.attribuer_par_utilisateur?.nom || 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.resultFooter}>
        <Text style={styles.resultAmount}>
          ${Number(ticket.montant || 0).toFixed(2)}
        </Text>
        <View style={styles.actionButtons}>
          {showPayerButton && !isPayee && (
            <TouchableOpacity style={styles.cancelActionBtn} onPress={onPayer}>
              <Text style={styles.payNowText}>MARQUER COMME PAYÉE</Text>
            </TouchableOpacity>
          )}
          {showCancelButton && !isPayee && (
            <TouchableOpacity style={styles.cancelActionBtn} onPress={onCancel}>
              <Text style={styles.payNowText}>ANNULER</Text>
            </TouchableOpacity>
          )}
          {showEditButton && !isPayee && (
            <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
              <PencilIcon size={16} color="#FFFFFF" />
              <Text style={styles.payNowText}>MODIFIER</Text>
            </TouchableOpacity>
          )}
          {showPayButton && !isPayee && etat !== 'avertissement' && (
            <TouchableOpacity style={styles.payNowBtn} onPress={onPay}>
              <CreditCard size={16} color="#FFFFFF" />
              <Text style={styles.payNowText}>PAYER</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
};

const getStyles = (COLORS: any, width: number) => {
  const scale = getScale(width);
  return StyleSheet.create({
  resultCard: {
    padding: SPACING.lg * scale,
    backgroundColor: COLORS.background,
    borderColor: `${COLORS.primary}15`,
    borderWidth: 1,
    marginTop: 10 * scale,
    borderRadius: 20 * scale,
    marginBottom: SPACING.md * scale,
    // Ombre premium (glassmorphism subtil)
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16 * scale,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.textLight}15`,
    paddingBottom: 12 * scale,
  },
  resultLabel: {
    fontSize: 11 * scale,
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 1,
    marginBottom: 2 * scale,
  },
  resultId: {
    fontSize: 16 * scale,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 12 * scale,
    paddingVertical: 6 * scale,
    borderRadius: 20 * scale,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusText: {
    fontSize: 11 * scale,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultMainReason: {
    fontSize: 18 * scale,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16 * scale,
    lineHeight: 24 * scale,
  },
  resultInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12 * scale,
    marginBottom: 20 * scale,
    backgroundColor: `${COLORS.textLight}08`,
    padding: 12 * scale,
    borderRadius: 12 * scale,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
  },
  infoItemText: {
    fontSize: 13 * scale,
    color: COLORS.text,
    marginLeft: 6 * scale,
    fontWeight: '500',
  },
  resultDetailsSection: {
    backgroundColor: `${COLORS.primary}08`,
    padding: 14 * scale,
    borderRadius: 12 * scale,
    marginBottom: 20 * scale,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8 * scale,
  },
  detailLabel: {
    fontSize: 13 * scale,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8 * scale,
    width: 65 * scale,
  },
  detailValue: {
    fontSize: 13 * scale,
    color: COLORS.text,
    flex: 1,
    fontWeight: '500',
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: `${COLORS.textLight}15`,
    paddingTop: 16 * scale,
  },
  resultAmount: {
    fontSize: 28 * scale,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10 * scale,
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16 * scale,
    paddingVertical: 10 * scale,
    borderRadius: 12 * scale,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.textLight,
    paddingHorizontal: 16 * scale,
    paddingVertical: 10 * scale,
    borderRadius: 12 * scale,
  },
  cancelActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger || '#ef4444',
    paddingHorizontal: 16 * scale,
    paddingVertical: 10 * scale,
    borderRadius: 12 * scale,
  },
  payNowText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13 * scale,
    marginLeft: 6 * scale,
    letterSpacing: 0.5,
  },
});
};

export default TicketCard;
