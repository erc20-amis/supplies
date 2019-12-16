const supplies = require('../');

const modifiers = [];

const drivers = supplies.selectDriversByBlockchain('Monero');

const driver = new supplies[drivers[0]]();

driver
  .getSupply(modifiers)
  .then((supply) => {
    console.log(supply);
  });