import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  title: React.ReactNode;
  showOptionsIcon?: boolean; // Optional icon on right
  onOptionsPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showOptionsIcon = false,
  onOptionsPress,
}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      {showOptionsIcon && (
        <TouchableOpacity onPress={onOptionsPress} style={styles.optionsIcon}>
          <MaterialIcons name="more-vert" size={28} color="#161616" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#161616",
  },
  optionsIcon: {
    position: "absolute",
    right: 20,
  },
});

export default Header;
