import { FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp, updateDoc, where } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { app, firestore } from "../firebaseConfig";

const auth = getAuth(app);

type GroceryList = {
  id: string;
  name: string;
  createdAt: Date;  
  userId: string;
};

export default function ListsScreen() {
  const router = useRouter()
  const [newListModaVisible, setNewListModaVisible] = useState(false);  
  const [newListName, setNewListName] = useState("");
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedList, setSelectedList] = useState<GroceryList | null>(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const openRenameModal = () => {
    setRenameModalVisible(true);
    setOptionsModalVisible(false);
    setRenameValue(selectedList?.name || "");
  };

  const handleLogout = async () => {
    try { 
      await signOut(auth);
      Alert.alert("Success", "You’ve been logged out.");
      router.replace("/"); // Redirect to home or login screen
    } catch (error: any) {
      Alert.alert("Logout Failed", error.message);
    }
  };

  // Handler functions for Creating a New List
  const handleSaveNewList = async () => {
    try {
      const user = auth.currentUser; // Access the current user

      if (user) {
        await addDoc(collection(firestore, "lists"), {
          name: newListName.trim(),
          createdAt: Timestamp.fromDate(new Date()), // Firestore Timestamp
          userId: user.uid, // Set userId to the current user's UID
        });

        setNewListModaVisible(false); // Close modal
        setNewListName("");     // Reset input field
      } else {
        Alert.alert("Error", "User is not authenticated.");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message); // Now TypeScript knows `error` is an instance of `Error`
      } else {
        Alert.alert("Error", "An unknown error occurred.");
      }
    }
  };

  // Handler functions for Renaming a List
  const handleRename = async (newName: string) => {
    if (!selectedList) return;
    try {
      const docRef = doc(firestore, "lists", selectedList.id);
      await updateDoc(docRef, { name: newName.trim() });
      setRenameModalVisible(false);
      Alert.alert("List renamed!");
    } catch (error: any) {
      Alert.alert("Rename Failed", error.message);
    }
  };

  // Handler functions for Deleting a List
  const handleDelete = async () => {
    if (!selectedList) return;
    try {
      await deleteDoc(doc(firestore, "lists", selectedList.id));
      setOptionsModalVisible(false);
      Alert.alert("List deleted!");
    } catch (error: any) {
      Alert.alert("Delete Failed", error.message);
    }
  };

  // Handler functions for Duplicating a List
  const handleDuplicate = async () => {
    if (!selectedList) return;
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      await addDoc(collection(firestore, "lists"), {
        name: selectedList.name + " (Copy)",
        createdAt: Timestamp.fromDate(new Date()),
        userId: user.uid,
      });
      setOptionsModalVisible(false);
      Alert.alert("List duplicated!");
    } catch (error: any) {
      Alert.alert("Duplicate Failed", error.message);
    }
  };


  React.useEffect(() => {
    const user = auth.currentUser; // Access the current user using auth()
    if (!user) return; // Exit if no user is found

    const q = query(
      collection(firestore, "lists"), // Access the "lists" collection
      where("userId", "==", user.uid), // Query lists for the current user's UID
      orderBy("createdAt", "desc") // Order by creation date
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLists(
        snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            createdAt: data.createdAt instanceof Timestamp
              ? data.createdAt.toDate() // Convert Firestore Timestamp to JavaScript Date
              : new Date(data.createdAt), // Handle case if it's already a JavaScript Date
            userId: data.userId,
          };
        })
      );
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Lists</Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.body}>
        {lists.length === 0 ? (
          <>
            <Image source={require("../assets/mylist-logo.png")} style={styles.illustration} resizeMode="contain" />
            <Text style={styles.bodyTitle}>Let’s plan your shopping</Text>
            <Text style={styles.bodySubtitle}>Tap the plus button to create your list</Text>
          </>
        ) : (
          <FlatList
            data={lists}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 110 }}
            renderItem={({ item }) => (
              <View style={styles.listCard}>
                <View>
                  <Text style={styles.listName}>{item.name}</Text>
                  <Text style={styles.listItemCount}>0 item</Text>
                </View>
                 <TouchableOpacity
                  onPress={() => {
                    setSelectedList(item);
                    setOptionsModalVisible(true);
                  }}
                >
                  <MaterialIcons name="more-vert" size={24} color="#595959" />
                </TouchableOpacity>
              </View>
            )}
            style={{ width: "100%" }}
          />
        )}

        <TouchableOpacity
          style={styles.newListButton}
          onPress={() => setNewListModaVisible(true)}
        >
          <Ionicons name="add" size={30} color="#fff" />
          <Text style={styles.newListText}>New List</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for New List */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={newListModaVisible}
        onRequestClose={() => setNewListModaVisible(false)}
      >
        <KeyboardAvoidingView
          enabled
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalWrapper}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setNewListModaVisible(false)}
            >
              <Ionicons name="close" size={32} color="#979797" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create a new list</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Grocery List"
              value={newListName}
              onChangeText={setNewListName}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleSaveNewList}
              disabled={!newListName.trim()}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Modal for Options */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={optionsModalVisible}
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <View style={styles.optionsModalOverlay}>
          <View style={styles.optionsModalContainer}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setOptionsModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#979797" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.OptionButton} onPress={openRenameModal}>
              <View style={styles.optionRow}>
                <MaterialIcons name="edit" size={22} color="#222" />
                <Text style={styles.optionText}>Rename</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.OptionButton} onPress={handleDuplicate}>
              <View style={styles.optionRow}>
                <MaterialCommunityIcons name="content-copy" size={22} color="#222" />
                <Text style={styles.optionText}>Duplicate</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.OptionButton} onPress={handleDelete}>
              <View style={styles.optionRow}>
                <MaterialIcons name="delete" size={22} color="#dc3545" />
                <Text style={[styles.optionText, { color: "#dc3545" }]}>Delete</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Modal for Rename */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={renameModalVisible}
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <KeyboardAvoidingView
          enabled
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalWrapper}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setRenameModalVisible(false)}
            >
              <Ionicons name="close" size={32} color="#979797" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Rename list</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="List Name"
              value={renameValue}
              onChangeText={setRenameValue}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={() => handleRename(renameValue)}
              disabled={!renameValue.trim()}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItemActive}>
          <MaterialIcons name="list" size={28} color="#36AF27" />
          <Text style={styles.tabLabelActive}>Lists</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <MaterialCommunityIcons name="warehouse" size={27} color="#6c6c6c" />
          <Text style={styles.tabLabel}>Pantry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="restaurant-outline" size={25} color="#6c6c6c" />
          <Text style={styles.tabLabel}>Recipes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <FontAwesome name="user" size={30} color="#6c6c6c" />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,    
    backgroundColor: "#F1F0F0",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#161616",
  },
  logoutButton: {
    position: "absolute",
    top: 20,
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
  body: {
    alignItems: "center",
    top: 0,
    flex: 1,
    paddingTop: 8,
  },
  illustration: {
    height: 210,
    width: 270,
    marginBottom: 36,
  },
  bodyTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: "#202020",
    marginBottom: 8,
  },
  bodySubtitle: {
    color: "#969696",
    fontSize: 17,
    marginBottom: 50,
  },
  newListButton: {
    position: "absolute",
    bottom: 90, 
    right: 20,   
    backgroundColor: "#22c55e",
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  zIndex: 10,
  },
  newListText: {  
    color: "#fff",
    fontWeight: "bold",
    fontSize: 19,
  },

  // List Cards
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    // Drop shadow (for iOS & Android)
    shadowColor: "#222",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  listName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  listItemCount: {
    fontSize: 13,
    color: "#B2B2B2",
  },

  // Modal for New List
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
  },

  // Modal for Options
  optionsModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(32,32,32,0.4)",
  },
  optionsModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 200,
    position: "relative",
  },
  OptionButton: {
    paddingVertical: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    fontSize: 18,
    marginLeft: 16,
    color: "#222",
  },
  deleteText: {
    color: "#dc3545",
  },

  // Tab Bar
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