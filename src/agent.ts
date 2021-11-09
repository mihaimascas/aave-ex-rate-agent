import BigNumber from 'bignumber.js'
import {
  BlockEvent,
  Finding,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
  HandleBlock,
} from 'forta-agent'
import Web3 from 'web3';
import {AbiItem} from 'web3-utils'
import * as dotenv from 'dotenv';
import tokens from './tokens.json';
import landingPoolAbiItems from './abi/landing-pool.json';
import assetPriceAbiItem from './abi/asset-price.json';

dotenv.config();

let previousExRate: BigNumber;
const web3 = new Web3(getJsonRpcUrl());

const token1 = tokens.find((t) => t.symbol === process.env.TOKEN_1);
const token2 = tokens.find((t) => t.symbol === process.env.TOKEN_2);

const alertType = process.env.ALERT_DEVIATION || 'UP,DOWN';
const thresholds: number[] = [
    parseInt(process.env.EXR_DEVIATION_PROCENT_INFO || '0.005', 10),
    parseInt(process.env.EXR_DEVIATION_PROCENT_MEDIUM || '0.01', 10),
    parseInt(process.env.EXR_DEVIATION_PROCENT_HIGH || '0.05', 10),
    parseInt(process.env.EXR_DEVIATION_PROCENT_CRITICAL || '0.1', 10),
];

const generateFindings = (exRate: BigNumber): Finding[] => {
  const findings: Finding[] = [];

  if (!previousExRate || !token1 || !token2) {
    return findings;
  }

  const dif = previousExRate.minus(exRate);
  const type = dif.isGreaterThan(0)
      ? 'DOWN'
      : dif.isLessThan(0)
          ? 'UP'
          : null;

  if (!type || dif.isLessThan(thresholds[0]) || !alertType.includes(type)) {
    return findings;
  }

  let severity: FindingSeverity = FindingSeverity.Info;

  switch (true) {
    case dif.abs().isGreaterThanOrEqualTo(thresholds[3]):
      severity = FindingSeverity.Critical;
      break;
    case dif.abs().isGreaterThanOrEqualTo(thresholds[2]):
      severity = FindingSeverity.High;
      break;
    case dif.abs().isGreaterThanOrEqualTo(thresholds[1]):
      severity = FindingSeverity.Medium;
      break;
  }

  findings.push(Finding.fromObject({
    name: `Exchange rate ${type} ${token1?.symbol}/${token2?.symbol}`,
    description: `Exchange rate ${type} by ${dif.dividedBy(100).toFormat(2)}% for ${token1?.symbol}/${token2?.symbol}`,
    alertId: `FORTA-AAVE_EXR_${type}`,
    severity,
    type: FindingType.Info,
    metadata: {
      'diff': dif.toFormat(4),
      'token1': token1.symbol,
      'token2': token2.symbol,
      'currentExRate': exRate.toFormat(4),
      'previousExRate': previousExRate.toFormat(4),
    }
  }));

  return findings;
}

let priceOracleAddress: string;

const getPriceOracleAddress = async () => {
  if (priceOracleAddress) {
    return priceOracleAddress;
  }

  const poContract = new web3.eth.Contract(landingPoolAbiItems as AbiItem[], process.env.LANDING_POOL_ADDRESS);
  priceOracleAddress = await poContract.methods.getPriceOracle().call();

  return priceOracleAddress;
}

const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
  const findings: Finding[] = [];

  if (!token1 || !token2) {
    return findings;
  }

  const poAddress = await getPriceOracleAddress();

  const exrContract = new web3.eth.Contract(assetPriceAbiItem as AbiItem, poAddress);
  const [priceToken1, priceToken2] = await exrContract.methods.getAssetsPrices({
    assets: [token1.address, token2.address]
  }).call(blockEvent.blockNumber);

  const price1 = new BigNumber(priceToken1);
  const price2 = new BigNumber(priceToken2);
  const exRate = price1.dividedBy(price2);

  return generateFindings(exRate);
}

export default {
  handleBlock
}
