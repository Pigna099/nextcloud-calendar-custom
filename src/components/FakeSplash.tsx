import { View, Image, StyleSheet } from 'react-native';

export default function FakeSplash() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Keep in sync with lightTheme.colors.primary / app.config splash colours.
    backgroundColor: '#08679c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});
