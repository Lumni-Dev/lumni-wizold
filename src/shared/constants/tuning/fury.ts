// What one flask lights, by its size: the bigger the glass, the deeper the
// beast. The medium is the reference every other number of the game was tuned
// against, so it keeps the value the flat bonus used to have, the small half of
// it and the large half again on top.
const ATTRIBUTE_BONUS_BY_SIZE = {
  small: 5,
  medium: 10,
  large: 15,
};

export const FURY = {
  attributeBonusBySize: ATTRIBUTE_BONUS_BY_SIZE,
  // The sky pours the middle flask: a full moon lights exactly the fury a
  // medium potion does, which is also what a save from before the sizes
  // reads back as, since that is the fury it was drunk under.
  moonAttributeBonus: ATTRIBUTE_BONUS_BY_SIZE.medium,
  durationMinutesBySize: {
    small: 2.5,
    medium: 5,
    large: 7.5,
  },
  willpowerMaxBonus: 1,
  willpowerScale: 250,
  // The Willpower stretch is flat: the same extra time lands on every flask,
  // no matter its size. This is the ceiling of that stretch, in minutes.
  willpowerExtraMinutes: 5,
};
