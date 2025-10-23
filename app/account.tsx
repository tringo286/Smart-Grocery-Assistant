import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, signOut, updatePassword, updateProfile } from "firebase/auth";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { app } from "../firebaseConfig";
import { InputModal } from "./components/InputModal";
import { TabBar } from "./components/TabBar";

export default function AccountScreen() {
  const router = useRouter();
  const auth = getAuth(app);

  // One modal mode and value for both name/password
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [modalMode, setModalMode] = useState<'name'|'password'>('name');

  const handleLogout = async () => {
    try { 
      await signOut(auth);
      Alert.alert("Success", "You’ve been logged out.");
      router.replace("/"); // Redirect to home or login screen
    } catch (error: any) {
      Alert.alert("Logout Failed", error.message);
    }
  };

  const openEditNameModal = () => {
    setModalMode('name');
    setEditModalVisible(true);
    const user = auth.currentUser;
    setEditValue(user?.displayName ?? "");
  };
  const openEditPasswordModal = () => {
    setModalMode('password');
    setEditModalVisible(true);
    setEditValue("");
  };

  const handleSaveEdit = async () => {
    const user = auth.currentUser;
    if (!user || !editValue.trim()) return;
    try {
      if (modalMode === 'name') {
        await updateProfile(user, { displayName: editValue.trim() });
        Alert.alert("Success", "Your name has been updated!");
      } else if (modalMode === 'password') {
        try {
          await updatePassword(user, editValue);
          Alert.alert("Success", "Your password has been updated!");
          setEditModalVisible(false);
        } catch (error: any) {
          if (error.code === "auth/requires-recent-login") {
            Alert.prompt(
              "Re-authentication Required",
              "Enter your current password to continue",
              async (currentPassword) => {
                if (!currentPassword) return;
                try {
                  const credential = EmailAuthProvider.credential(
                    user.email!,
                    currentPassword
                  );
                  await reauthenticateWithCredential(user, credential);
                  await updatePassword(user, editValue);
                  Alert.alert("Success", "Your password has been updated!");
                  setEditModalVisible(false);
                } catch (reauthErr: any) {
                  Alert.alert("Re-authentication Failed", reauthErr.message);
                }
              }
            );
          } else {
            Alert.alert("Error", error.message);
          }
        }
      }
      setEditModalVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteAccount = async () => {
  const user = auth.currentUser;
  if (!user) return;

  Alert.alert(
    "Delete Account",
    "Are you sure you want to delete your account? This action cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await user.delete();
            Alert.alert("Success", "Your account has been deleted.");
            router.replace("/");
          } catch (error: any) {
            if (error.code === "auth/requires-recent-login") {
              Alert.prompt(
                "Re-authentication Required",
                "Enter your current password to continue",
                async (currentPassword) => {
                  if (!currentPassword) return;
                  try {
                    const credential = EmailAuthProvider.credential(
                      user.email!,
                      currentPassword
                    );
                    await reauthenticateWithCredential(user, credential);
                    await user.delete();
                    Alert.alert("Success", "Your account has been deleted.");
                    router.replace("/");
                  } catch (reauthErr: any) {
                    Alert.alert("Re-authentication Failed", reauthErr.message);
                  }
                }
              );
            } else {
              Alert.alert("Error", error.message);
            }
          }
        }
      }
    ]
  );
};


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>
      {/* Card Options */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardItem} onPress={openEditNameModal}>
          <Text style={styles.cardText}>Edit name</Text>
          <Feather name="chevron-right" size={24} color="#626262" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cardItem} onPress={openEditPasswordModal}>
          <Text style={styles.cardText}>Change password</Text>
          <Feather name="chevron-right" size={24} color="#626262" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cardItem} onPress={handleLogout}>
          <Text style={styles.cardText}>Log out</Text>
          <Feather name="log-out" size={22} color="#626262" />
        </TouchableOpacity>
      </View>
      {/* Delete Account */}
      <View style={styles.deleteContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete account</Text>
          <MaterialIcons name="delete" size={24} color="#dc3545" />
        </TouchableOpacity>
      </View>

      {/* Name/Password Edit Modal */}
      <InputModal
        visible={editModalVisible}
        title={modalMode === 'name' ? 'Edit Name' : 'Change Password'}
        placeholder={modalMode === 'name' ? 'Your Name' : 'New Password'}
        value={editValue}
        onChangeText={setEditValue}
        onSave={handleSaveEdit}
        onClose={() => setEditModalVisible(false)}
        secureTextEntry={modalMode === 'password'}
      />
      
      {/* Tab Bar */}
      <TabBar
        activeTab="Profile"
        onTabPress={(tab) => {
          if (tab === "Lists") router.push("/lists");
          // ...other navigation logic
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    paddingLeft: 25,
    borderBottomColor: "#ececec",
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#313131",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: 28,
    shadowColor: "#161616",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cardText: {
    fontSize: 18,
    color: "#464646",
    fontWeight: "400",
  },
  deleteContainer: {
    backgroundColor: "transparent",
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 12,
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: "#fff",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 26,
    justifyContent: "space-between",
    shadowColor: "#161616",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  deleteText: {
    color: "#dc3545",
    fontSize: 18,
    fontWeight: "500",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(32,32,32,0.4)",
  },
  modalContainer: {
    width: "100%",
    minHeight: 210,
    borderRadius: 32,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 40,
    alignItems: "center",
    shadowColor: "#999",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 10,
  },
  modalCloseButton: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 1,
  },
  modalTitle: {
    width: "100%",
    textAlign: "left",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 22,
    color: "#222",
  },
  modalInput: {
    width: "100%",
    backgroundColor: "#f8f8f8",
    borderRadius: 11,
    fontSize: 18,
    paddingVertical: 13,
    paddingHorizontal: 15,
    marginBottom: 22,
    color: "#222",
  },
  modalSaveButton: {
    backgroundColor: "#36AF27",
    borderRadius: 28,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 5,
  },
  modalSaveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 19,
  },
});
