import React from "react";
import { StyleSheet, Text } from "react-native";

/**
 * @name Icon
 *
 * @param {React.ReactNode} children
 */
const Icon = () => (
  <Text accessibilityRole="image" style={styles.icon}>
    ⚪️
  </Text>
);

const styles = StyleSheet.create({
  icon: {
    fontSize: 40,
    height: 48,
    width: 48
  }
});

export default Icon;
