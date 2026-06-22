import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval,
  setHours,
  setMinutes
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, ChevronDown } from 'lucide-react-native';
import Svg, { Path, Rect, Circle, Polyline } from 'react-native-svg';
import { SPACING, SIZES } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';

const CalendarClockIcon = ({ size = 24, color = "#000000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
    <Path d="M16 2v4" />
    <Path d="M8 2v4" />
    <Path d="M3 10h5" />
    <Path d="M17.5 17.5 16 16.25V14" />
    <Circle cx="16" cy="16" r="6" />
  </Svg>
);

const CalendarIcon = ({ size = 24, color = "#000000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Path d="M16 2v4" />
    <Path d="M8 2v4" />
    <Path d="M3 10h18" />
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


interface StyledDateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
}

const StyledDateTimePicker: React.FC<StyledDateTimePickerProps> = ({ value, onChange, label }) => {
  const { COLORS } = useSettings();
  const styles = getStyles(COLORS);
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(value));
  const [viewMode, setViewMode] = useState<'date' | 'time'>('date');

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const weekDays = ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'];

  const handleDateSelect = (day: Date) => {
    const newDate = new Date(day);
    newDate.setHours(value.getHours(), value.getMinutes());
    onChange(newDate);
    // On ne ferme pas tout de suite pour permettre de changer l'heure ou de voir la sélection
  };

  const handleTimeChange = (hours: number, mins: number) => {
    const newDate = setMinutes(setHours(value, hours), mins);
    onChange(newDate);
  };

  const renderHeader = () => (
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>{label || 'Sélectionner date et heure'}</Text>
      <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Terminer</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCalendar = () => (
    <View style={styles.calendarContainer}>
      <View style={styles.monthSelector}>
        <Text style={styles.monthText}>
          {format(currentMonth, 'MMMM, yyyy', { locale: fr })}
        </Text>
        <View style={styles.monthArrows}>
          <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeftIcon size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRightIcon size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.weekDaysRow}>
        {weekDays.map(wd => (
          <Text key={wd} style={styles.weekDayText}>{wd}</Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((day, index) => {
          const isSelected = isSameDay(day, value);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isSelected && styles.selectedDayCell,
                !isCurrentMonth && styles.otherMonthDay
              ]}
              onPress={() => handleDateSelect(day)}
            >
              <Text style={[
                styles.dayText,
                isSelected && styles.selectedDayText,
                !isCurrentMonth && styles.otherMonthDayText
              ]}>
                {format(day, 'd')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderTimePicker = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
      <View style={styles.timeContainer}>
        <Text style={styles.sectionLabel}>HEURE</Text>
        <View style={styles.timePickerRow}>
          <View style={styles.timeScroll}>
            <FlatList
              data={hours}
              keyExtractor={item => `h-${item}`}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.timeItem, value.getHours() === item && styles.selectedTimeItem]}
                  onPress={() => handleTimeChange(item, value.getMinutes())}
                >
                  <Text style={[styles.timeItemText, value.getHours() === item && styles.selectedTimeItemText]}>
                    {item.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              snapToInterval={40}
              initialScrollIndex={value.getHours()}
              getItemLayout={(_, index) => ({ length: 40, offset: 40 * index, index })}
            />
          </View>
          <Text style={styles.timeSeparator}>:</Text>
          <View style={styles.timeScroll}>
            <FlatList
              data={minutes}
              keyExtractor={item => `m-${item}`}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.timeItem, value.getMinutes() === item && styles.selectedTimeItem]}
                  onPress={() => handleTimeChange(value.getHours(), item)}
                >
                  <Text style={[styles.timeItemText, value.getMinutes() === item && styles.selectedTimeItemText]}>
                    {item.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              snapToInterval={40}
              initialScrollIndex={value.getMinutes()}
              getItemLayout={(_, index) => ({ length: 40, offset: 40 * index, index })}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.trigger} 
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerLeft}>
          <CalendarClockIcon size={18} color={COLORS.primary} />
          <Text style={styles.triggerText}>
            {format(value, 'eeee d MMMM, HH:mm', { locale: fr })}
          </Text>
        </View>
        <ChevronDown size={18} color={COLORS.textLight} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {renderHeader()}
            
            <View style={styles.modeToggle}>
              <TouchableOpacity 
                style={[styles.modeButton, viewMode === 'date' && styles.activeModeButton]}
                onPress={() => setViewMode('date')}
              >
                <CalendarIcon size={18} color={viewMode === 'date' ? '#FFFFFF' : COLORS.textLight} />
                <Text style={[styles.modeButtonText, viewMode === 'date' && styles.activeModeButtonText]}>Date</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeButton, viewMode === 'time' && styles.activeModeButton]}
                onPress={() => setViewMode('time')}
              >
                <Clock size={18} color={viewMode === 'time' ? '#FFFFFF' : COLORS.textLight} />
                <Text style={[styles.modeButtonText, viewMode === 'time' && styles.activeModeButtonText]}>Heure</Text>
              </TouchableOpacity>
            </View>

            {viewMode === 'date' ? renderCalendar() : renderTimePicker()}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (COLORS: any) => StyleSheet.create({
  container: {
    width: '100%',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  triggerText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    width: Platform.OS === 'web' ? 380 : '100%',
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
      }
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 4,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeModeButton: {
    backgroundColor: COLORS.primary,
  },
  modeButtonText: {
    color: COLORS.textLight,
    fontWeight: '600',
  },
  activeModeButtonText: {
    color: '#FFFFFF',
  },
  // Calendar styles
  calendarContainer: {
    width: '100%',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: 5,
  },
  monthText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  monthArrows: {
    flexDirection: 'row',
    gap: 15,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'lowercase',
    opacity: 0.5,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  selectedDayCell: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDayText: {
    fontWeight: '800',
  },
  otherMonthDay: {
    opacity: 0.2,
  },
  otherMonthDayText: {
    fontWeight: '400',
  },
  // Time picker styles
  timeContainer: {
    height: 250,
  },
  sectionLabel: {
    color: COLORS.textLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  timeScroll: {
    height: '100%',
    width: 60,
  },
  timeItem: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  selectedTimeItem: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  timeItemText: {
    color: COLORS.textLight,
    fontSize: 18,
    fontWeight: '600',
  },
  selectedTimeItemText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  timeSeparator: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '900',
    marginHorizontal: 15,
  }
});

export default StyledDateTimePicker;
