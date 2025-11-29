import BarcodeScannerModal from "@/app/components/BarcodeScannerModal";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { arrayUnion, collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { firestore } from "../../../firebaseConfig";
import { getThemeColors } from "../../../theme/colors";

type Item = {
  id: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  price: string;
  expirationDate: string;
};

interface ItemDoc {
  name: string;
  category: string;
  quantity?: string;
  unit?: string;
  price?: string;
  expirationDate?: string;
}

export default function AddListItemScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [item, setItem] = useState<string>("");
  const [allItems, setAllItems] = useState<Item[]>([]);
  const { id: listId } = useLocalSearchParams<{ id: string }>();
  const filtered = !item
    ? []
    : allItems.filter((i) => i.name.toLowerCase().includes(item.toLowerCase()));

  useEffect(() => {
    async function fetchData() {
      const snapshot = await getDocs(collection(firestore, "items"));
      setAllItems(
        snapshot.docs.map((doc) => {
          const data = doc.data() as ItemDoc;
          return {
            id: doc.id,
            name: data.name,
            category: data.category,
            quantity: data.quantity || "",
            unit: data.unit || "",
            price: data.price || "",
            expirationDate: data.expirationDate || "",
          };
        })
      );
    }
    fetchData();
  }, []);

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
      await addItemToCurrentList(newItem);
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

  
    async function addItemToCurrentList(item: Item) {
      if (!listId) return;
      const listRef = doc(firestore, "lists", listId);

      try {
        const docSnap = await getDoc(listRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const listItems = data.items || [];

          const duplicate = listItems.find(
            (i: Item) =>
              i.name.trim().toLowerCase() === item.name.trim().toLowerCase() &&
              i.category.trim().toLowerCase() === item.category.trim().toLowerCase()
          );
          if (duplicate) {
            setTimeout(() => {
              Alert.alert(
                "Already in list",
                `${item.name} is already in your list.`,
                [{ text: "OK", onPress: resetLock }]
              );
            }, 500);
            return;
          }
        }

        await updateDoc(listRef, {
          items: arrayUnion(item),
        });

        setTimeout(() => {
          Alert.alert(
            "Success",
            `${item.name} was added to your list.`,
            [{ text: "OK", onPress: resetLock }]
          );
        }, 500);
      } catch (error) {
        console.warn("Failed to add item to current list:", error);
        setTimeout(() => {
          Alert.alert(
            "Error",
            "Failed to add item to your list. Please try again.",
            [{ text: "OK", onPress: resetLock }]
          );
        }, 500);
      }
    }  

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconLeft}>
          <Ionicons name="arrow-back" size={26} color={colors.background} />
        </TouchableOpacity>

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

        <TouchableOpacity style={styles.iconRight} onPress={openScanner}>
          <Ionicons name="camera" size={26} color={colors.background} />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {filtered.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.resultRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]} onPress={() => addItemToCurrentList(item)}>
            <Text style={[styles.resultText, { color: colors.text }]}>{item.name}</Text>
          </TouchableOpacity>
        ))}
        {item.trim() && filtered.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
              No items found for "{item}"
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                const newItem: Item = {
                  id: Date.now().toString(),
                  name: item.trim(),
                  category: "Other",
                  quantity: "1",
                  unit: "",
                  price: "",
                  expirationDate: "",
                };
                addItemToCurrentList(newItem);
                setItem("");
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.background} style={{ marginRight: 8 }} />
              <Text style={[styles.createButtonText, { color: colors.background }]}>
                Create "{item.trim()}"
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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
  noResultsContainer: {
    padding: 24,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#36AF27",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
