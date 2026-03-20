import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import type { PropsWithChildren } from 'react';

type GlassSurfaceProps = PropsWithChildren<{
  borderRadius: number;
}>;

export function GlassSurface({ borderRadius, children }: GlassSurfaceProps) {
  return (
    <LinearGradient
      colors={['rgba(255,255,255,0.96)', 'rgba(237,244,255,0.92)', 'rgba(227,238,252,0.88)']}
      start={{ x: 0.18, y: 0.06 }}
      end={{ x: 0.84, y: 0.94 }}
      style={[styles.core, { borderRadius }]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.08)']}
        start={{ x: 0.2, y: 0.02 }}
        end={{ x: 0.8, y: 0.82 }}
        style={styles.highlight}
      />
      <View style={styles.innerGlow} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  core: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
  },
  highlight: {
    position: 'absolute',
    top: 12,
    left: 18,
    right: 18,
    height: '46%',
    borderRadius: 999,
  },
  innerGlow: {
    position: 'absolute',
    top: '12%',
    width: '64%',
    height: '38%',
    borderRadius: 999,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.46)',
  },
});
