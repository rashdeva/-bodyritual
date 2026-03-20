import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Provider } from '@supabase/supabase-js';

export function AuthUpgradeRow({
  isAnonymous,
  onPress,
}: {
  isAnonymous: boolean;
  onPress: (provider: Provider) => void;
}) {
  if (!isAnonymous) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Привяжите аккаунт</Text>
      <View style={styles.actions}>
        <Pressable onPress={() => onPress('apple')} style={styles.button}>
          <Text style={styles.buttonText}>Apple</Text>
        </Pressable>
        <Pressable onPress={() => onPress('google')} style={styles.button}>
          <Text style={styles.buttonText}>Google</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#93A1B4',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(214,226,244,0.95)',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F6E9B',
  },
});
