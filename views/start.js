import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, View } from "react-native";
import Button from "../components/Button";

/**
 * @name Start
 *
 * @param {Function} create
 * @param {Function} restore
 */
const Start = ({ create, restore }) => {
  return (
    <View
      style={{
        flex: 1
      }}
    >
      <LinearGradient
        colors={["white", "hotpink"]}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text
            style={{
              marginTop: 16,
              fontSize: 40,
              fontWeight: "800",
              letterSpacing: 1
            }}
          >
            Wallet
          </Text>
        </View>
        <View
          style={{
            borderTopRightRadius: 32,
            borderTopLeftRadius: 32,
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 24,
            backgroundColor: "rgba(255, 255, 255, 0.16)"
          }}
        >
          <View style={{ marginBottom: 24 }}>
            <Button onPress={create} title="Create Wallet" />
          </View>
          <View>
            <Button onPress={restore} title="Import Wallet" />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default Start;
