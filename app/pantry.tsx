import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import React, { Fragment, useEffect, useState } from "react";
import { Alert, Animated, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { app, firestore } from "../firebaseConfig";
import { getThemeColors } from "../theme/colors";
import BodySubtitle from "./components/BodySubtitle";
import BodyTitle from "./components/BodyTitle";
import Header from "./components/Header";
import TabBar from "./components/TabBar";

type Item = {
  id: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  price: string;
  expirationDate: string;
};

export default function PantryScreen() {
  const router = useRouter();
  const auth = getAuth(app);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [pantryItems, setPantryItems] = useState<Item[]>([]);
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const addButtonOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.3],
    extrapolate: "clamp",
  });
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Item> | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<Item>>({});
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);  

  const onItemPress = (item: Item) => {
    setEditingItem(item);
    setEditedValues({
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      expirationDate: item.expirationDate
    });
    setDetailsModalVisible(true);
  };
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const pantryCol = collection(firestore, "pantry");
    const q = query(pantryCol, where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPantryItems(
          snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                name: doc.data().name,
                category: doc.data().category,
                quantity: doc.data().quantity || "",
                unit: doc.data().unit || "",
                price: doc.data().price || "",
                expirationDate: doc.data().expirationDate || "",
              }) as Item
          )
        );
      },
      (error) => {
        // Handle permission denied errors silently (e.g., after logout)
        if (error.code === 'permission-denied') {
          return;
        }
        console.error("Error fetching pantry items:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  const groupedPantryItems = pantryItems.reduce<{ [cat: string]: Item[] }>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  async function deleteItemFromPantry(itemId: string) {
    try {
      await deleteDoc(doc(firestore, "pantry", itemId));
    } catch (error) {
      console.warn("Failed to delete item:", error);
      Alert.alert("Error", "Failed to delete item. Please try again.");
    }
  }

  async function handleDeleteAll() {
    setOptionsModalVisible(false);
    
    Alert.alert(
      "Delete All Items",
      "Are you sure you want to delete all pantry items? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              const deletePromises = pantryItems.map(item => 
                deleteDoc(doc(firestore, "pantry", item.id))
              );
              await Promise.all(deletePromises);
            } catch (error) {
              console.error("Failed to delete all items:", error);
              Alert.alert("Error", "Failed to delete all items. Please try again.");
            }
          }
        }
      ]
    );
  }

  const hasItems = pantryItems.length > 0;

  const handleInputChange = (field: keyof Item, value: string) => {
    setEditedValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!editingItem) return;

    const updatedItem: Item = {
      ...editingItem,
      ...editedValues,
      id: editingItem.id!,
      name: editingItem.name!,
      category: editingItem.category!,
      quantity: editedValues.quantity ?? editingItem.quantity ?? "",
      unit: editedValues.unit ?? editingItem.unit ?? "",
      price: editedValues.price ?? editingItem.price ?? "",
      expirationDate: editedValues.expirationDate ?? editingItem.expirationDate ?? "",
    };

    try {
      await updateDoc(doc(firestore, "pantry", editingItem.id!), {
        ...updatedItem,
      });
      setDetailsModalVisible(false);
    } catch (error) {
      console.error("Failed to save pantry item:", error);
      Alert.alert("Error", "Failed to save item. Please try again.");
    }
  };

  function getItemDetailLine(item: Item) {
    const parts: string[] = [];
    if (item.price && item.price.trim() !== "") {
      const price = item.price.startsWith("$") ? item.price : `$${item.price}`;
      parts.push(price);
    }
    if (item.quantity && item.quantity.trim() !== "" && item.unit && item.unit.trim() !== "") {
      parts.push(`${item.quantity} ${item.unit}`);
    } else if (item.quantity && item.quantity.trim() !== "") {
      parts.push(item.quantity);
    } else if (item.unit && item.unit.trim() !== "") {
      parts.push(item.unit);
    }
    if (item.expirationDate && item.expirationDate.trim() !== "") {
      parts.push(item.expirationDate);
    }
    return parts.join(" - ");
  }

  return (
    <View style={styles.container}>
      <Header 
        title="My Pantry" 
        titleAlign="left"
        showRightIcon={true}
        rightIconName="more-vert"
        onRightPress={() => setOptionsModalVisible(true)}
      />
      {hasItems ? (
        <Animated.ScrollView
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {Object.entries(groupedPantryItems).map(([category, items]) => (
            <Fragment key={category}>
              <View style={[styles.categoryHeader, { backgroundColor: colors.primary }]}>
                <Text style={[styles.categoryText, { color: colors.background }]}>{category}</Text>
              </View>

              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
                  onPress={() => onItemPress(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemText, { color: colors.text }]}>{item.name}</Text>
                    {getItemDetailLine(item) !== "" && (
                      <Text style={[styles.itemDetailText, { color: colors.textSecondary }]}>{getItemDetailLine(item)}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteItemFromPantry(item.id)}
                  >
                    <MaterialIcons name="delete-outline" size={22} color="#dc3545" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </Fragment>
          ))}
        </Animated.ScrollView>
      ) : (
        <View style={styles.centeredContent}>
          <Image source={require("../assets/apple.png")} style={styles.illustration} resizeMode="contain" />
          <BodyTitle>Let's plan your shopping</BodyTitle>
          <BodySubtitle>Tap the plus button to start adding products</BodySubtitle>
        </View>
      )}

     {/* Options Bottom Sheet Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={optionsModalVisible}
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <View style={styles.overlay}>
          {/* overlay close tap */}
          <TouchableOpacity 
            style={styles.background} 
            onPress={() => setOptionsModalVisible(false)} 
          />   

          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setOptionsModalVisible(false)}
            >
              <Ionicons name="close" size={32} color="#979797" />
            </TouchableOpacity>

            {/* Options */}
            <TouchableOpacity style={styles.option} onPress={handleDeleteAll}>
              <MaterialIcons name="delete-outline" size={24} color="#dc3545" />
              <Text style={[styles.optionText, { color: "#dc3545" }]}>Delete all items</Text>
            </TouchableOpacity>
          </View>     
        </View>
      </Modal>

      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={[styles.detailsModalOverlay, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View style={styles.background} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={[styles.detailsModalContainer, { backgroundColor: colors.card }]}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 }}>
              <Text style={[{ fontWeight: "bold", fontSize: 26 }, { color: colors.text }]}>
                {editingItem?.name}
              </Text>

              <TouchableOpacity onPress={handleSaveChanges}>
                <Text style={[{ fontSize: 18, color: colors.primary, fontWeight: "600" }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Quantity</Text>
                <TextInput
                  style={[styles.inputBoxText, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={editedValues.quantity ?? ""}
                  onChangeText={(v) => handleInputChange("quantity",  v.replace(/[^0-9.]/g, ""))}
                  placeholder="1"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
                <Text style={[styles.label, { color: colors.textSecondary }]}>Price</Text>
                <TextInput
                  style={[styles.inputBoxText, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={editedValues.price ?? ""}
                  onChangeText={(v) => handleInputChange("price", v.replace(/[^0-9.]/g, ""))}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex:1, marginLeft: 5 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Unit</Text>
                <TextInput
                  style={[styles.inputBoxText, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={editedValues.unit ?? ""}
                  onChangeText={(v) => handleInputChange("unit", v)}
                  placeholder="Unit"
                  placeholderTextColor={colors.textSecondary}
                />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Expiration Date</Text>
              <TouchableOpacity
                onPress={() => {
                  if (editedValues.expirationDate) {
                    const parts = editedValues.expirationDate.split("/");
                    if (parts.length === 3) {
                      const [mm, dd, yyyy] = parts;
                      const date = new Date(`${yyyy}-${mm}-${dd}`);
                      if (!isNaN(date.getTime())) setTempDate(date);
                    }
                  }
                  setShowDatePickerModal(true);
                }}
              >
                <View pointerEvents="none">
                  <TextInput
                    style={styles.inputBoxText}
                    value={editedValues.expirationDate ?? ""}
                    editable={false}
                  />
                </View>
              </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>

          {/* Date Picker Modal */}
          <Modal
            visible={showDatePickerModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDatePickerModal(false)}
          >
            <View style={[styles.datePickerOverlay, { backgroundColor: colors.overlay }]}>
              <TouchableWithoutFeedback onPress={() => setShowDatePickerModal(false)}>
                <View style={styles.background} />
              </TouchableWithoutFeedback>

              <View style={[styles.datePickerContainer, { backgroundColor: colors.card }]}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePickerModal(false)}>
                    <Text style={[{ fontSize: 18, color: "#dc3545", fontWeight: "500" }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const formatted = `${String(tempDate.getMonth() + 1).padStart(2, "0")}/${String(
                        tempDate.getDate()
                      ).padStart(2, "0")}/${tempDate.getFullYear()}`;
                      handleInputChange("expirationDate", formatted);
                      setShowDatePickerModal(false);
                    }}
                  >
                    <Text style={[{ fontSize: 18, color: colors.primary, fontWeight: "600" }]}>Done</Text>
                  </TouchableOpacity>
                </View>

                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === "android") {
                      setShowDatePickerModal(false);
                      if (event.type === "set" && selectedDate) {
                        const formatted = `${String(selectedDate.getMonth() + 1).padStart(2, "0")}/${String(
                          selectedDate.getDate()
                        ).padStart(2, "0")}/${selectedDate.getFullYear()}`;
                        handleInputChange("expirationDate", formatted);
                      }
                    } else {
                      if (selectedDate) setTempDate(selectedDate);
                    }
                  }}
                  style={{ alignSelf: "center" }}
                />
              </View>
            </View>
          </Modal>
        </View>
      </Modal>

      {/* Add Button with Animated Opacity - UPDATED */}
      <Animated.View style={[styles.addButton, { opacity: addButtonOpacity, backgroundColor: colors.primary }]}>
        <TouchableOpacity 
          onPress={() => router.push("/pantry/add-item")}
          style={styles.addButtonTouchable}
          activeOpacity={0.85}
          hitSlop={{ top: 18, bottom: 18, left: 18, right: 18 }}
        >
          <Text style={[styles.addButtonText, { color: colors.background }]}>+ Add</Text>
        </TouchableOpacity>
      </Animated.View>

      <TabBar
        activeTab="Pantry"
        onTabPress={(tab) => {
          if (tab === "Pantry") return;
          if (tab === "Lists") router.push("/lists");
          if (tab === "Recipes") router.push("/recipes");
          if (tab === "Profile") router.push("/profile");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F6F6" },

  // Option Modal
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(32,32,32,0.3)",
  },  
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 16,
    paddingBottom: 10,
  },  
  modalCloseButton: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 1,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 25,
    paddingLeft: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 20,
  },
  optionText: {
    fontSize: 17,
    color: "#222",
    fontWeight: "500",
  },
  
  listContent: { paddingBottom: 80 },
  categoryHeader: {
    backgroundColor: "#36AF27",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  categoryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E4E8",
    paddingHorizontal: 14,
  },
  itemText: { flex: 1, fontSize: 16, color: "#333" },
  deleteButton: { padding: 4, marginLeft: 10 },
  centeredContent: {
    marginTop: 50,
    alignItems: "center",
    justifyContent: "flex-start",
    flex: 1,
  },
  illustration: {
    height: 210,
    width: 270,
    marginTop: 60,
  },
  addButton: {
    position: "absolute",
    bottom: 180,
    right: 50,
    alignSelf: "center",
    backgroundColor: "#36AF27",
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 30,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  addButtonTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 22,
  },
  detailsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(32,32,32,0.4)",
    justifyContent: "flex-end",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent"
  },
  detailsModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 22,
    paddingBottom: 28,
  },
  label: {
    fontSize: 16,
    color: "#888",
    marginBottom: 10,
  },
  inputBoxText: {
    fontSize: 18,
    color: "#222",
    borderRadius: 11,
    paddingVertical: 13,
    paddingHorizontal: 15,
    backgroundColor: "#f8f8f8",
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: "#36AF27",
    borderRadius: 28,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 5,
    marginBottom: 20,
  },
  itemDetailText: {
    fontSize: 15,
    color: "#888",
    marginTop: 3,
    marginLeft: 2,
  },
  datePickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.01)",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
});
