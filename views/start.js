import React from "react";
import { View, Text } from "react-native";

import Button from "../components/Button";

/**
 * @name Start
 *
 * @param {Function} create
 * @param {Function} restore
 */
const Start = ({ create, restore }) => {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingTop: 30, flex: 1 / 4 }}>
        <Text style={{ textAlign: "center", marginBottom: 16 }}>
          Donut Wallet
        </Text>
        <Text style={{ textAlign: "center" }}>Cash App, Crypto Edition</Text>
      </View>
      <View
        style={{
          display: "flex",
          flex: 3 / 4,
          justifyContent: "space-around",
          paddingHorizontal: 30
        }}
      >
        <Button onPress={create} title="New Wallet" />

        <Button onPress={restore} title="Import Wallet" />
      </View>
    </View>
  );
};

export default Start;
