import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import PrimaryButton from './components/PrimaryButton';

export default function GetStartedScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>      
      <View style={styles.topSection}>
        <Image
          source={require("../assets/welcomePage-bg-pic.png")}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <Text style={styles.title}>PantryPal</Text>
        <Text style={styles.subtitle}>
          Track groceries, budget, and{"\n"}get tailored meal suggestions
        </Text>
      </View>

      <View style={styles.bottomSection}>        
        <PrimaryButton
          text="Get Started"
          iconName="chevron-right"      
          iconPosition="right"           
          width="100%"
          onPress={() => router.push("/(auth)/login")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: 'space-between',
    borderWidth : 0,
  },
  topSection: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 90,
    gap: 10,
  },
  heroImage: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 28,
  },
  bottomSection: {
    marginBottom: 80,
  },
});