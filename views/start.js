import React from "react";
import { View } from "react-native";
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
      <View
        style={{
          display: "flex",
          flex: 1,
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
