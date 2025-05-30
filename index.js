angular.module('tracking').controller('trackingCtrl', ['$scope', 'httpSrvc', function($scope, httpSrvc) {
  async function initialNonRepeatedSetup() {
    DATE_INPUT = document.querySelector('input.date');
    DATE_INPUT.addEventListener('change', dateInputChanged);

    const yesterday = luxon.DateTime.now().plus({ days: -1 });
    BASE_DATE = IS_EARLY_HOURS ? yesterday.toFormat('yyyy-MM-dd') : getTodayDateInputStr();
    resetDateInputToToday();
    if (IS_EARLY_HOURS) {
      document.querySelector('.note').classList.remove('hidden');
    }

    document.querySelector('input.amount').addEventListener('keypress', handleAmountKeypress);

    await httpSrvc.fetchConfigs();
    $scope.buttons = {
      visible: [],
      hidden: [],
      all: [],
    }
    const hiddenChildButtonsByName = {};
    const configsWithChildren = {};
    for (const config of httpSrvc.data.configs) {
      config.viewName = config.name;
      config.goalStr = shortenNumberForDisplay(config.goal);
      config.name = config.name.replace(' ', '_').replace('(','').replace(')','');
      configsByName[config.name] = config; // Save for easier lookup later
      await updateConfigForDisplay(config);
      if (config.parent) {
        configsWithChildren[config.parent] = true;
        if (!hiddenChildButtonsByName[config.parent]) {
          hiddenChildButtonsByName[config.parent] = [];
        }
        hiddenChildButtonsByName[config.parent].push(config);
      } else {
        $scope.buttons.visible.push(config);
      }
      $scope.buttons.all.push(config);
    }
    // Now update all configs with children
    for (const configName of Object.keys(configsWithChildren)) {
      configsByName[configName].hasChildren = true;
    }
    // Now save all the hidden buttons
    for (const name of Object.keys(hiddenChildButtonsByName)) {
      $scope.buttons.hidden.push({
        name,
        childList: hiddenChildButtonsByName[name],
      });
    }
    // This should be the ONLY time you scope.apply
    $scope.$apply();
    isLoadingConfigs = false;
    document.querySelector('.loadingItem').innerText = 'log tables';
    if (pendingClick) {
      $scope.handleButtonClick(pendingClick);
    }

    // Kick this off asynchronously
    fetchAndUpdateAllLogTables().then(() => {
      document.querySelector("#loadingMessage").remove();
      isLoadingLogTables = false;
      if (pendingPanel) {
        $scope.handleButtonClick(pendingPanel);
      }
    });
  }

  async function updateConfigForDisplay(config) {
    config.displayIcon = config.icon ?? ICONMAP.DEFAULT_ICON;
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
    config.remainingStr = shortenNumberForDisplay(config.remaining);
    const pct = getPctForTimely(config.remaining, config.goal);
    config.borderColor = getPctColor(pct);
  }

  async function updateConfigInstanceData(config) {
    const lastDoneStr = await httpSrvc.getLastVal(config.name, 1);
    const lastDone = new Date(lastDoneStr);
    config.remaining = Math.floor((NOW - lastDone) / (DAY_MILLIS));
    config.remainingStr = shortenNumberForDisplay(config.remaining);
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
    config.remainingStr = shortenNumberForDisplay(config.remaining);
    config.borderColor = getPctColor(pct);
  }

  async function fetchAndUpdateAllLogTables() {
    for (const config of httpSrvc.data.configs) {
      const table = document.querySelector(`.panel#${config.name}log table`);
      const logs = await httpSrvc.fetchMonthLogs(config.name, config.hasChildren);
      if (usesSumLogs(config)) {
        addDailySumsToTable(table, logs, config.goal);
        const daylogs = await httpSrvc.fetchDayLogs(config.name);
        createDayLogsDiv(config.name, daylogs);
      } else {
        addAllLogsToTable(table, logs, config);
      }
    }
  }

  $scope.handleButtonClick = function(name) {
    if (isLoadingConfigs) {
      // Nothing is ready yet; wait
      pendingClick = name;
      return;
    }
    if (name === 'close') {
      // just closing a panel
      closeCurrentPanel();
      return;
    }
    if (name === 'variable') {
      logVariableTimelyAmount();
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
    
    if (isLoadingLogTables && config.amount_varies) {
      // Wait til we're done loading, then open the panel
      pendingPanel = name;
      return;
    }
    // if we're opening a panel, don't log - it might just get closed
    // logging can happen later
    if (config.hasChildren) {
      openParentPanel(name);
      return;
    } else if (config.amount_varies) {
      openVariablePanel(config.name);
      return;
    }
    
    if (config.parent) {
      const panel = document.querySelector(`.panel#${openPanelId}`);
      if (panel.querySelector('.logParentCb').checked) {
        // Now that a "real" child button has been pressed - and the checkbox
        // indicates that we want this -  also log the parent
        logClick(configsByName[config.parent]);
      }
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
    const amtInput = panel.querySelector('input.amount');
    const amount = parseInt(amtInput.value);
    if (isNaN(amount) || amount < 0) {
      // Must be a positive integer
      return; 
    }
    httpSrvc.log(name, amount);
    const config = configsByName[name];
    updateDomForTimelyAmount(name, amount, usesSumLogs(config));
    amtInput.value = '';
    amtInput.focus();
  }

  function logSingleTimelyOccurence(config) {
    httpSrvc.log(config.name, 1);
    updateDomForTimelyAmount(config.name, 1, usesSumLogs(config));
  }

  function logInstance(config) {
    httpSrvc.log(config.name, 1);
    updateDomForInstance(config.name);
  }

  function logToggle(config) {
    const oldActiveState = getActiveStateFromDom(config.name);
    const newActiveState = oldActiveState ? 0 : 1;
    httpSrvc.log(config.name, newActiveState);
    config.isInactive = oldActiveState; // old state = new inactive value
    updateDomForToggle(config, newActiveState);
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
  $scope.yesterday = DAYS_OF_WEEK_ABBREV[(NOW.getDay() + 6) % 7];

  let pendingClick = null;
  let isLoadingConfigs = true;
  let pendingPanel = null;
  let isLoadingLogTables = true;

  initialNonRepeatedSetup();
}]);