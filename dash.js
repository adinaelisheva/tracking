angular.module('tracking').controller('dashCtrl', ['$scope', 'httpSrvc', function($scope, httpSrvc) {
  async function setup() {
    let catId = '';
    // Grab cat from URL
    const params = location.search.substring(1).split('&');
    for (const pair of params) {
      if (!pair.startsWith('c=')) { continue; }
      // The db needs an underscore, but the UI wants a space
      catId = pair.substring(2).replace('%20', '_');
      $scope.category = catId.replace('_', ' ');
    }
    document.title += ` ${$scope.category}`;

    $scope.config = await httpSrvc.fetchConfig($scope.category);
    document.body.style.background = `#${$scope.config.color}`;
    const hsl = hexToHsl($scope.config.color);
    defaultBgColor = `hsl(${Math.floor(hsl[0]*360)}, 80%, 40%)`;

    // First try to get any child logs. If none, we can go to the parent.
    $scope.logs = await httpSrvc.fetchManyLogs(catId, /* hasChildren= */ true);
    if ($scope.logs.length === 0) {
      $scope.logs = await httpSrvc.fetchManyLogs(catId, /* hasChildren= */ false);
    }

    let data = [];
    if ($scope.config.type === TIMELY && $scope.config.refresh_cycle === 'D') {
      data = gatherDailyData($scope.logs, $scope.config.goal, defaultBgColor);
    }

    if (data.length) {
      new Chart(
        document.getElementById('chart'),
        {
          type: 'bar',
          options: {
            animation: false,
            plugins: {
              legend: {
                display: false
              },
              colors: {
                enabled: false
              },
              annotation: {
                annotations: {
                  line1: {
                    type: 'line',
                    yMin: $scope.config.goal,
                    yMax: $scope.config.goal,
                    borderColor: '#ffdddd',
                    borderWidth: 1,
                  }
                }
              }
            },
          },
          data: {
            labels: data[0],
            datasets: [
              {
                label: 'Amount per day',
                data: data[1],
                backgroundColor: data[2],
              }
            ]
          }
        }
      );
    }
  }

  setup();

  // All data-gathering functions return [labels, data, colors]
  function gatherDailyData(logs, goal, defaultBgColor) {
    const dateToTotal = {};
    for (let item of logs) {
      const date = luxon.DateTime.fromSQL(item.date).toFormat("L/d");
      if (dateToTotal[date]) {
        dateToTotal[date] += item.value;
      } else {
        // Found a new day, but we're full up, so stop counting
        if (Object.keys(dateToTotal).length === 30) {
          break;
        }
        dateToTotal[date] = item.value;
      }
    }
    const dates = Object.keys(dateToTotal).reverse();
    const amounts = Object.values(dateToTotal).reverse();
    const colors = [];
    for (let amt of amounts) {
      if (amt >= goal) {
        colors.push(defaultBgColor);
      } else {
        colors.push("#ad0707");
      }
    }
    return [dates, amounts, colors];
  }

  // from https://stackoverflow.com/a/5624139 and https://gist.github.com/mjackson/5311256
  function hexToHsl(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;
  
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h;
    let s;
    let l = (max + min) / 2;
  
    if (max == min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
  
      h /= 6;
    }
  
    return [ h, s, l ];
  }
}]);