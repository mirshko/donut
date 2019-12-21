import BigNumber from "bignumber.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { utils } from "ethers";

dayjs.extend(relativeTime);

/**
 *
 * @param {Number|String} value
 * @param {Number} decimals
 *
 * @returns {String}
 */
export const toFixed = (value, decimals = 4) =>
  new BigNumber(value).toFixed(decimals).toString();

/**
 *
 * @param {Number} ts
 *
 * @returns {String}
 */
export const formatTimestamp = ts => dayjs(Number(ts)).fromNow();

/**
 *
 * @param {String} address
 *
 * @returns {String}
 */
export const truncateAddress = address =>
  `${address.slice(0, 10)}...${address.slice(address.length - 4)}`;

/**
 *
 * @param {Object} tx
 * @param {String} address
 *
 * @returns {Object}
 */
export const parseTx = (tx, address) => {
  // let action = "";
  // let state = "";

  // if (tx.input === "0x") {
  //   action = "ETH";
  // } else if (tx.input !== "0x" && tx.operations.length === 0) {
  //   action = "Smart Contract Execution";
  // } else if (tx.operations.length > 0) {
  //   action = "ERC20";
  // }

  // if (tx.error === true) {
  //   state = "Error";
  // } else if (tx.to === tx.from) {
  //   state = "Self";
  // } else if (tx.from === address.toLowerCase()) {
  //   state = "Sent";
  // } else if (tx.to === address.toLowerCase()) {
  //   state = "Received";
  // }

  return {
    // action,
    // state,
    hash: tx.hash,
    ts: tx.timestamp,
    timestamp: formatTimestamp(tx.timestamp),
    to: tx.to,
    from: tx.from,
    operations: tx.operations,
    // symbol: tx.asset.symbol,
    // value: toFixed(utils.formatEther(tx.value), 2),
    value: tx.value
    // decimals: tx.asset.decimals
  };
};

/**
 *
 * @param {Array} bal
 *
 * @returns {Array}
 */
export const parseBalance = bal =>
  bal.map(({ symbol, decimals, balance, name }) => ({
    symbol,
    decimals,
    balance,
    native: toFixed(utils.formatEther(balance), 4),
    name
  }));

/**
 * @name isSelf
 * @description Returns true if the from address of the transaction is the same as the user's address
 *
 * @param {String} from
 * @param {String} address
 *
 * @returns {Boolean}
 */
export const isSent = (from, address) =>
  from.toLowerCase() === address.toLowerCase() ? true : false;

/**
 * @name isReceived
 * @description Returns true if the to address of the transaction is the same as the user's address
 *
 * @param {String} to
 * @param {String} address
 *
 * @returns {Boolean}
 */
export const isReceived = (to, address) =>
  to.toLowerCase() === address.toLowerCase() ? true : false;

/**
 * @name isSelf
 * @description Returns true if the to address of the transaction is the same as the from address
 *
 * @param {String} to
 * @param {String} from
 *
 * @returns {Boolean}
 */
export const isSelf = (to, from) =>
  to.toLowerCase() === from.toLowerCase() ? true : false;

/**
 * @name parseTxState
 * @param {Array} txs
 * @param {String} address
 *
 * @returns {Array}
 */
export const parseTxState = (txs, address) =>
  txs.map(rawTx => {
    const { to, from, error } = rawTx;

    let state = "Unhandled";

    if (error === true) {
      state = "Error";
    } else if (isSelf(to, from)) {
      state = "Self";
    } else if (isSent(from, address)) {
      state = "Sent";
    } else if (isReceived(to, address)) {
      state = "Received";
    }

    return {
      state,
      ...rawTx
    };
  });
