import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { app } from "../firebaseConfig";
import { getThemeColors } from "../theme/colors";
import Header from "./components/Header";
import TabBar from "./components/TabBar";

export default function ProfileScreen() {
  const router = useRouter();
  const auth = getAuth(app);
  const { themeMode, setTheme, isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [userName, setUserName] = useState<string>("");
  const [appearanceModalVisible, setAppearanceModalVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const user = auth.currentUser;
      if (user) {
        setUserName(user.displayName || user.email?.split("@")[0] || "User");
      }
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <Header
        title={
          <>
            Hello <Text style={{ color: "#36AF27" }}>{userName}</Text> !
          </>
        }
      />

      {/* Profile Card */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.cardItem, { borderBottomColor: colors.border }]}
          onPress={() => router.push("/account")}
        >
          <FontAwesome5 name="cog" size={22} color={colors.textSecondary} style={styles.cardIcon} />
          <Text style={[styles.cardText, { color: colors.text }]}>Account</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.cardItem, { borderBottomColor: colors.border }]}
          onPress={() => setAppearanceModalVisible(true)}
        >
          <MaterialIcons name="palette" size={22} color={colors.textSecondary} style={styles.cardIcon} />
          <Text style={[styles.cardText, { color: colors.text }]}>Appearance</Text>
        </TouchableOpacity>

         <TouchableOpacity style={[styles.cardItem, { borderBottomColor: "transparent" }]}>
          <MaterialIcons name="show-chart" size={22} color={colors.textSecondary} style={styles.cardIcon} />
          <Text style={[styles.cardText, { color: colors.text }]}>Summary</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Appearance */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={appearanceModalVisible}
        onRequestClose={() => setAppearanceModalVisible(false)}
      >
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setAppearanceModalVisible(false)}
            >
              <Ionicons name="close" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Appearance</Text>

            {/* Options */}
            <TouchableOpacity style={styles.option}>
              <Text style={[styles.optionText, { color: colors.text }]}>System</Text>
              <TouchableOpacity onPress={() => setTheme("system")}>
                <View
                  style={[
                    styles.checkCircle,
                    { borderColor: colors.border },
                    themeMode === "system" && styles.checked,
                  ]}
                >
                  {themeMode === "system" && (
                    <MaterialIcons name="check" size={24} color="#36AF27" />
                  )}
                </View>
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option}>
              <Text style={[styles.optionText, { color: colors.text }]}>Dark</Text>
              <TouchableOpacity onPress={() => setTheme("dark")}>
                <View
                  style={[
                    styles.checkCircle,
                    { borderColor: colors.border },
                    themeMode === "dark" && styles.checked,
                  ]}
                >
                  {themeMode === "dark" && (
                    <MaterialIcons name="check" size={24} color="#36AF27" />
                  )}
                </View>
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option}>
              <Text style={[styles.optionText, { color: colors.text }]}>Light</Text>
              <TouchableOpacity onPress={() => setTheme("light")}>
                <View
                  style={[
                    styles.checkCircle,
                    { borderColor: colors.border },
                    themeMode === "light" && styles.checked,
                  ]}
                >
                  {themeMode === "light" && (
                    <MaterialIcons name="check" size={24} color="#36AF27" />
                  )}
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TabBar
        activeTab="Profile"
        onTabPress={(tab) => {
          if (tab === "Lists") router.push("/lists");
          if (tab === "Pantry") router.push("/pantry");
          if (tab === "Recipes") router.push("/recipes");
          if (tab === "Profile") return;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#f6f6f6",
    justifyContent: "flex-start",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingLeft: 25,
    borderBottomColor: "#ececec",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#313131",
  },
  userName: {
    color: '#36AF27', 
    fontWeight: 'bold', 
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    marginHorizontal: 18,
    marginTop: 20,    
    shadowColor: "#161616",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cardIcon: {
    width: 28,
  },
  cardText: {
    fontSize: 16,
    color: "#454545",
    marginLeft: 18,
    fontWeight: "500",
  },

  // Modal for Appearance
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(32,32,32,0.4)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 24,
    alignItems: "stretch",
    minHeight: 210,
  },
  modalCloseButton: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 1,
  },
  title: {
    fontSize: 21,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 13,
    color: "#222",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  optionText: {
    fontSize: 18,
    color: "#222",
    fontWeight: "400",
  },
  checkCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#eee",
    borderWidth: 2, borderColor: "#ccc",
    alignItems: "center", justifyContent: "center",
  },
  checked: {
    backgroundColor: "#e6f8e2",
    borderColor: "#36AF27",
  },

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
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 14,
    color: "#807f7f",
    marginTop: 2,
  },
  tabItemActive: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 6,
  },
  tabLabelActive: {
    fontSize: 14,
    color: "#36AF27",
    fontWeight: "bold",
    marginTop: 2,
  },
});