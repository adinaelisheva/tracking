angular.module('tracking').controller('trackingCtrl', ['$scope', 'httpSrvc', function($scope, httpSrvc) {
  const configsByName = {};
  const configsWithChildren = {};

  async function initialNonRepeatedSetup() {
    resetDateInputToToday();
    await httpSrvc.fetchConfigs();
    $scope.buttons = {
      visible: [],
      hidden: [],
      all: [],
    }
    const hiddenButtonsByName = {};
    for (const config of httpSrvc.data.configs) {
      config.viewName = config.name;
      config.name = config.name.replace(' ', '_').replace('(','').replace(')','');
      configsByName[config.name] = config; // Save for easier lookup later
      await updateConfigForDisplay(config);
      if (config.parent) {
        configsWithChildren[config.parent] = true;
        if (!hiddenButtonsByName[config.parent]) {
          hiddenButtonsByName[config.parent] = [];
        }
        hiddenButtonsByName[config.parent].push(config);
      } else {
        $scope.buttons.visible.push(config);
      }
      $scope.buttons.all.push(config);
    }
    // Now save all the hidden buttons
    for (const name of Object.keys(hiddenButtonsByName)) {
      $scope.buttons.hidden.push({
        name,
        list: hiddenButtonsByName[name],
      });
    }
    // This should be the ONLY time you scope.apply
    $scope.$apply();

    // Kick this off asyncrhonously
    fetchAndUpdateAllLogTables();
  }

  async function updateConfigForDisplay(config) {
    config.displayIcon = ICONMAP[config.icon] ?? ICONMAP.default;
    switch (config.type) {
      case TIMELY:
        await updateConfigTimelyData(config);
        break;
      case INSTANCE:
        await updateConfigInstanceData(config);
        break;
      case TOGGLE:
        await updateConfigToggleData(config);
        break;
    }
  }

  async function updateConfigTimelyData(config) {
    config.remaining = await httpSrvc.getSumOverPd(config.name, config.refresh_cycle);
    const pct = getPctForTimely(config.remaining, config.goal);
    config.borderColor = getPctColor(pct);
  }

  async function updateConfigInstanceData(config) {
    const lastDoneStr = await httpSrvc.getLastVal(config.name, 1);
    const lastDone = new Date(lastDoneStr);
    const now = new Date();
    config.remaining = Math.floor((now - lastDone) / (DAY_MILLIS));
    if (config.remaining < config.goal) {
      // We're within goal! 100% green
      config.borderColor = getPctColor(1);
    } else {
      // Otherwise, color it so 2x beyond goal is red
      const distancePast = Math.min(config.remaining - config.goal, config.goal);
      config.borderColor = getPctColor(1 - (distancePast / config.goal));
    }
  }

  async function updateConfigToggleData(config) {
    const curState = await httpSrvc.getCurVal(config.name);
    config.isInactive = curState === 0;
    const lastActiveStr = await httpSrvc.getLastVal(config.name, 1);
    let pct;
    [config.remaining, pct] = getRemainingAndPctForToggleDate(lastActiveStr, config);
    config.borderColor = getPctColor(pct);
  }

  async function fetchAndUpdateAllLogTables() {
    for (const config of httpSrvc.data.configs) {
      const table = document.querySelector(`.panel#${config.name}log table`);
      const logs = await httpSrvc.fetchMonthLogs(config.name);
      if (config.type === TIMELY && config.amount_varies && config.refresh_cycle === 'D') {
        addDailySumsToTable(table, logs, config.goal);
        const daylogs = await httpSrvc.fetchDayLogs(config.name);
        createDayLogsDiv(config.name, daylogs);
      } else {
        addAllLogsToTable(table, logs, config.amount_varies);
      }
    }
  }

  $scope.handleButtonClick = function(name) {
    if (name === 'close') {
      // just closing a panel
      closeCurrentPanel();
      return;
    }
    if (name === 'variable') {
      logVariableTimelyAmount();
      closeCurrentPanel();
      return;
    }
    const config = configsByName[name];
    if (!config) {
      // Something went wrong...
      return;
    }
    if (openPanelId && config.parent !== openPanelId) {
      // A panel is open but something else was clicked - ignore it.
      return;
    }
    // if we're opening a panel, don't log - it might just get closed
    // logging can happen later
    if (configsWithChildren[name]) {
      openParentPanel(name);
      return;
    } else if (config.amount_varies) {
      openVariablePanel(config.name);
      return;
    } 
    
    if (config.parent) {
      // Now that a "real" child button has been pressed, also log the parent
      logClick(configsByName[config.parent]);
      closeCurrentPanel();
    }

    // Finally, log this click
    logClick(config);
  }

  function logClick(config) {
    switch (config.type) {
      case TIMELY:
        if (config.amount_varies) {
          // The panel is opening - we'll handle logging from there
          return;
        } else {
          logSingleTimelyOccurence(config);
        }
        break;
      case INSTANCE:
        logInstance(config);
        break;
      case TOGGLE:
        logToggle(config);
        break;
    }
  }

  async function logVariableTimelyAmount() {
    const panel = document.querySelector(`.panel#variable`);
    const name = panel.getAttribute('name');
    const amount = parseInt(panel.querySelector('input.amount').value);
    if (isNaN(amount) || amount < 0) {
      // Must be a positive integer
      return; 
    }
    log(name, amount);
    updateDomForTimelyAmount(name, amount);
  }

  function logSingleTimelyOccurence(config) {
    log(config.name, 1);
    updateDomForTimelyAmount(config.name, 1);
  }

  function logInstance(config) {
    log(config.name, 1);
    updateDomForInstance(config.name);
  }

  function logToggle(config) {
    const oldActiveState = getActiveStateFromDom(config.name);
    const newActiveState = oldActiveState ? 0 : 1;
    log(config.name, newActiveState);
    config.isInactive = oldActiveState; // old state = new inactive value
    updateDomForToggle(config, newActiveState);
  }

  function log(name, amount) {
    const date = document.querySelector('input.date').value;
    httpSrvc.log(name, amount, date);
  }

  function openVariablePanel(name) {
    const panel = document.querySelector(`.panel#variable`);
    const relevantButton = document.querySelector(`button#${name}`);
    panel.querySelector('.header').innerHTML = relevantButton.innerHTML;
    panel.querySelector('input.amount').value = '';
    panel.setAttribute('name', name); // Save for use later
    openPanelNearButton('variable', panel, relevantButton);
    const logsDiv = panel.querySelector(`.daylogs#${name}`);
    if (logsDiv) { logsDiv.classList.remove('hidden'); }
    panel.querySelector('input.amount').focus();
  }

  function openParentPanel(name) {
    const panel = document.querySelector(`.panel#${name}`);
    const relevantButton = document.querySelector(`button#${name}`);
    openPanelNearButton(name, panel, relevantButton);
  }

  $scope.openLogPanel = function(name) {
    const id = `${name}log`;
    const panel = document.querySelector(`.panel#${id}`);
    openPanel(id, panel, 5); 
  }

  $scope.resetDateInputToToday = resetDateInputToToday;

  initialNonRepeatedSetup();
}]);