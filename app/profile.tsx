import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { app } from "../firebaseConfig";
import { TabBar } from "./components/TabBar";

export default function ProfileScreen() {
  const router = useRouter();
  const auth = getAuth(app);
  const [userName, setUserName] = useState<string>("");
  const [appearanceModalVisible, setAppearanceModalVisible] = useState(false);
  const [appearance, setAppearance] = useState<'light' | 'dark'>('light');

  useFocusEffect(
    React.useCallback(() => {
      const user = auth.currentUser;
      if (user) {
        setUserName(user.displayName || user.email?.split("@")[0] || "User");
      }
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Hello <Text style={styles.userName}>{userName}</Text>!
        </Text>
      </View>

      {/* Profile Card */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardItem} onPress={() => router.push("/account")}>
          <FontAwesome5 name="cog" size={22} color="#707070" style={styles.cardIcon}/>
          <Text style={styles.cardText}>Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cardItem} onPress={() => setAppearanceModalVisible(true)}>
          <MaterialIcons name="palette" size={22} color="#707070" style={styles.cardIcon} />
          <Text style={styles.cardText}>Appearance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cardItem}>
          <MaterialIcons name="show-chart" size={22} color="#707070" style={styles.cardIcon} />
          <Text style={styles.cardText}>Summary</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Appearance */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={appearanceModalVisible}
        onRequestClose={() => setAppearanceModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setAppearanceModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#979797" />
            </TouchableOpacity>
            <Text style={styles.title}>Appearance</Text>
            {/* Options */}
            <TouchableOpacity
              style={styles.option}
            >
              <Text style={styles.optionText}>Dark</Text>
              <TouchableOpacity onPress={() => { setAppearance('dark') }}>
                <View style={[styles.checkCircle, appearance === 'dark' && styles.checked]}>
                  {appearance === 'dark' && <MaterialIcons name="check" size={24} color="#36AF27" />}
                </View>
              </TouchableOpacity>
            </TouchableOpacity>

             <TouchableOpacity
              style={styles.option}
            >
              <Text style={styles.optionText}>Light</Text>
              <TouchableOpacity onPress={() => { setAppearance('light') }}>
                <View style={[styles.checkCircle, appearance === 'light' && styles.checked]}>
                  {appearance === 'light' && <MaterialIcons name="check" size={24} color="#36AF27" />}
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
    marginHorizontal: 20,
    marginTop: 32,
    
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
    fontSize: 19,
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
