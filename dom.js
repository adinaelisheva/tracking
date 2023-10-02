// Various functions to do DOM manip
  let openPanelId = '';

// get a color for a given percent (as a value btw 0 and 1)
// where 0 = red, 0.5 = yellow, and 1 = green
function getPctColor(pct) {
  pct = Math.max(0, Math.min(1, pct));
  let color = [0,0,0];
  
  //colors for interpolation
  let red = [120,10,10];
  let yellow = [190,175,15];
  let green = [5,110,5];
  
  if(pct < 0.5) {
    //interpolate between red and yellow
    curPct = pct * 2;
    color[0] = Math.round(red[0] + curPct * (yellow[0] - red[0]));
    color[1] = Math.round(red[1] + curPct * (yellow[1] - red[1]));
    color[2] = Math.round(red[2] + curPct * (yellow[2] - red[2]));
  }  
  else {
    //interpolate between yellow and green
    const curPct = (pct - 0.5) * 2;
    color[0] = Math.round(yellow[0] + curPct * (green[0] - yellow[0]));
    color[1] = Math.round(yellow[1] + curPct * (green[1] - yellow[1]));
    color[2] = Math.round(yellow[2] + curPct * (green[2] - yellow[2]));
  }
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}

function resetDateInputToToday() {
  const d = new Date();
  let day = `${d.getDate()}`;
  if (day.length < 2) { day = `0${day}`; }
  let month = `${d.getMonth() + 1}`;
  if (month.length < 2) { month = `0${month}`; }
  const dStr = `${d.getFullYear()}-${month}-${day}`
  const inputs = document.querySelectorAll('input.date');
  for (const i of inputs) {
    i.value = dStr;
  }
}

function updateItemPctColor(el, pct, property = 'border-color') {
  const color = getPctColor(pct);
  el.setAttribute('style', `${property}: ${color};`)
}

function getGoal(name) {
  const goalEl = document.querySelector(`.goal#${name}`);
  let goalText = goalEl.innerText;
  // Chop off the parens from an expected string of `(N)`
  goalText = goalText.slice(1, goalText.length-1);
  const goal = parseInt(goalText);
  return isNaN(goal) ? null : goal;
}

function completeGoal(name) {
  const goalEl = document.querySelector(`.goal#${name}`);
  goalEl.innerHTML = '☺';
  goalEl.classList.add('complete');
}

function updateDomForTimelyAmount(name, amount) {
  const dataEl = document.querySelector(`.data#${name}`);
  let curTotal = parseInt(dataEl.innerText);
  if (isNaN(curTotal)) {
    console.error(`Something went wrong parsing ${dataEl.innerText} and adding ${amount}`);
    return;
  }
  curTotal += amount;
  dataEl.innerHTML = curTotal;
  const goal = getGoal(name);
  if (isNaN(goal)) {
    // Could just be completed
    return;
  }
  pct = getPctForTimely(curTotal, goal);
  updateItemPctColor(dataEl, pct);
  if (curTotal >= goal) {
    completeGoal(name);
  }
}

function updateDomForInstance(name) {
  const dataEl = document.querySelector(`.data#${name}`);
  dataEl.innerHTML = 0;
  updateItemPctColor(dataEl, 1); // We're at min time since = max accomplishment
  completeGoal(name);
}

function getActiveStateFromDom(name) {
  const button = document.querySelector(`button#${name}`);
  return !button.classList.contains('inactive');
}

function updateDomForToggle(config, isActive) {
  const button = document.querySelector(`button#${config.name}`);
  if (isActive) {
    button.classList.remove('inactive');
  } else {
    button.classList.add('inactive');
  }
  let remaining, pct;
  [remaining, pct] = getRemainingAndPctForToggleDiff(0, isActive, config.expected_cycle_length, config.expected_instance_length);
  const dataEl = document.querySelector(`.data#${config.name}`);
  dataEl.innerHTML = remaining;
  updateItemPctColor(dataEl, pct);
}



function openPanelNearButton(name, panel, button) {
  let top = '50%';
  if (button) {
    // subtract a bit so the panel is on top of the clicked button
    top = button.getBoundingClientRect().top - 100;
    if (panel.offsetHeight + top > document.body.clientHeight) {
      top = document.body.clientHeight - panel.offsetHeight;
    }
    if (top < 5) {
      top = 5;
    }
  }
  openPanel(name, panel, top);
}

function openPanel(id, panel, top = 0) {
  if (openPanelId) {
    document.querySelector(`.panel#${openPanelId}`).classList.add('hidden');
  }
  panel.setAttribute('style', `top: ${top}px`);
  panel.classList.remove('hidden');
  openPanelId = id;

  document.querySelector('.panelCloseOverlay').classList.remove('hidden');
}

function closeCurrentPanel() {
  const panel = document.querySelector(`.panel#${openPanelId}`);
  panel.classList.add('hidden');
  hideAnyDaylogs();
  openPanelId = '';
  document.querySelector('.panelCloseOverlay').classList.add('hidden');
}

function createDayLogsDiv(name, logs) {
  if (logs.length <= 1) {
    return;
  }
  const dayLogsDiv = document.createElement('div');
  dayLogsDiv.classList.add('hidden');
  dayLogsDiv.classList.add('daylogs');
  dayLogsDiv.setAttribute('id', name);
  for (const log of logs) {
    const logDiv = document.createElement('div');
    logDiv.classList.add('daylog');
    logDiv.innerHTML = log.value;
    dayLogsDiv.appendChild(logDiv);
  }
  document.querySelector('#variable').appendChild(dayLogsDiv);
}

function hideAnyDaylogs() {
  const divs = document.querySelectorAll('.daylogs');
  for (const div of divs) {
    div.classList.add('hidden');
  }
}

function addDailySumsToTable(table, logs, goal) {
  let logSums = {};
  let curDate = '';
  for (const log of logs) {
    if (log.date !== curDate) {
      // new date! log the old one
      addLogRowToTable(table, curDate, logSums[curDate], logSums[curDate] >= goal);
      curDate = log.date;
      logSums[curDate] = log.value;
    } else {
      logSums[curDate] += log.value;
    }
  }
  // Add last row
  addLogRowToTable(table, curDate, logSums[curDate], logSums[curDate] >= goal);
}

function addAllLogsToTable(table, logs, showAmount) {
  for (const log of logs) {
    addLogRowToTable(table, log.date, showAmount ? log.value : null);
  }
}

function addLogRowToTable(table, date, value, isComplete) {
  if (!date) {
    return;
  }

  // Format eg: `Mon 9/30`
  const d = new Date(date + TIME_SUFFIX);
  const dateStr = `${DAYS_OF_WEEK_ABBREV[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;

  const row = document.createElement('tr');
  const cell1 = document.createElement('td');
  cell1.innerHTML = dateStr;
  row.appendChild(cell1);
  if (value) {
    const cell2 = document.createElement('td');
    cell2.innerHTML = value;
    if (isComplete) {
      cell2.classList.add('complete');
    }
    row.appendChild(cell2);
  }
  table.appendChild(row);
}