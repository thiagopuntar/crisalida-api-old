require('dotenv').config();
const { paymentType, unit, sequelize } = require('./index');
sequelize.sync({ force : true })
  .then(async () => {
    await unit.bulkCreate([
      { name: 'kg' },
      { name: 'pct' },
      { name: 'un' },
      { name: 'g' },
      { name: 'L' },
      { name: 'fr' },
      { name: 'colher sopa' },
      { name: 'receita' },
      { name: 'xícara' },
    ])

    await paymentType.bulkCreate([
      { name: 'Dinheiro' },
      { name: 'Débito' },
      { name: 'Crédito' },
      { name: 'Boleto' },
      { name: 'Transferência' },
      { name: 'Depósito' },
    ])

    process.exit(0);
  });