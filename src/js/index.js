
const Data = {
  Order: {
    DepthLevel: 'L150',
    ViewNumber: 1,
  },
  loading: false,
  Data: null,
  AllSymbol: null,
};

const ws = new WebSocket('wss://api.fcoin.pro/v2/ws');

ws.onmessage = (arg) => {
  const msg = arg.data;
  try {
    const data = JSON.parse(msg.toString());
    console.log(data);
    switch (data.type) {
      case 'hello': break;
      case 'ping': break;
      case 'topics': console.info('订阅成功', data); break;
      default:
      if (data.id && typeof WsReqListen[data.id] === 'function') return WsReqListen[data.id](data);
        // if (data.type === 'depth.L150.' + Data.symbol) TopicCallback(data);
        break;
    }
  } catch (e) {
    console.error(msg, e);
    return;
  }
};
ws.onerror = (errs) => {
  if (errs) console.error(errs);
  alert('无法连接到fcoin行情接口');
};
const opn = new Promise((resolve) =>{
  ws.onopen = () => {
    console.log('ws open');
    // depth.$level.$symbol
    setInterval(() =>{
      ws.send(JSON.stringify({ cmd: 'ping', args: [Date.now()], id: Date.now().toString() }));
    }, 60000);
    resolve();
  };
});


const WsReqListen = {};
const WsReq = (symbol, resolution) => {
  return new Promise(resolve => {
    const id = (Date.now() + Math.random() * 10000000).toString();
    WsReqListen[id] = resolve;
    ws.send(JSON.stringify({ cmd: 'req', args: [`candle.${resolution}.${symbol}`, 20], id }));
  });
};

// 凑合着用。。。
const Math2 = {
  add (...numbers) {
    if (numbers.length === 0) return 0;
    let a = new Decimal(0);
    numbers.forEach(num => {
      a = a.add(num);
    });
    return a.toNumber();
  },
};

const http = axios.create({
  baseURL: 'https://www.fcoin.pro',
  headers: {
    'ft100': 'go',
  },
});
http.interceptors.response.use((response) => {
  const revert = response.data || {};
  if ('status' in revert && revert.status === 'ok') revert.status = 0;
  return response.data;
}, (error) => {
  let status = 0;
  if (error.response) {
    // 服务器有响应。
    status = error.response.status;
  } else if (error.request) {
    // 请求已经发送，但是服务端无响应
    status = 500;
    if (error.message === 'Network Error') {
      status = 500;
    }
  } else {
    // 一些异常原因导致请求出错
    status = 500;
  }
  return Promise.resolve({ status });
});

// https://api.fcoin.com/v2/market/all-tickers
// https://api.fcoin.com/v2/market/candles/D1/$symbol
// 显示
(async () => {
  await opn;
  const [symbols, allTickers] = await Promise.all([
    http.get('/openapi/v2/symbols'), // 所有交易对信息，FOne交易对数据
    WsReq('ftusdt', 'D1'),
  ]);
  if (symbols.status) return Vue.prototype.$message.error(symbols.msg);

  console.log(symbols, allTickers);

  new Vue({
    el: '#app',
    data () {
      return Data;
    },
    computed: {
      SymbolInfo () {
        const AllSymbolInfo = Data.AllSymbol.symbols;
        return AllSymbolInfo[this.symbol] || {};
      },
    },

    methods: {

    },
    template: `
    <div class="orderdiv">
      <el-tag>FT to the moon</el-tag>
      <el-tag type="info">^_^ 我的FT充值地址： 0xc204f261369c0575302f3098da8ecb017aad602b  我的FCoin账号邮箱： 982748666@qq.com 要打赏的请随意~~</el-tag>
      <hr>
      <a href="./depth.html">150档深度查看</a>
    </div>
    `,
  });
})();
