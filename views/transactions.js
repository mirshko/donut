import React from "react";
import { View } from "react-native";
import TransactionList from "../components/TransactionList";
import Button from "../components/Button";
import { WINDOW_WIDTH } from "../constants";

/**
 * @name Transactions
 *
 * @param {String} address
 * @param {Number} chainId
 * @param {Function} onSend
 */
const Transactions = ({ address, chainId, onSend }) => {
  return (
    <>
      <TransactionList address={address} chainId={chainId} />

      <View
        style={{
          position: "absolute",
          bottom: 0,
          width: WINDOW_WIDTH,
          paddingBottom: 24
        }}
      >
        <View style={{ paddingHorizontal: 48 }}>
          <Button onPress={onSend} title="Send" />
        </View>
      </View>
    </>
  );
};

export default Transactions;
