import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function GetStartedScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PantryPal</Text>
      <Text style={styles.subtitle}>
          Track groceries, control budget, get meal suggestions
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push("/(auth)/signup")}
      >
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push("/(auth)/login")}
      >
        <Text style={styles.secondaryButtonText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#007bff",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  secondaryButton: {
    width: "100%",
    backgroundColor: "#f8f9fa",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007bff",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#007bff",
    fontSize: 18,
    fontWeight: "600",
  },
});
