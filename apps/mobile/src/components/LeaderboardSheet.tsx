import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import type { LeaderboardEntry, LeaderboardWindow } from '@bodyritual/shared';

type LeaderboardSheetProps = {
  progress: SharedValue<number>;
  activeWindow: LeaderboardWindow;
  onWindowChange: (window: LeaderboardWindow) => void;
  entries: LeaderboardEntry[];
  onLayout: (event: LayoutChangeEvent) => void;
};

export function LeaderboardSheet({
  progress,
  activeWindow,
  onWindowChange,
  entries,
  onLayout,
}: LeaderboardSheetProps) {
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [260, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View onLayout={onLayout} style={[styles.sheet, sheetStyle]}>
      <View style={styles.handle} />
      <Text style={styles.eyebrow}>Топ участников</Text>
      <Text style={styles.title}>Гонка XP в реальном времени</Text>

      <View style={styles.tabs}>
        {[
          { key: 'day', label: 'Сегодня' },
          { key: 'week', label: 'Неделя' },
        ].map((tab) => {
          const selected = activeWindow === tab.key;

          return (
            <Pressable
              key={tab.key}
              onPress={() => onWindowChange(tab.key as LeaderboardWindow)}
              style={[styles.tab, selected && styles.tabActive]}
            >
              <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {entries.map((entry) => (
          <View key={`${activeWindow}-${entry.userId}`} style={[styles.row, entry.isCurrentUser && styles.currentRow]}>
            <Text style={styles.rank}>{entry.rank.toString().padStart(2, '0')}</Text>
            <View style={styles.rowMain}>
              <Text style={styles.name}>{entry.displayName}</Text>
              <Text style={styles.meta}>
                {entry.level} ур. • {entry.isOnline ? 'онлайн' : 'offline'}
              </Text>
            </View>
            <Text style={styles.score}>{entry.xpWindow} XP</Text>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: -20,
    maxHeight: 360,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 28,
    shadowColor: '#9EB6DD',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 14,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D7E0EE',
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: '#8FA0B7',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 8,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: '#1B2940',
    letterSpacing: -0.6,
  },
  tabs: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F5F8FD',
  },
  tabActive: {
    backgroundColor: '#E4EEFF',
  },
  tabText: {
    color: '#7587A2',
    fontWeight: '700',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#4569A4',
  },
  list: {
    marginTop: 18,
  },
  listContent: {
    gap: 12,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#F9FBFF',
  },
  currentRow: {
    backgroundColor: '#EFF5FF',
  },
  rank: {
    width: 32,
    fontSize: 15,
    fontWeight: '700',
    color: '#8EA0BA',
  },
  rowMain: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#223047',
  },
  meta: {
    fontSize: 12,
    color: '#7F90A8',
    marginTop: 3,
  },
  score: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5D789E',
  },
});
