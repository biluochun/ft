const Config = {
  DateFmt: 'hh:mm',
};
var myChart = echarts.init(document.getElementById('main'));
var myChart1 = echarts.init(document.getElementById('main1'));
var itemStyle = {
  normal: {
  },
  emphasis: {
    barBorderWidth: 1,
    shadowBlur: 10,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowColor: 'rgba(0,0,0,0.5)'
  }
};
const sell = [0];
const buy = [0];
const IoData = [0];
const AllData = [0];
const xAxisName = [];
var option = {
  legend: {
    data:['sell', 'buy']
  },
  xAxis: {
    data: xAxisName,
    name: 'time',
    axisLine: {onZero: true},
    splitLine: {show: false},
    splitArea: {show: false}
  },
  yAxis: { splitArea: {show: false} },
  grid: { left: 100 },
  series: [{
    name: 'sell',
    type: 'bar',
    stack: 'one',
    itemStyle: itemStyle,
    data: sell,
  }, {
    name: 'buy',
    type: 'bar',
    stack: 'one',
    itemStyle: itemStyle,
    data: buy,
  }]
};
var option1 = {
  legend: {
    data:['io', 'all']
  },
  xAxis: {
    data: xAxisName,
    name: 'time',
    axisLine: {onZero: true},
    splitLine: {show: false},
    splitArea: {show: false}
  },
  yAxis: { splitArea: {show: false} },
  grid: { left: 100 },
  series: [{
    name: 'io',
    type: 'line',
    itemStyle: itemStyle,
    data: IoData,
  }, {
    name: 'all',
    type: 'line',
    itemStyle: itemStyle,
    data: AllData,
  }]
};
var lastValue = {
  sell: 0,
  buy: 0,
};
var allio = 0;

function render (data) {
  const DateKey = DateFormat.format(new Date(data.ts), Config.DateFmt);
  if (xAxisName.length === 0) {
    xAxisName.push(DateKey);
    lastDateKey = xAxisName[0];
  }
  if (lastDateKey !== DateKey) {
    lastDateKey = DateKey;
    xAxisName.push(DateKey);
    sell.push(0);
    buy.push(0);
    IoData.push(0);
    AllData.push(allio);
    lastValue = {
      sell: 0,
      buy: 0,
    };
  }
  const vol = data.amount * data.price;
  if (data.side === 'sell') {
    lastValue.sell -= vol;
    allio -= vol;
  } else {
    lastValue.buy += vol;
    allio += vol;
  }
  
  sell[sell.length - 1] = lastValue.sell;
  buy[buy.length - 1] = lastValue.buy;
  AllData[AllData.length - 1] = allio;
  IoData[IoData.length - 1] = lastValue.buy + lastValue.sell;
}

function draw () {
  myChart.setOption(option);
  myChart1.setOption(option1);
}
var lastData = [];
if (localStorage.lastData) {
  const temp = JSON.parse(localStorage.lastData);
  if (temp.length) lastData = temp;
  TopicCallback(lastData);
}

const ws = new WebSocket('wss://api.fcoin.com/v2/ws');
ws.onopen = () => {
  console.log('ws open');
  ws.send(JSON.stringify({ cmd: 'sub', args: ['trade.ftusdt', 20] }));
};

ws.onmessage = (arg) => {
  const msg = arg.data;
  try {
    const data = JSON.parse(msg.toString());
    switch (data.type) {
      case 'hello': break;
      case 'ping': break;
      case 'topics': console.info('订阅成功', data); break;
      default:
        if (data.type === 'trade.ftusdt') {
          lastData.push(data);
          if (lastData.length > 500) {
            lastData.splice(0, lastData.length - 500);
          }
          localStorage.lastData = JSON.stringify(lastData);
          TopicCallback(data);
        }
        break;
    }
  } catch (e) {
    console.error(msg, e);
    return;
  }
};
function TopicCallback (data) {
  console.log('data', data);
  if (data.length) {
    data.forEach(d => render(d));
  } else {
    render(data);
  }
  draw();
}

ws.onerror = (errs) => {
  if (errs) console.error(errs);
};
