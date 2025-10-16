import { Entypo } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(auth)/login")}
        >
          <View style={styles.buttonContent}> 
            <Text style={styles.buttonText}>Get Started</Text>
            <Entypo name="chevron-right" style={styles.buttonIcon} />
          </View>
        </TouchableOpacity>
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
  button: {
    width: "100%",
    backgroundColor: "#36AF27",
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  buttonIcon: {
    fontSize: 30,
    color: 'white',
  },
});