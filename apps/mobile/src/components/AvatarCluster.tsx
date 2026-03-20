import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { OnlineRacePresence } from '@bodyritual/shared';

import { AvatarBubble, type BubblePerson } from './AvatarBubble';

const CLUSTER_POSITIONS = [
  { x: 0.2, y: 0.12, size: 60 },
  { x: 0.62, y: 0.08, size: 58 },
  { x: 0.82, y: 0.18, size: 56 },
  { x: 0.08, y: 0.34, size: 56 },
  { x: 0.42, y: 0.3, size: 62 },
  { x: 0.72, y: 0.34, size: 56 },
  { x: 0.26, y: 0.52, size: 54 },
  { x: 0.58, y: 0.5, size: 56 },
  { x: 0.88, y: 0.56, size: 52 },
  { x: 0.14, y: 0.72, size: 52 },
  { x: 0.44, y: 0.78, size: 50 },
  { x: 0.76, y: 0.8, size: 50 },
];

export function AvatarCluster({
  people,
  currentUserId,
}: {
  people: OnlineRacePresence[];
  currentUserId: string | null;
}) {
  const { width } = useWindowDimensions();
  const clusterWidth = Math.min(width - 48, 360);
  const clusterHeight = 220;

  const visible = people.slice(0, CLUSTER_POSITIONS.length);

  return (
    <View style={[styles.wrap, { width: clusterWidth, height: clusterHeight + 28 }]}>
      <View style={[styles.shadow, { width: clusterWidth * 0.72 }]} />
      <View style={[styles.canvas, { width: clusterWidth, height: clusterHeight }]}>
        {visible.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Никто пока не онлайн</Text>
          </View>
        ) : (
          visible.map((person, index) => {
            const position = CLUSTER_POSITIONS[index];
            const bubble: BubblePerson = {
              ...person,
              isCurrentUser: currentUserId === person.userId,
            };

            return (
              <AvatarBubble
                key={person.userId}
                person={bubble}
                index={index}
                left={position.x * clusterWidth - position.size / 2}
                top={position.y * clusterHeight - position.size / 2}
                size={position.size}
              />
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  shadow: {
    position: 'absolute',
    bottom: 4,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(140, 166, 204, 0.18)',
  },
  canvas: {
    position: 'relative',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#9AA8BA',
    fontWeight: '600',
  },
});
