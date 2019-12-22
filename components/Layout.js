import React from "react";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";

/**
 * @name Layout
 *
 * @param {React.ReactNode} children
 */
const Layout = ({ children }) => (
  <SafeAreaView style={styles.safeAreaView}>
    <StatusBar barStyle="dark-content" />

    {children}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: "#fff"
  }
});

export default Layout;
