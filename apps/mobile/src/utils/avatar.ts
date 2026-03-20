const palette = ['#CFE3FF', '#DEE8FF', '#D6E6FF', '#E7EEFF', '#DCEBFF', '#EAF2FF'];

export function avatarColorFromSeed(seed: string) {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[Math.abs(hash) % palette.length];
}

export function initialsFromName(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0] ?? '')
    .join('')
    .toUpperCase();
}

export function createAnonymousIdentity() {
  const adjectives = ['Calm', 'Bright', 'Pulse', 'Quiet', 'Silver', 'Blue', 'Swift'];
  const nouns = ['Ritual', 'Motion', 'Glow', 'Drift', 'Focus', 'Form', 'Flow'];
  const random = Math.random();
  const adjective = adjectives[Math.floor(random * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = Math.floor(100 + Math.random() * 900);
  const displayName = `${adjective} ${noun}`;
  const avatarSeed = `${adjective.toLowerCase()}-${noun.toLowerCase()}-${suffix}`;

  return {
    displayName,
    avatarSeed,
  };
}
