/**
 * @name TransactionState
 *
 * @param {String} state
 */

const TransactionState = ({ state }) => {
  let icon = "👀";

  if (state === "SENT") {
    icon = "⬆️ Sent";
  } else if (state === "RECEIVED") {
    icon = "⬇️ Received";
  } else if (state === "SELF") {
    icon = "👤 Self";
  } else if (state === "ERROR") {
    icon = "❌ Error";
  }

  return icon;
};

export default TransactionState;
