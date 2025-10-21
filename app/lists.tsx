import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { addDoc, collection, onSnapshot, orderBy, query, Timestamp, where } from "firebase/firestore";
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
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);  
  const [newListName, setNewListName] = useState("");
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedList, setSelectedList] = useState<GroceryList | null>(null);

  const handleLogout = async () => {
    try { 
      await signOut(auth);
      Alert.alert("Success", "You’ve been logged out.");
      router.replace("/"); // Redirect to home or login screen
    } catch (error: any) {
      Alert.alert("Logout Failed", error.message);
    }
  };

  const handleSaveNewList = async () => {
    try {
      const user = auth.currentUser; // Access the current user

      if (user) {
        await addDoc(collection(firestore, "lists"), {
          name: newListName.trim(),
          createdAt: Timestamp.fromDate(new Date()), // Firestore Timestamp
          userId: user.uid, // Set userId to the current user's UID
        });

        setModalVisible(false); // Close modal
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

  // Handler functions for Rename, Duplicate, Delete
  const handleRename = () => {
    // Implement rename logic here
    setOptionsModalVisible(false);
  };

  const handleDuplicate = () => {
    // Implement duplicate logic here
    setOptionsModalVisible(false);
  };

  const handleDelete = () => {
    // Implement delete logic here
    setOptionsModalVisible(false);
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
            contentContainerStyle={{ paddingBottom: 18 }}
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
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={30} color="#fff" />
          <Text style={styles.newListText}>New List</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for New List */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          enabled
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalWrapper}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
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
      
      {/* Modal for Setting */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={optionsModalVisible}
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(32,32,32,0.16)",
        }}>
          <View style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            minHeight: 200,
            position: "relative"
          }}>
            {/* X Close Icon at Top Left */}
            <TouchableOpacity
              style={{
                position: "absolute",
                top: 15,
                right: 15,
                zIndex: 2,
                padding: 6,
              }}
              onPress={() => setOptionsModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#979797" />
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingVertical: 16 }} onPress={handleRename}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons name="edit" size={22} color="#222" />
                <Text style={{ fontSize: 18, marginLeft: 16, color: "#222" }}>Rename</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingVertical: 16 }} onPress={handleDuplicate}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons name="content-copy" size={22} color="#222" />
                <Text style={{ fontSize: 18, marginLeft: 16, color: "#222" }}>Duplicate</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingVertical: 16 }} onPress={handleDelete}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons name="delete" size={22} color="#dc3545" />
                <Text style={{ fontSize: 18, marginLeft: 16, color: "#dc3545" }}>Delete</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
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
          <MaterialCommunityIcons name="chart-line" size={26} color="#6c6c6c" />
          <Text style={styles.tabLabel}>Summary</Text>
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
    marginTop: 100,
    marginLeft: 120,
    backgroundColor: "#22c55e",
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  newListText: {  
    color: "#fff",
    fontWeight: "bold",
    fontSize: 19,
  },
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
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(32,32,32,0.4)",
  },
  modalContainer: {
    width: "95%",
    minHeight: 210,
    borderRadius: 32,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 18,
    alignItems: "center",
    shadowColor: "#999",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 10,
  },
  closeButton: {
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
    borderColor: "#36AF27",
    borderWidth: 2,
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