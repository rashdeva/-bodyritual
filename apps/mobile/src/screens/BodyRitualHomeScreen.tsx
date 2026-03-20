import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeInUp, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { LeaderboardWindow } from '@bodyritual/shared';
import { XP_START_BONUS } from '@bodyritual/shared';

import { AuthUpgradeRow } from '../components/AuthUpgradeRow';
import { AvatarCluster } from '../components/AvatarCluster';
import { LeaderboardSheet } from '../components/LeaderboardSheet';
import { RitualButton } from '../components/RitualButton';
import { SetupNotice } from '../components/SetupNotice';
import { SwipeHint } from '../components/SwipeHint';
import { useAuthBootstrap } from '../hooks/useAuthBootstrap';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useOnlineRacePresence } from '../hooks/useOnlineRacePresence';
import { useProfile } from '../hooks/useProfile';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { isSupabaseConfigured } from '../lib/supabase';

export function BodyRitualHomeScreen() {
  const { width, height } = useWindowDimensions();
  const [sheetHeight, setSheetHeight] = useState(280);
  const [leaderboardWindow, setLeaderboardWindow] = useState<LeaderboardWindow>('day');
  const sheetProgress = useSharedValue(0);
  const gestureStart = useSharedValue(0);

  const auth = useAuthBootstrap();
  const profileQuery = useProfile(auth.hasSession);
  const session = useWorkoutSession(profileQuery.data);
  const onlineRace = useOnlineRacePresence({
    profile: profileQuery.data,
    isActive: session.isActive,
    sessionId: session.activeSession?.sessionId ?? null,
    startedAt: session.activeSession?.startedAt ?? null,
    currentSessionXp: session.currentSessionXp,
    currentTotalXp: session.currentTotalXp,
  });
  const leaderboardQuery = useLeaderboard(
    leaderboardWindow,
    profileQuery.data?.id ?? null,
    onlineRace.onlineIds
  );

  const actionDiameter = useMemo(() => Math.min(width * 0.68, 290), [width]);
  const topSpacing = useMemo(() => Math.max(24, height * 0.04), [height]);
  const isBusy = session.isStarting || session.isFinishing;

  const gesture = Gesture.Pan()
    .onBegin(() => {
      gestureStart.value = sheetProgress.value;
    })
    .onUpdate((event) => {
      const next = gestureStart.value + -event.translationY / Math.max(sheetHeight, 1);
      sheetProgress.value = Math.min(1, Math.max(0, next));
    })
    .onEnd((event) => {
      const shouldOpen = event.velocityY < -500 || sheetProgress.value > 0.38;
      sheetProgress.value = withSpring(shouldOpen ? 1 : 0, {
        damping: 18,
        stiffness: 170,
        mass: 0.7,
      });
    });

  if (!isSupabaseConfigured) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <SetupNotice message="Live XP race, anonymous auth и leaderboard ждут Supabase URL и anon key." />
        </View>
      </SafeAreaView>
    );
  }

  if (auth.isReady && !auth.hasSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <SetupNotice
            title="Нет авторизации"
            message={auth.authError ?? 'Не удалось создать anonymous session в Supabase.'}
            hint="В Supabase Dashboard включите Authentication > Providers > Anonymous."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (auth.hasSession && profileQuery.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <SetupNotice
            title="Профиль не загрузился"
            message={profileQuery.error instanceof Error ? profileQuery.error.message : 'Profile load failed.'}
            hint="Проверьте, что миграция применена, а trigger `handle_new_user` создает запись в `profiles`."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!auth.isReady || (auth.hasSession && profileQuery.isLoading)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.screen, styles.centered]}>
          <ActivityIndicator size="large" color="#5B86D8" />
          <Text style={styles.loadingText}>Подключаем ритуал и живую гонку XP…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const headerTitle = session.isActive ? 'Ритуал в процессе' : 'Утро • День 6';
  const subtitle = session.isActive
    ? `${session.activeSession?.ritualTitle ?? 'Тренировка'}`
    : session.primaryRitual?.title ?? '7 минут зарядки';

  const xpLabel = session.isActive
    ? `+${session.currentSessionXp} XP • всего ${session.currentTotalXp}`
    : `${profileQuery.data?.xpTotal ?? 0} XP • старт +${XP_START_BONUS}`;

  const onlineCount = onlineRace.participants.length;
  const sessionError =
    (session.startError instanceof Error && session.startError.message) ||
    (session.finishError instanceof Error && session.finishError.message) ||
    (session.ritualsError instanceof Error && session.ritualsError.message) ||
    null;
  const debugLines = [
    `configured: ${String(isSupabaseConfigured)}`,
    `authReady: ${String(auth.isReady)}`,
    `hasSession: ${String(auth.hasSession)}`,
    `anonymous: ${String(auth.isAnonymous)}`,
    `userId: ${auth.session?.user?.id ?? 'none'}`,
    `profile: ${profileQuery.data ? 'loaded' : profileQuery.isLoading ? 'loading' : profileQuery.isError ? 'error' : 'idle'}`,
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.backgroundGlowTop} pointerEvents="none" />
        <View style={styles.backgroundGlowBottom} pointerEvents="none" />

        <Animated.Text entering={FadeInUp.duration(700)} style={[styles.statusText, { marginTop: topSpacing }]}>
          {headerTitle}
        </Animated.Text>
        <Text style={styles.profileText}>
          {profileQuery.data?.displayName ?? 'BodyRitual'} • {onlineCount} online now
        </Text>

        {auth.authError ? <Text style={styles.errorText}>{auth.authError}</Text> : null}
        {sessionError ? <Text style={styles.errorText}>{sessionError}</Text> : null}
        <View style={styles.debugBox}>
          {debugLines.map((line) => (
            <Text key={line} style={styles.debugText}>
              {line}
            </Text>
          ))}
        </View>

        <View style={styles.centerStage}>
          <RitualButton
            diameter={actionDiameter}
            isActive={session.isActive}
            isBusy={isBusy}
            secondsLeft={session.secondsLeft}
            title="Начать"
            xpLabel={xpLabel}
            subtitle={session.isActive ? `Финишировать тренировку` : subtitle}
            onPress={() => {
              if (session.isActive && session.finish) {
                void session.finish();
                return;
              }

              void session.start();
            }}
          />
        </View>

        <AuthUpgradeRow
          isAnonymous={auth.isAnonymous}
          onPress={(provider) => {
            void auth.continueWithProvider(provider);
          }}
        />

        <View style={styles.liveSummary}>
          <Text style={styles.liveSummaryLabel}>Живая гонка</Text>
          <Text style={styles.liveSummaryValue}>
            {session.isActive ? `${session.currentSessionXp} XP в этой сессии` : 'Запустите тренировку, чтобы войти в гонку'}
          </Text>
          {session.lastFinishResult ? (
            <Text style={styles.finishText}>
              Финиш: {session.lastFinishResult.confirmedXp} XP • #{session.lastFinishResult.dailyRank ?? '-'} сегодня
            </Text>
          ) : null}
        </View>

        <View style={styles.clusterStage}>
          <AvatarCluster people={onlineRace.participants} currentUserId={profileQuery.data?.id ?? null} />
        </View>

        <GestureDetector gesture={gesture}>
          <View style={styles.bottomZone}>
            <SwipeHint progress={sheetProgress} />
            <LeaderboardSheet
              progress={sheetProgress}
              activeWindow={leaderboardWindow}
              onWindowChange={setLeaderboardWindow}
              entries={leaderboardQuery.data ?? []}
              onLayout={(event) => {
                setSheetHeight(event.nativeEvent.layout.height);
              }}
            />
          </View>
        </GestureDetector>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDFDFC',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FDFDFC',
    overflow: 'hidden',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -140,
    alignSelf: 'center',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(196, 219, 255, 0.15)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 80,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(223, 236, 255, 0.16)',
  },
  statusText: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: '#8E9AAF',
    letterSpacing: 0.2,
  },
  profileText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#5F7598',
  },
  errorText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 13,
    color: '#B45B5B',
  },
  debugBox: {
    marginTop: 10,
    marginHorizontal: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(215,225,240,0.9)',
  },
  debugText: {
    fontSize: 11,
    lineHeight: 15,
    color: '#6A7D97',
    fontWeight: '600',
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 28,
  },
  liveSummary: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  liveSummaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#92A2B8',
  },
  liveSummaryValue: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 21,
    color: '#5F7598',
    fontWeight: '600',
  },
  finishText: {
    marginTop: 6,
    fontSize: 13,
    color: '#7B8BA4',
  },
  clusterStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  bottomZone: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    minHeight: 178,
    justifyContent: 'flex-end',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7E99',
  },
});
