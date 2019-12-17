import React from "react";
import { View, Text } from "react-native";

export const NetworkIdentifier = ({ name, color }) => (
  <View
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: color,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 99999
    }}
  >
    <Text
      style={{
        color: "white",
        fontWeight: "700",
        textTransform: "uppercase",
        fontSize: 12,
        letterSpacing: 1.2
      }}
    >
      {name}
    </Text>
  </View>
);

export default {
  /**
   * @name Mainnet
   * @description Frontier, Homestead, Metropolis, the Ethereum public PoW main network
   */
  1: {
    name: "Mainnet",
    color: "#56B4AE",
    id: 1
  },

  /**
   * @name Ropsten
   * @description Public cross-client Ethereum PoW testnet
   */
  3: {
    name: "Ropsten",
    color: "#EE5A8D",
    id: 3
  },

  /**
   * @name Rinkeby
   * @description Public Geth-only PoA testnet
   */
  4: {
    name: "Rinkeby",
    color: "#F0C45C",
    id: 4
  },

  /**
   * @name Goerli
   * @description Public cross-client PoA testnet
   */
  5: {
    name: "Goerli",
    color: "#4C99EB",
    id: 5
  },

  /**
   * @name Kovan
   * @description Public Parity-only PoA testnet
   */
  42: {
    name: "Kovan",
    color: "#6A5FF6",
    id: 42
  }
};
