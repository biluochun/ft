const query = (() =>{
  const res = (location.search || '').replace('?', '').split('&');
  const map = {};
  res.forEach((str) => {
    const rrr = str.split('=');
    map[rrr[0]] = rrr[1];
  });
  return map;
})();


const ws = new WebSocket('wss://api.fcoin.pro/v2/ws');
const listen = 'depth.L150.' + (query.symbol || 'ftusdt');
ws.onopen = () => {
  console.log('ws open');
  // depth.$level.$symbol
  ws.send(JSON.stringify({ cmd: 'sub', args: [listen] }));
};

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
        if (data.type === listen) TopicCallback(data);
        break;
    }
  } catch (e) {
    console.error(msg, e);
    return;
  }
};
ws.onerror = (errs) => {
  if (errs) console.error(errs);
};

const Data = {
  Order: {
    DepthLevel: 'L150',
    ViewNumber: 1,
  },
  loading: false,
  Data: null,
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

function TopicCallback (data) {
  const bids = [];
  const asks = [];
  data.bids.forEach((num, index) => {
    const isVol = Boolean(index % 2);
    const realIndex = Math.floor(index / 2);
    if (!isVol) {
      bids.push({ price: num, vol: 0 });
    } else {
      bids[realIndex].vol = num;
    }
  });
  data.asks.forEach((num, index) => {
    const isVol = Boolean(index % 2);
    const realIndex = Math.floor(index / 2);
    if (!isVol) {
      asks.push({ price: num, vol: 0 });
    } else {
      asks[realIndex].vol = num;
    }
  });
  Data.Data = { bids, asks };
}

new Vue({
  el: '#app',
  data () {
    return Data;
  },
  computed: {
    ViewNumber () {
      if (this.Order.ViewNumber === 1) return this.Data;
      if (!this.Data) return this.Data;
      const bids = [];
      const asks = [];
      this.Data.bids.forEach((item, index) => {
        if (index % this.Order.ViewNumber === 0) {
          bids.push({ vol: item.vol, price: item.price });
        } else {
          const info = bids[bids.length - 1];
          info.vol = Math2.add(info.vol, item.vol);
          info.price = item.price;
        }
      });
      this.Data.asks.forEach((item, index) => {
        if (index % this.Order.ViewNumber === 0) {
          asks.push({ vol: item.vol, price: item.price });
        } else {
          const info = asks[asks.length - 1];
          info.vol = Math2.add(info.vol, item.vol);
          info.price = item.price;
        }
      });
      return { bids, asks };
    },
    TableData () {
      // 或免去取这个交易对的数据
      // const AllSymbolInfo = HiveStore.localState.Symbols;
      // const SymbolInfo = AllSymbolInfo[`${this.Coins.Coin}${this.Coins.Main}`];
      // if (!SymbolInfo) {
      //   return { Buy: [], Sale: [] };
      // }
      if (!this.ViewNumber) return { Buy: [], Sale: [] };
      let BuySum = 0;
      let SaleSum = 0;
      let MaxV = 0;
      const Buy = this.ViewNumber.bids.map(item => {
        BuySum = Math2.add(BuySum, item.vol);
        if (item.vol > MaxV) MaxV = item.vol;
        return {
          price: item.price,
          vol: item.vol,
          per: 0,
          avol: BuySum,
        };
      });
      const Sale = this.ViewNumber.asks.map(item => {
        SaleSum = Math2.add(SaleSum, item.vol);
        if (item.vol > MaxV) MaxV = item.vol;
        return {
          price: item.price,
          vol: item.vol,
          per: 0,
          aper: 0,
          avol: SaleSum,
        };
      });
      const MaxVol = Math.max(BuySum, SaleSum);
      Buy.forEach(item => {
        item.per = (item.vol / MaxVol).toFixed(2);
        item.aper = (item.avol / MaxVol).toFixed(2);
        // item.price = item.price.toFixed(SymbolInfo.price_decimal);
        // item.vol = item.vol.toFixed(SymbolInfo.amount_decimal);
        // item.avol = item.avol.toFixed(SymbolInfo.amount_decimal);
      });
      Sale.forEach(item => {
        item.per = (item.vol / MaxVol).toFixed(2);
        item.aper = (item.avol / MaxVol).toFixed(2);
        // item.price = item.price.toFixed(SymbolInfo.price_decimal);
        // item.vol = item.vol.toFixed(SymbolInfo.amount_decimal);
        // item.avol = item.avol.toFixed(SymbolInfo.amount_decimal);
      });
      return { Buy, Sale };
    },
  },
  template: `
  <div class="orderdiv">
    <el-tag>FT to the moon</el-tag><hr>
    <el-radio-group v-model="Order.DepthLevel" size="mini" v-loading="loading">
      <!-- <el-radio-button label="L20">20档</el-radio-button> -->
      <el-radio-button label="L150">150档</el-radio-button>
    </el-radio-group>

    <el-radio-group v-model="Order.ViewNumber" size="mini" v-loading="loading">
      <el-radio-button :label="1">全视图</el-radio-button>
      <el-radio-button :label="2">压缩两倍</el-radio-button>
      <el-radio-button :label="4">压缩四倍</el-radio-button>
      <el-radio-button :label="8">压缩八倍</el-radio-button>
      <el-radio-button :label="16">压缩十六倍</el-radio-button>
    </el-radio-group>
    <hr>

    <div style="width:1002px;overflow:hidden;margin:0 auto;" v-loading="loading">
      <div class="ul" style="text-align:right;float:left;">
        <div style="border-bottom:1px solid #eee;overflow:hidden;position: relative;" class="buy">
          <div style="width:120px;" type="primary">价格</div>
          <div style="width:180px;">深度</div>
          <div style="width:180px;">合计深度</div>
        </div>
      </div>
      <div class="ul" style="text-align:left;float:left;">
        <div style="border-bottom:1px solid #eee;overflow:hidden;position: relative;" class="sale">
          <div style="width:120px;" type="primary">价格</div>
          <div style="width:180px;">深度</div>
          <div style="width:180px;">合计深度</div>
        </div>
      </div>
      <hr>
      <div class="ul" v-for="(data,iii) in [TableData.Buy, TableData.Sale]" :key="iii" :style="{ 'text-align': iii ? 'left' : 'right' }" style="float:left;">
        <div :title="item.per + '%'" style="border-bottom:1px solid #eee;overflow:hidden; position: relative;" :class="iii ? 'sale' : 'buy'" v-for="(item,index) in data" :key="index">
          <div style="width:120px;" type="primary">{{ item.price }}</div>
          <div style="width:180px;">{{ item.vol }}</div>
          <div style="width:180px;">{{ item.avol }}</div>
          <div v-if="iii" class="line" :style="{ left: item.aper * 500 - item.per * 500 + 'px', width: item.per * 500 + 'px' }"></div>
          <div v-else class="line" :style="{ right: item.aper * 500 - item.per * 500 + 'px', width: item.per * 500 + 'px' }"></div>
          <div class="line all" :style="{ width: item.aper * 500 + 'px' }"></div>
        </div>
      </div>
    </div>
  </div>
  `,
});
