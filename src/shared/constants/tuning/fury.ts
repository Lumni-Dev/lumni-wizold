export const FURY = {
  attributeBonus: 10,
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
