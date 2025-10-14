import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { app } from "../firebaseConfig";

const auth = getAuth(app);

export default function ListsScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Success", "You’ve been logged out.");
      router.replace("/"); // Redirect to home or login screen
    } catch (error: any) {
      Alert.alert("Logout Failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* Main Content */}
      <Text style={styles.title}>Your Lists</Text>
      <Text style={styles.subtitle}>No lists yet. Start by creating one!</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          // Navigate to create list screen
          // router.push("/create-list");
        }}
      >
        <Text style={styles.addButtonText}>+ Create New List</Text>
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
  logoutButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#dc3545",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    zIndex: 1,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  addButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
