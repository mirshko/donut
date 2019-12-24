import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

/**
 * @name Button
 *
 * @param {String} title
 * @param {Function} onPress
 */
const Button = ({ title, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="image"
    style={styles.button}
  >
    <Text style={styles.text}>{title}</Text>
  </TouchableOpacity>
);

Button.propTypes = {
  title: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "pink",
    height: 48,
    borderRadius: 99999
  },
  text: {
    textAlign: "center",
    color: "black",
    fontWeight: "600",
    letterSpacing: 0.1,
    fontSize: 18,
    lineHeight: 48
  }
});

export default Button;
