import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createWorkout } from '../services/api';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 44;

interface Exercise {
  name: string;
  sets: string;
  reps_or_time: string;
}

interface Day {
  day_name: string;
  exercises: Exercise[];
}

export default function AddWorkoutScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState<Day[]>([
    { day_name: 'Chest', exercises: [{ name: '', sets: '', reps_or_time: '' }] },
  ]);
  const [activeDay, setActiveDay] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;
  const wordsRemaining = 45 - wordCount;

  const addDay = () => {
    setDays([...days, { day_name: '', exercises: [{ name: '', sets: '', reps_or_time: '' }] }]);
    setActiveDay(days.length);
  };

  const removeDay = (index: number) => {
    if (days.length <= 1) return;
    const updated = days.filter((_, i) => i !== index);
    setDays(updated);
    if (activeDay >= updated.length) setActiveDay(updated.length - 1);
    else if (activeDay === index) setActiveDay(0);
  };

  const updateDayName = (index: number, newName: string) => {
    const updated = [...days];
    updated[index].day_name = newName;
    setDays(updated);
  };

  const addExercise = () => {
    const updated = [...days];
    updated[activeDay].exercises.push({ name: '', sets: '', reps_or_time: '' });
    setDays(updated);
  };

  const updateExercise = (exIndex: number, field: keyof Exercise, value: string) => {
    const updated = [...days];
    updated[activeDay].exercises[exIndex][field] = value;
    setDays(updated);
  };

  const removeExercise = (exIndex: number) => {
    const updated = [...days];
    updated[activeDay].exercises.splice(exIndex, 1);
    setDays(updated);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }
    setSubmitting(true);
    try {
      await createWorkout({
        name: name.trim(),
        description: description.trim() || undefined,
        days: days.map((day, i) => ({
          day_name: day.day_name || `Day ${i + 1}`,
          order_index: i,
          exercises: day.exercises
            .filter((ex) => ex.name.trim())
            .map((ex, j) => ({
              name: ex.name.trim(),
              sets: ex.sets.trim(),
              reps_or_time: ex.reps_or_time.trim(),
              order_index: j,
            })),
        })),
      });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentDay = days[activeDay];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Green Header */}
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 14 }]}>
        <View style={styles.headerSide}>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Add Workout Plan</Text>
        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
          <View style={styles.headerRight}>
            <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="sync" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Workout Name */}
        <TextInput
          style={styles.nameInput}
          placeholder="Beginner's Workout - 3 days"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
        />

        {/* Day Rows — each day is its own row */}
        {days.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dayRow}
            onPress={() => setActiveDay(index)}
            activeOpacity={0.8}
          >
            <View style={[styles.dayPill, activeDay === index && styles.dayPillActive]}>
              <Text style={[styles.dayPillText, activeDay === index && styles.dayPillTextActive]}>
                Day {index + 1}
              </Text>
            </View>
            <TextInput
              style={styles.dayNameInput}
              placeholder="Chest"
              placeholderTextColor="#aaa"
              value={day.day_name}
              onChangeText={(text) => updateDayName(index, text)}
              onFocus={() => setActiveDay(index)}
            />
            {days.length > 1 && (
              <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => removeDay(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={20} color="#e53935" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        {/* Add Day button */}
        <TouchableOpacity style={styles.addDayRow} onPress={addDay}>
          <Ionicons name="add-circle" size={22} color="#00a35e" />
          <Text style={styles.addDayText}>Add Day</Text>
        </TouchableOpacity>

        {/* Exercise Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Exercise</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Sets</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Reps</Text>
            <View style={{ width: 32 }} />
          </View>
          <View style={styles.tableDivider} />

          {/* Exercise Rows */}
          {currentDay?.exercises.map((exercise, index) => (
            <View key={index}>
              <View style={styles.tableRow}>
                <TextInput
                  style={[styles.tableCell, { flex: 2.5 }]}
                  placeholder="Exercise name"
                  placeholderTextColor="#bbb"
                  value={exercise.name}
                  onChangeText={(v) => updateExercise(index, 'name', v)}
                />
                <TextInput
                  style={[styles.tableCell, styles.tableCellCenter, { flex: 1 }]}
                  placeholder="-"
                  placeholderTextColor="#bbb"
                  keyboardType="numeric"
                  value={exercise.sets}
                  onChangeText={(v) => updateExercise(index, 'sets', v)}
                />
                <TextInput
                  style={[styles.tableCell, styles.tableCellCenter, { flex: 1 }]}
                  placeholder="-"
                  placeholderTextColor="#bbb"
                  value={exercise.reps_or_time}
                  onChangeText={(v) => updateExercise(index, 'reps_or_time', v)}
                />
                <TouchableOpacity
                  style={styles.trashBtn}
                  onPress={() => removeExercise(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={17} color="#e53935" />
                </TouchableOpacity>
              </View>
              <View style={styles.tableDivider} />
            </View>
          ))}
        </View>

        {/* Description */}
        <TextInput
          style={styles.descInput}
          placeholder="Bench Press: www.benchpress.com&#10;Edit Slots"
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={(text) => {
            const words = text.trim().split(/\s+/);
            if (words.length <= 45 || text.length < description.length) {
              setDescription(text);
            }
          }}
        />
        <Text style={[styles.wordCount, wordsRemaining < 0 && { color: 'red' }]}>
          {wordsRemaining} words remaining
        </Text>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitBtnText}>Submit</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FAB to add exercise */}
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <TouchableOpacity style={styles.fab} onPress={addExercise} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#00a35e',
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSide: {
    width: 70,
    flexDirection: 'row',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#222',
    marginBottom: 14,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 0,
  },
  dayPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  dayPillActive: {
    backgroundColor: '#00a35e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  dayPillText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  dayPillTextActive: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  dayNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderLeftWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#222',
  },
  daySelector: {
    flexDirection: 'row',
    marginBottom: 8,
    maxHeight: 40,
  },
  addDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 6,
  },
  addDayText: {
    fontSize: 13,
    color: '#00a35e',
    fontWeight: '600',
  },
  table: {
    marginBottom: 14,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
  },
  tableDivider: {
    height: 1,
    backgroundColor: '#e8e8e8',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableCell: {
    fontSize: 14,
    color: '#222',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  tableCellCenter: {
    textAlign: 'center',
  },
  trashBtn: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#222',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  wordCount: {
    textAlign: 'right',
    color: '#00a35e',
    fontSize: 12,
    marginBottom: 18,
  },
  submitBtn: {
    backgroundColor: '#00a35e',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  fabWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#00a35e',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#00a35e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
});
