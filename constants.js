const ICONMAP = {
  heart: '💜',
  hanafuda: '🎴',
  book: '📖',
  shower: '🚿',
  dice: '🎲',
  climb: '🧗‍♀️',
  run: '🏃‍♀️',
  skull: '💀',
  guitar: '🎸',
  whistle: '🎺',
  water: '💧',
  yoga: '🧘',
  dance: '💃',
  blood: '🩸',
  sleep: '😴',
  mask: '👺',
  footprints: '👣',
  boot: '🥾',
  bike: '🚴‍♀️',
  canoe: '🛶',
  food: '🍲',
  milk: '🥛',
  banana: '🍌',
  veg: '🥒',
  swim: '🏊',
  default: '✅',
  on: '🔴',
  off: '⚪',
}

const TIMELY = 1;
const INSTANCE = 2;
const TOGGLE = 3;

const DAY_MILLIS = 1000*60*60*24;

const DAYS_OF_WEEK_ABBREV = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Used to ensure a date w/no time is converted to midnight on the correct date
const TIME_SUFFIX = 'T00:00:00.000';

const NOW = new Date();
const IS_EARLY_HOURS = NOW.getHours() <= 4;
let BASE_DATE, DATE_INPUT;