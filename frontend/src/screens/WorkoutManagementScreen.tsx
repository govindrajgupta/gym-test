import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';

import WorkoutListScreen from './WorkoutListScreen';
import ClientScreen from './ClientScreen';
import AvailabilityScreen from './AvailabilityScreen';
import BookSlotsScreen from './BookSlotsScreen';

const TABS = ['Workout', 'Client', 'Availability', 'Book Slots'];
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 44;
const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_WIDTH = SCREEN_WIDTH / 3; // 3 tabs visible, 4th revealed by swipe

export default function WorkoutManagementScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('Workout');
  const [refreshKey, setRefreshKey] = useState(0);
  const tabScrollRef = useRef<ScrollView>(null);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const handleTabPress = (tab: string, index: number) => {
    setActiveTab(tab);
    // Scroll so selected tab is visible
    tabScrollRef.current?.scrollTo({ x: Math.max(0, (index - 1) * TAB_WIDTH), animated: true });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Workout':
        return <WorkoutListScreen navigation={navigation} refreshKey={refreshKey} />;
      case 'Client':
        return <ClientScreen />;
      case 'Availability':
        return <AvailabilityScreen refreshKey={refreshKey} />;
      case 'Book Slots':
        return <BookSlotsScreen refreshKey={refreshKey} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#00a35e" />

      {/* Green Header — tall */}
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 14 }]}>
        <View style={styles.headerSide}>
          <TouchableOpacity style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerTitle}>Workout Management</Text>

        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={handleRefresh}>
              <Ionicons name="sync" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => supabase.auth.signOut()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Scrollable Tab Bar — 3 visible, swipe for 4th */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          bounces={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, { width: TAB_WIDTH }]}
              onPress={() => handleTabPress(tab, index)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
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
  headerBtn: {
    padding: 4,
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
  tabBarContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  tabBarContent: {
    flexDirection: 'row',
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#00a35e',
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#00a35e',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
});
