import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  Easing,
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { GlassSurface, shadows } from '@bodyritual/ui';
import { formatDuration } from '@bodyritual/shared';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PlayGlyph() {
  return (
    <View style={styles.playIconWrap}>
      <View style={styles.playIcon} />
    </View>
  );
}

type RitualButtonProps = {
  diameter: number;
  isActive: boolean;
  isBusy?: boolean;
  secondsLeft: number;
  title: string;
  xpLabel: string;
  subtitle: string;
  onPress: () => void;
};

export function RitualButton({
  diameter,
  isActive,
  isBusy,
  secondsLeft,
  title,
  xpLabel,
  subtitle,
  onPress,
}: RitualButtonProps) {
  const breathe = useSharedValue(1);
  const pressed = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.025, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [breathe]);

  const animatedStyle = useAnimatedStyle(() => {
    const pressScale = interpolate(pressed.value, [0, 1], [1, 0.965], Extrapolation.CLAMP);

    return {
      transform: [{ scale: breathe.value * pressScale }],
    };
  });

  return (
    <Animated.View
      entering={FadeInDown.duration(700).springify()}
      style={[styles.shell, { width: diameter, height: diameter }, animatedStyle]}
    >
      <AnimatedPressable
        disabled={isBusy}
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withSpring(1, { damping: 18, stiffness: 240 });
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, { damping: 16, stiffness: 220 });
        }}
        style={styles.pressable}
      >
        <GlassSurface borderRadius={diameter / 2}>
          <View style={styles.content}>
            {isActive ? (
              <>
                <Text style={styles.timer}>{formatDuration(secondsLeft)}</Text>
                <Text style={styles.xpLabel}>{xpLabel}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </>
            ) : (
              <>
                <PlayGlyph />
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </>
            )}
          </View>
        </GlassSurface>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    ...shadows.glass,
  },
  pressable: {
    flex: 1,
    borderRadius: 999,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(84, 130, 214, 0.08)',
    marginBottom: 18,
  },
  playIcon: {
    marginLeft: 4,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 15,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#5B86D8',
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
    color: '#152033',
    letterSpacing: -0.8,
  },
  timer: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '700',
    color: '#17304C',
    letterSpacing: -1.6,
  },
  xpLabel: {
    marginTop: 8,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    color: '#4E77C5',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    color: '#7A8AA0',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
});
