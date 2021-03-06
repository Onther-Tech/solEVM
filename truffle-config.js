'use strict';

module.exports = {
  compilers: {
    solc: {
      version: '0.5.2',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: 'constantinople',
      },
    },
  },
  networks: {
    goerli: {
      host: 'https://goerli.infura.io/v3/' + process.env.INFURA_API_KEY,
      network_id: '5', // eslint-disable-line camelcase
      gas: 6465030,
      gasPrice: 10000000000,
    },
    ganache: {
      host: "127.0.0.1",
      port: 8111,
      network_id: '*', // eslint-disable-line camelcase
      gas: 7000000,
      gasPrice: 1,
    },
    geth: {
      host: "127.0.0.1",
      port: 8222,
      network_id: '*', // eslint-disable-line camelcase
      gas: 7000000,
      gasPrice: 1,
    },
  },
};
