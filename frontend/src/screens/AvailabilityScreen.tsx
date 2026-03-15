import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createAvailability } from '../services/api';

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

export default function AvailabilityScreen({ refreshKey }: any) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split('T')[0],
  );
  const [startTime, setStartTime] = useState('11:30 AM');
  const [endTime, setEndTime] = useState('11:45 AM');
  const [sessionName, setSessionName] = useState('PT');
  const [isRepeat, setIsRepeat] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const parseTimeTo24 = (time12: string): string => {
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return '00:00:00';
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}:00`;
  };

  const handleCreate = async () => {
    if (!selectedDate || !startTime || !endTime || !sessionName.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setSubmitting(true);
    try {
      await createAvailability([
        {
          date: selectedDate,
          start_time: parseTimeTo24(startTime),
          end_time: parseTimeTo24(endTime),
          session_name: sessionName.trim(),
          is_repeat: isRepeat,
        },
      ]);
      Alert.alert('Success', 'Availability created!');
      setStartTime('11:30 AM');
      setEndTime('11:45 AM');
      setSessionName('PT');
      setIsRepeat(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar rendering
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const selectedDay = parseInt(selectedDate.split('-')[2], 10);
  const selectedMonth = parseInt(selectedDate.split('-')[1], 10) - 1;
  const selectedYear = parseInt(selectedDate.split('-')[0], 10);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Set Availability</Text>

        {/* Date */}
        <Text style={styles.label}>Date*</Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputText}>{selectedDate}</Text>
          <Ionicons name="calendar-outline" size={20} color="#666" />
        </View>

        {/* Time Row */}
        <View style={styles.timeRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Start Time*</Text>
            <TextInput
              style={styles.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="11:30 AM"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>End Time*</Text>
            <TextInput
              style={styles.input}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="11:45 AM"
            />
          </View>
        </View>

        {/* Repeat Toggle */}
        <View style={styles.repeatRow}>
          <Text style={styles.repeatLabel}>Repeat Sessions</Text>
          <Switch
            value={isRepeat}
            onValueChange={setIsRepeat}
            trackColor={{ false: '#ccc', true: '#00a35e' }}
            thumbColor="#fff"
          />
        </View>

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
                day === selectedDay &&
                calMonth === selectedMonth &&
                calYear === selectedYear;
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
                    ]}
                  >
                    {day || ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Session Name */}
        <Text style={styles.label}>Session Name*</Text>
        <TextInput
          style={styles.input}
          value={sessionName}
          onChangeText={setSessionName}
          placeholder="PT"
        />

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createBtn, submitting && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.createBtnText}>Create</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  repeatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  repeatLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
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
  createBtn: {
    backgroundColor: '#00a35e',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  createBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
