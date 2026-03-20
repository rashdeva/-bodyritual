import { useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

import type { CurrentUserProfile, OnlineRacePresence } from '@bodyritual/shared';

import { supabase } from '../lib/supabase';
import { touchLastSeen } from '../services/profile';

type OnlineRaceState = {
  participants: OnlineRacePresence[];
  onlineIds: Set<string>;
};

type SessionPresenceInput = {
  profile: CurrentUserProfile | undefined;
  isActive: boolean;
  sessionId: string | null;
  startedAt: string | null;
  currentSessionXp: number;
  currentTotalXp: number;
};

function normalizePresence(input: SessionPresenceInput): OnlineRacePresence | null {
  if (!input.profile) {
    return null;
  }

  return {
    userId: input.profile.id,
    displayName: input.profile.displayName,
    avatarSeed: input.profile.avatarSeed,
    level: input.profile.level,
    xpTotal: input.currentTotalXp,
    sessionId: input.sessionId,
    currentSessionXp: input.isActive ? input.currentSessionXp : 0,
    startedAt: input.isActive ? input.startedAt : null,
    lastSeenAt: new Date().toISOString(),
  };
}

export function useOnlineRacePresence(input: SessionPresenceInput): OnlineRaceState {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [participantsMap, setParticipantsMap] = useState<Record<string, OnlineRacePresence>>({});
  const localPresence = useMemo(() => normalizePresence(input), [input]);

  useEffect(() => {
    const client = supabase;

    if (!client || !localPresence) {
      return;
    }

    const channel = client.channel('online-race:global', {
      config: {
        presence: {
          key: localPresence.userId,
        },
      },
    });
    channelRef.current = channel;

    const syncPresenceState = () => {
      const nextState = channel.presenceState<OnlineRacePresence>();
      const nextMap = Object.fromEntries(
        Object.entries(nextState).flatMap(([userId, values]) => {
          const latest = values[values.length - 1];
          return latest ? [[userId, latest]] : [];
        })
      );

      setParticipantsMap((current) => ({ ...current, ...nextMap }));
    };

    channel
      .on('presence', { event: 'sync' }, syncPresenceState)
      .on('broadcast', { event: 'xp_tick' }, ({ payload }) => {
        const next = payload as OnlineRacePresence;
        setParticipantsMap((current) => ({
          ...current,
          [next.userId]: next,
        }));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(localPresence);
          if (localPresence.sessionId) {
            await channel.send({
              type: 'broadcast',
              event: 'xp_tick',
              payload: localPresence,
            });
          }
        }
      });

    const heartbeat = setInterval(() => {
      void touchLastSeen();
    }, 60_000);

    return () => {
      clearInterval(heartbeat);
      void client.removeChannel(channel);
      channelRef.current = null;
    };
  }, [localPresence]);

  useEffect(() => {
    if (!channelRef.current || !localPresence) {
      return;
    }

    void channelRef.current.track(localPresence);

    if (localPresence.sessionId) {
      void channelRef.current.send({
        type: 'broadcast',
        event: 'xp_tick',
        payload: localPresence,
      });
    }
  }, [localPresence]);

  const participants = useMemo(
    () =>
      Object.values(participantsMap)
        .filter((entry) => entry.lastSeenAt)
        .sort((left, right) => {
          if (right.currentSessionXp !== left.currentSessionXp) {
            return right.currentSessionXp - left.currentSessionXp;
          }

          if (right.xpTotal !== left.xpTotal) {
            return right.xpTotal - left.xpTotal;
          }

          return left.displayName.localeCompare(right.displayName);
        }),
    [participantsMap]
  );

  return {
    participants,
    onlineIds: new Set(participants.map((participant) => participant.userId)),
  };
}
