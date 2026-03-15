import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAvailability, deleteAvailability } from '../services/api';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(':');
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  return `${hours}:${m} ${ampm}`;
}

export default function BookSlotsScreen({ refreshKey }: any) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split('T')[0],
  );
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAvailability();
      setSlots(data);
    } catch (error: any) {
      console.error('Failed to fetch slots:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots, refreshKey]);

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const selectDay = (day: number) => {
    const m = String(calMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    setSelectedDate(`${calYear}-${m}-${d}`);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Slot', 'Remove this availability slot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAvailability(id);
            setSlots((prev) => prev.filter((s) => s.id !== id));
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  // Filter slots for selected date
  const filteredSlots = slots.filter((s) => s.date === selectedDate);

  // Calendar rendering
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const selectedDayNum = parseInt(selectedDate.split('-')[2], 10);
  const selectedMonthNum = parseInt(selectedDate.split('-')[1], 10) - 1;
  const selectedYearNum = parseInt(selectedDate.split('-')[0], 10);

  // Days that have slots
  const datesWithSlots = new Set(slots.map((s) => s.date));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Book Client Slots</Text>

        {/* Calendar */}
        <View style={styles.calendar}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={prevMonth}>
              <Ionicons name="chevron-back" size={20} color="#333" />
            </TouchableOpacity>
            <Text style={styles.calendarMonth}>
              {MONTHS[calMonth]} {calYear}
            </Text>
            <TouchableOpacity onPress={nextMonth}>
              <Ionicons name="chevron-forward" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarDaysHeader}>
            {DAYS.map((d, i) => (
              <Text key={i} style={styles.calendarDayLabel}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarCells.map((day, idx) => {
              const isSelected =
                day === selectedDayNum &&
                calMonth === selectedMonthNum &&
                calYear === selectedYearNum;
              const dateStr = day
                ? `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                : '';
              const hasSlots = datesWithSlots.has(dateStr);
              const isToday =
                day === today.getDate() &&
                calMonth === today.getMonth() &&
                calYear === today.getFullYear();

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.calendarCell,
                    isSelected && styles.calendarCellSelected,
                    isToday && !isSelected && styles.calendarCellToday,
                  ]}
                  onPress={() => day && selectDay(day)}
                  disabled={!day}
                >
                  <Text
                    style={[
                      styles.calendarCellText,
                      isSelected && styles.calendarCellTextSelected,
                      hasSlots && !isSelected && { color: '#00a35e', fontWeight: 'bold' },
                    ]}
                  >
                    {day || ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Available Slots */}
        <Text style={styles.slotsLabel}>Available Slots:</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#00a35e"
            style={{ marginTop: 20 }}
          />
        ) : filteredSlots.length === 0 ? (
          <Text style={styles.emptyText}>
            No slots available for this date.
          </Text>
        ) : (
          <FlatList
            data={filteredSlots}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isBooked =
                item.booked_slots && item.booked_slots.length > 0;
              const status = isBooked ? 'Booked' : 'Open';

              return (
                <View style={styles.slotCard}>
                  <Text style={styles.slotTime}>
                    {formatTime12(item.start_time)} -{' '}
                    {formatTime12(item.end_time)}
                  </Text>
                  <View style={styles.slotActions}>
                    <View
                      style={[
                        styles.statusBadge,
                        isBooked && styles.statusBadgeBooked,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          isBooked && styles.statusTextBooked,
                        ]}
                      >
                        {status}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="red"
                        style={{ marginLeft: 12 }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  calendar: {
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 4,
  },
  calendarMonth: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    marginBottom: 4,
  },
  calendarDayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarCellSelected: {
    backgroundColor: '#00a35e',
    borderRadius: 19,
  },
  calendarCellToday: {
    borderWidth: 1.5,
    borderColor: '#00a35e',
    borderRadius: 19,
  },
  calendarCellText: {
    fontSize: 14,
    color: '#333',
  },
  calendarCellTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  slotsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  slotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#00a35e',
    borderRadius: 10,
    marginBottom: 12,
  },
  slotTime: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  slotActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#e6f9f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeBooked: {
    backgroundColor: '#fff3e0',
  },
  statusText: {
    color: '#00a35e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTextBooked: {
    color: '#f57c00',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 20,
  },
});
