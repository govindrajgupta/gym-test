import React, { useState, useEffect, useCallback } from 'react';
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
import { getWorkouts, deleteWorkout } from '../services/api';

export default function WorkoutListScreen({ navigation, refreshKey }: any) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWorkouts();
      setWorkouts(data);
    } catch (error: any) {
      console.error('Failed to fetch workouts:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts, refreshKey]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Workout', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWorkout(id);
            setWorkouts((prev) => prev.filter((w) => w.id !== id));
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const days = item.workout_days?.length ?? 0;
    return (
      <View>
        {index > 0 && <View style={styles.separator} />}
        <View style={styles.listItem}>
          <Text style={styles.itemName}>
            {item.name}{' '}
            <Text style={styles.itemDays}>
              - {days} Day{days !== 1 ? 's' : ''}
            </Text>
          </Text>
          <TouchableOpacity
            onPress={() => handleDelete(item.id, item.name)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={19} color="#e53935" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Section pill */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionPill}>
          <Text style={styles.sectionText}>Custom Workout Plans</Text>
        </View>
      </View>

      {/* List or states */}
      {loading ? (
        <ActivityIndicator size="large" color="#00a35e" style={styles.loader} />
      ) : workouts.length === 0 ? (
        <Text style={styles.emptyText}>No workout plans yet. Tap + to create one.</Text>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 90 }}
        />
      )}

      {/* FAB */}
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddWorkout')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sectionRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    alignItems: 'center',
  },
  sectionPill: {
    backgroundColor: '#efefef',
    borderRadius: 50,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  sectionText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  itemName: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  itemDays: {
    fontSize: 14,
    color: '#888',
    fontWeight: '400',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  loader: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 14,
    marginTop: 50,
    paddingHorizontal: 32,
    lineHeight: 22,
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
