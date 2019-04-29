const Driver = require('../models/driver');
const Supply = require('../models/supply');
const request = require('../request');
const { promisesMap } = require('../utils');

class NeoScan extends Driver {
  constructor() {
    super({
      blockchains: ['neo'],
      timeout: 100, // 10 requests per second
    });
  }

  async _fetchTotalSupply(coin) {
    await this.throttle.push();

    const options = {
      url: 'https://seed1.cityofzion.io',
      method: 'post',
      body: {
        jsonrpc: '2.0',
        method: 'getassetstate',
        params: [coin.reference],
        id: 1,
      },
    };

    const { result } = await request(options);

    return Number(result.amount);
  }

  async _fetchBalance(coin, modifier) {
    await this.throttle.push();

    const data = await request(`https://api.neoscan.io/api/main_net/v1/get_balance/${modifier.reference}`);
    const { amount: balance } = data.balance.find(item => item.asset_hash === coin.reference);

    return balance;
  }

  async getSupply(coin) {
    const total = await this._fetchTotalSupply(coin);
    const modifiers = await promisesMap(
      coin.modifiers,
      modifier => this._fetchBalance(coin, modifier).then(balance => ({ ...modifier, balance })),
    );
    const circulating = modifiers.reduce((current, modifier) => current - modifier.balance, total);

    return new Supply({
      total,
      circulating,
      modifiers,
    });
  }
}

module.exports = NeoScan;