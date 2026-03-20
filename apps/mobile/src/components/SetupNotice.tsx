import { StyleSheet, Text, View } from 'react-native';

export function SetupNotice({
  title = 'Нужен Supabase',
  message,
  hint = "Заполните `EXPO_PUBLIC_SUPABASE_URL` и `EXPO_PUBLIC_SUPABASE_ANON_KEY` в `.env`.",
}: {
  title?: string;
  message: string;
  hint?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{message}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 24,
    marginTop: 100,
    borderRadius: 28,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#20324B',
  },
  text: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#61748F',
  },
  hint: {
    marginTop: 16,
    fontSize: 13,
    lineHeight: 18,
    color: '#8D9DB2',
  },
});
