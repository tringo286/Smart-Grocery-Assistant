import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { firestore } from "../../firebaseConfig";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";
import { getThemeColors } from "../../theme/colors";
import BarcodeScannerModal from "../components/BarcodeScannerModal";

type Item = {
  id: string;             
  name: string;           
  category: string;       
  quantity: string;      
  unit: string;           
  price: string;          
  expirationDate: string;  
};

export default function AddPantryItemScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [item, setItem] = useState<string>("");
  const [allItems, setAllItems] = useState<Item[]>([]);
  const filtered = !item
    ? []
    : allItems.filter((i) => i.name.toLowerCase().includes(item.toLowerCase()));
  
  // Listen to pantry collection
  useEffect(() => {
    async function fetchData() {
      const snapshot = await getDocs(collection(firestore, "items"));
      setAllItems(
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
    }
    fetchData();
  }, []);

  async function addItemToPantry(item: Item) {
    const pantryCol = collection(firestore, "pantry");
    const q = query(
      pantryCol,
      where("name", "==", item.name),
      where("category", "==", item.category)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      setTimeout(() => {
        Alert.alert(
          "Already in pantry",
          `${item.name} is already in your pantry.`,
          [{ text: "OK", onPress: resetLock }]
        );
      }, 500);
      return;
    }

    try {
      const { id, ...pantryItem } = item;
      await addDoc(pantryCol, pantryItem);
      setTimeout(() => {
        Alert.alert(
          "Success",
          `${item.name} was added to your pantry.`,
          [{ text: "OK", onPress: resetLock }]
        );
      }, 500);
    } catch (error) {
      console.warn("Failed to add item to pantry:", error);
      setTimeout(() => {
        Alert.alert(
          "Error",
          "Failed to add item to your pantry. Please try again.",
          [{ text: "OK", onPress: resetLock }]
        );
      }, 500);
    }
  }

  // Barcode Scanner
  const {
    scannerVisible,
    permission,
    openScanner,
    handleBarCodeScanned,
    closeScanner,
    resetLock,
  } = useBarcodeScanner({
    onProductFound: async (product) => {
      const newItem: Item = {
        id: Date.now().toString(),
        ...product,
      };
      await addItemToPantry(newItem);
    },
    onProductNotFound: (barcode) => {
      setTimeout(() => {
        Alert.alert(
          "Not Found",
          `Barcode: ${barcode}\nThis item is not in the database. Add manually?`,
          [
            { text: "Cancel", style: "cancel", onPress: resetLock },
            { text: "Add Manually", onPress: resetLock },
          ]
        );
      }, 500);
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.primary }]}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.iconLeft}>
          <Ionicons name="arrow-back" size={26} color={colors.background} />
        </TouchableOpacity>

        {/* Search/Add Input */}
        <View style={[styles.searchBox, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={19} color={colors.textSecondary} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Add new item"
            placeholderTextColor={colors.textSecondary}
            value={item}
            onChangeText={setItem}
            returnKeyType="done"
          />
          {!!item && (
            <TouchableOpacity onPress={() => setItem("")} style={styles.clearButton}>
              <MaterialIcons name="close" size={19} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Camera Icon */}
        <TouchableOpacity style={styles.iconRight} onPress={openScanner}>
          <Ionicons name="camera" size={26} color={colors.background} />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={[styles.mainContent, { backgroundColor: colors.background }]}>
        {filtered.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.resultRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]} onPress={() => addItemToPantry(item)}>
            <Text style={[styles.resultText, { color: colors.text }]}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={closeScanner}
        permissionGranted={!!permission?.granted}
        onBarcodeScanned={handleBarCodeScanned}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerBar: {
    width: "100%",
    backgroundColor: "#36AF27",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    paddingTop: 60,
  },
  iconLeft: {
    marginRight: 2,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 3,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 9,
    color: "#222",
  },
  clearButton: {
    padding: 2,
    marginLeft: 6,
  },
  iconRight: {
    marginLeft: 2,
  },  
  mainContent: {
    flex: 1,
    backgroundColor: "#F6F6F6",
  },
  resultRow: {
    borderBottomWidth: 1,
    borderColor: "#d7d7d7",
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  resultText: {
    fontSize: 16,
    color: "#444",
  },
});
