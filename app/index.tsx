import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../theme/colors";

export default function GetStartedScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={require("../assets/welcomePage-bg-pic.png")}
        style={styles.logo}
      />

      <Text style={[styles.title, { color: colors.text }]}>PantryPal</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Track groceries, control budget, get meal suggestions
      </Text>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/(auth)/login")}
      >
        <Text style={[styles.buttonText, { color: colors.background }]}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    width: 300,
    height: 300,
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
  },
  subtitle: {
    fontSize: 18,
    color: "#fff",
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
