/**
 * ToastRoot
 *
 * Native Android-style toast — small dark pill at the bottom,
 * plain text only, no card chrome, no coloured borders.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Toast, { type ToastConfig } from 'react-native-toast-message';

const Pill: React.FC<{ text1?: string; text2?: string }> = ({ text1, text2 }) => (
  <View style={styles.pill}>
    {text1 ? <Text style={styles.text}>{text1}</Text> : null}
    {text2 ? <Text style={styles.text}>{text2}</Text> : null}
  </View>
);

const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => <Pill text1={text1} text2={text2} />,
  error:   ({ text1, text2 }) => <Pill text1={text1} text2={text2} />,
  info:    ({ text1, text2 }) => <Pill text1={text1} text2={text2} />,
};

export const ToastRoot: React.FC = () => (
  <Toast
    config={toastConfig}
    position="bottom"
    bottomOffset={40}
    visibilityTime={3000}
  />
);

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(50, 50, 50, 0.92)',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 20,
    maxWidth: '80%',
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
