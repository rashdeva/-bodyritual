import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { GlassSurface } from '@bodyritual/ui';
import type { LeaderboardEntry, OnlineRacePresence } from '@bodyritual/shared';

import { avatarColorFromSeed, initialsFromName } from '../utils/avatar';

export type BubblePerson = Pick<
  OnlineRacePresence,
  'userId' | 'displayName' | 'avatarSeed' | 'level' | 'currentSessionXp' | 'xpTotal'
> & {
  isCurrentUser: boolean;
};

export function AvatarBubble({
  person,
  index,
  left,
  top,
  size,
}: {
  person: BubblePerson;
  index: number;
  left: number;
  top: number;
  size: number;
}) {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withDelay(
      index * 100,
      withRepeat(withSequence(withTiming(1, { duration: 2400 }), withTiming(-1, { duration: 2400 })), -1, true)
    );
  }, [drift, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drift.value * 3 }, { translateX: drift.value * 1.25 }],
  }));

  return (
    <Animated.View entering={FadeInUp.delay(index * 45).duration(650)} style={[styles.anchor, { left, top }, animatedStyle]}>
      <View
        style={[
          styles.avatarShadow,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: avatarColorFromSeed(person.avatarSeed),
          },
          person.isCurrentUser && styles.currentBubble,
        ]}
      >
        <GlassSurface borderRadius={size / 2}>
          <View style={styles.avatarContent}>
            <Text style={styles.initials}>{initialsFromName(person.displayName)}</Text>
          </View>
        </GlassSurface>
      </View>
      <View style={[styles.pill, person.isCurrentUser && styles.currentPill]}>
        <Text style={[styles.pillText, person.isCurrentUser && styles.currentPillText]}>
          {person.currentSessionXp > 0 ? `${person.currentSessionXp} XP` : `Lv ${person.level}`}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    alignItems: 'center',
  },
  avatarShadow: {
    shadowColor: '#9EB9E3',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
    overflow: 'hidden',
  },
  avatarContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBubble: {
    shadowOpacity: 0.24,
  },
  initials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#345172',
    letterSpacing: 0.2,
  },
  pill: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(225,233,247,0.95)',
  },
  currentPill: {
    backgroundColor: '#F4F8FF',
    borderColor: 'rgba(131, 165, 227, 0.3)',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C8CA4',
  },
  currentPillText: {
    color: '#5B79A8',
  },
});
