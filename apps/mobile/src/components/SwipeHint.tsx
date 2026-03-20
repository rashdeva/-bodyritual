import { StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

export function SwipeHint({ progress }: { progress: SharedValue<number> }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 1200 }), withTiming(0, { duration: 1200 })), -1, false);
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0.15], Extrapolation.CLAMP),
    transform: [{ translateY: pulse.value * -4 }],
  }));

  return (
    <Animated.View style={[styles.wrap, animatedStyle]}>
      <Text style={styles.text}>Потяните вверх, чтобы увидеть топ участников</Text>
      <View style={styles.arrowWrap}>
        <View style={[styles.arrowStem, styles.arrowStemLeft]} />
        <View style={[styles.arrowStem, styles.arrowStemRight]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#94A1B3',
    textAlign: 'center',
  },
  arrowWrap: {
    width: 28,
    height: 18,
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowStem: {
    position: 'absolute',
    bottom: 6,
    width: 12,
    height: 2.2,
    borderRadius: 999,
    backgroundColor: '#94A1B3',
  },
  arrowStemLeft: {
    transform: [{ translateX: -4 }, { rotate: '-42deg' }],
  },
  arrowStemRight: {
    transform: [{ translateX: 4 }, { rotate: '42deg' }],
  },
});
