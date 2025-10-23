import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type TabBarProps = {
  activeTab: "Lists" | "Pantry" | "Recipes" | "Profile";
  onTabPress: (tab: TabBarProps["activeTab"]) => void;
};

export function TabBar({ activeTab, onTabPress }: TabBarProps) {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={activeTab === "Lists" ? styles.tabItemActive : styles.tabItem}
        onPress={() => onTabPress("Lists")}
      >
        <MaterialIcons name="list" size={28} color={activeTab === "Lists" ? "#36AF27" : "#6c6c6c"} />
        <Text style={activeTab === "Lists" ? styles.tabLabelActive : styles.tabLabel}>Lists</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={activeTab === "Pantry" ? styles.tabItemActive : styles.tabItem}
        onPress={() => onTabPress("Pantry")}
      >
        <MaterialCommunityIcons name="warehouse" size={27} color={activeTab === "Pantry" ? "#36AF27" : "#6c6c6c"} />
        <Text style={activeTab === "Pantry" ? styles.tabLabelActive : styles.tabLabel}>Pantry</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={activeTab === "Recipes" ? styles.tabItemActive : styles.tabItem}
        onPress={() => onTabPress("Recipes")}
      >
        <Ionicons name="restaurant-outline" size={25} color={activeTab === "Recipes" ? "#36AF27" : "#6c6c6c"} />
        <Text style={activeTab === "Recipes" ? styles.tabLabelActive : styles.tabLabel}>Recipes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={activeTab === "Profile" ? styles.tabItemActive : styles.tabItem}
        onPress={() => onTabPress("Profile")}
      >
        <MaterialIcons name="person" size={30} color={activeTab === "Profile" ? "#36AF27" : "#6c6c6c"} />
        <Text style={activeTab === "Profile" ? styles.tabLabelActive : styles.tabLabel}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 5,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  tabLabel: {
    fontSize: 14,
    color: "#6c6c6c",
  },
  tabItemActive: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 4,
  },
  tabLabelActive: {
    fontSize: 14,
    color: "#36AF27",
    fontWeight: "bold",
  },
});
