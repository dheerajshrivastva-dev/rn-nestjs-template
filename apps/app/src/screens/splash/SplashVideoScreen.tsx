import React from 'react';
import {StyleSheet, View, useColorScheme} from 'react-native';

import LottieView from 'lottie-react-native';

import splashAnimation from '../../assets/splashAnimation.json';

interface SplashVideoScreenProps {
  onFinish: () => void;
}

export const SplashVideoScreen: React.FC<SplashVideoScreenProps> = ({onFinish}) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <View style={isDark ? styles.containerDark : styles.container}>
      <LottieView
        source={splashAnimation}
        style={styles.lottie}
        autoPlay
        loop={false}
        onAnimationFinish={onFinish}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  lottie: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
