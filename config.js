const configsWithChildren = {}
const configsByName = {};

// Place for functions that depend on config data (but not DOM or angular stuff)
function getPctForTimely(curTotal, goal) {
  return 1 - ((goal - curTotal) / goal);
}

// returns [remaining, pct]
function getRemainingAndPctForToggleDiff(diff, isActive, cycleLength, instanceLength) {
  const ret = [];
  if (isActive) {
    // instance is currently happening, we're counting down
    ret.push(instanceLength - diff);
    ret.push(diff / instanceLength);
  } else {
    // instance is off, we're counting til it happens
    ret.push(cycleLength - diff);
    ret.push(ret[0] / cycleLength);
  }
  return ret;
}

// returns [remaining, pct]
function getRemainingAndPctForToggleDate(lastActiveStr, config) {
  const lastActive = new Date(lastActiveStr);
  const diff = Math.floor((NOW - lastActive) / (DAY_MILLIS));
  return getRemainingAndPctForToggleDiff(diff, !config.isInactive, config.expected_cycle_length, config.expected_instance_length);
}

function usesSumLogs(config) {
  return config.type === TIMELY && config.amount_varies && config.refresh_cycle === 'D';
}

function hasChildren(config) {
  return configsWithChildren[config.name];
}