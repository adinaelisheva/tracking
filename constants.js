const DEFAULT_ICON = '✅';
const ON_ICON = '🔴';
const OFF_ICON = '⚪';

const TIMELY = 1;
const INSTANCE = 2;
const TOGGLE = 3;

const DAY_MILLIS = 1000*60*60*24;

const DAYS_OF_WEEK_ABBREV = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Used to ensure a date w/no time is converted to midnight on the correct date
const TIME_SUFFIX = 'T00:00:00.000';

let NOW = new Date();
const IS_EARLY_HOURS = NOW.getHours() <= 4;
if (IS_EARLY_HOURS) {
  NOW = new Date(NOW.getTime() - DAY_MILLIS);
}
let BASE_DATE, DATE_INPUT;
