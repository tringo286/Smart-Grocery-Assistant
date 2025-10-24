import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TabBar } from "../components/TabBar";

export default function ListDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // get list id param
  // You may fetch the list details with 'id' here

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#161616" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Grocery List</Text>
        <MaterialIcons name="more-vert" size={28} color="#161616" />
      </View>

      {/* Illustration and messages */}
      <View style={styles.centeredContent}>
        <Image source={require("../../assets/cheese.png")} style={styles.illustration} resizeMode="contain" />
        <Text style={styles.mainText}>Let’s plan your shopping</Text>
        <Text style={styles.subText}>Tap the plus button to start adding products</Text>
        <TouchableOpacity style={styles.scanBarcodesButton}>
          <Ionicons name="camera" size={20} color="#22c55e" />
          <Text style={styles.scanText}>Scan Barcodes</Text>
        </TouchableOpacity>
        {/* Add Button */}
        <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>      

      {/* Tab Bar */}
        <TabBar
            activeTab="Lists" // set dynamically per screen if needed
            onTabPress={(tab) => {
                if (tab === "Lists") return;
                // if (tab === "Pantry") router.push("/pantry");
                // if (tab === "Recipes") router.push("/recipes");
                if (tab === "Profile") router.push("/profile");
            }}
        />
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F6F6F6" },
    header: {
        flexDirection: "row", 
        alignItems: "center", 
        justifyContent: "space-between",
        paddingTop: 28,
        paddingHorizontal: 24, 
        paddingBottom: 18, 
        backgroundColor: "#fff"
    },
    headerTitle: { 
        fontSize: 26, 
        fontWeight: "bold", 
        color: "#161616" 
    },
    centeredContent: { 
        marginTop: 50,
        alignItems: "center", 
        justifyContent: "flex-start", 
        flex: 1 
    },
    illustration: {
        height: 210,
        width: 270,
        marginBottom: 28 
    },
    mainText: { 
        fontSize: 19,
        fontWeight: "600", 
        marginBottom: 6, color: "#222" 
    },
    subText: { 
        color: "#6c6c6c", 
        fontSize: 15, 
        marginBottom: 18 
    },
    scanBarcodesButton: { 
        flexDirection: "row",
        alignItems: "center", 
        marginBottom: 28 
    },
    scanText: { 
        fontSize: 16, 
        color: "#36AF27", 
        marginLeft: 6 
    },
    addButton: {
        position: "absolute",
        bottom: 150, 
        right: 50, 
        alignSelf: "center",
        backgroundColor: "#36AF27", 
        borderRadius: 999,
        paddingVertical: 16, 
        paddingHorizontal: 58, 
        marginBottom: 36, 
        flexDirection: "row", 
        alignItems: "center",
    },
    addButtonText: { 
        color: "#fff", 
        fontWeight: "bold", 
        fontSize: 22 
    },
});
