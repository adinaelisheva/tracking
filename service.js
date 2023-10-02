angular.module('tracking',[]).service('httpSrvc', ['$http', function ($http) {
  const data = {
    configs: [],
  };

  this.fetchConfigs = async function() {
    const configs = await $http.get('/tracking/configs.php');
    data.configs = configs.data;
  }

  this.fetchMonthLogs = async function(name) {
    let qStr = '/tracking/monthlogs.php';
    if (name) { qStr = qStr + `?name=${name}`; }
    const logs = await $http.get(qStr);
    return logs.data;
  }

  this.fetchDayLogs = async function(name) {
    let qStr = '/tracking/daylogs.php';
    if (name) { qStr = qStr + `?name=${name}`; }
    const logs = await $http.get(qStr);
    return logs.data;
  }

  // Date is optional
  this.log = async function(name, value, date) {
    if(!name || value == null) { return; }
    // Commented out temporarily for testing local changes only
    const results = await $http.post(`/tracking/add.php`, {
      name,
      value,
      date,
    });
    return results;
  }

  this.getCurVal = async function(name) {
    if (!name) { return; }
    const result = await $http.get(`/tracking/curval.php?name=${name}`);
    let ret = parseInt(result.data);
    if (isNaN(ret)) {
      ret = 0;
    }
    return ret;
  }

  this.getLastVal = async function(name, value) {
    if (!name) { return; }
    const result = await $http.get(`/tracking/lastval.php?name=${name}&value=${value}`);
    return result.data.trim() + TIME_SUFFIX;
  }

  this.getSumOverPd = async function(name, pd) {
    if (!name || !pd) { return; }
    const result = await $http.get(`/tracking/sumoverpd.php?name=${name}&period=${pd}`);
    let ret = parseInt(result.data);
    if (isNaN(ret)) {
      ret = 0;
    }
    return ret;
  }
  
  this.data = data;
}]);