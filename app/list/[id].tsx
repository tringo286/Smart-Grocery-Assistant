import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { addDoc, arrayRemove, collection, doc, getDocs, onSnapshot, query, Timestamp, updateDoc, where } from "firebase/firestore";
import React, { Fragment, useEffect, useState } from "react";
import { Alert, Animated, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { app, firestore } from "../../firebaseConfig";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";
import { getThemeColors } from "../../theme/colors";
import BarcodeScannerModal from "../components/BarcodeScannerModal";
import BodySubtitle from "../components/BodySubtitle";
import BodyTitle from "../components/BodyTitle";
import Header from "../components/Header";

type Item = {
    id: string;             
    name: string;           
    category: string;       
    quantity: string;      
    unit: string;           
    price: string;          
    expirationDate: string;  
    completed?: boolean;
};

export default function ListDetailScreen() {
    const router = useRouter();
    const auth = getAuth(app);
    const { isDark } = useTheme();
    const colors = getThemeColors(isDark);
    const { id } = useLocalSearchParams<{ id: string }>();
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [listItems, setListItems] = useState<Item[]>([]);
    const [listName, setListName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const hasItems = listItems.length > 0;
    const activeItems = listItems.filter(item => !item.completed);
    const completedItems = listItems.filter(item => item.completed);
    const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<Item> | null>(null);
    const [editedValues, setEditedValues] = useState<Partial<Item>>({});
    const scrollY = React.useRef(new Animated.Value(0)).current;

    const [showDatePickerModal, setShowDatePickerModal] = useState(false);
    const [tempDate, setTempDate] = useState<Date>(new Date());

    const addButtonOpacity = scrollY.interpolate({
        inputRange: [0, 150],
        outputRange: [1, 0.3],
        extrapolate: "clamp",
    });
     
    useEffect(() => {
        if (!id) return;
        const listRef = doc(firestore, "lists", id);
        // Subscribe to real-time updates for the list document
        const unsubscribe = onSnapshot(listRef, (listSnap) => {
            if (listSnap.exists()) {
                const data = listSnap.data();
                setListItems(data.items || []);
                setListName(data.name || "Unnamed List");
            }
            setIsLoading(false);
        });
        // Clean up the subscriber when component unmounts or id changes
        return () => unsubscribe();
    }, [id]);

    // Group items by category (works even with all props present)
    const groupedActiveItems = activeItems.reduce<{ [cat: string]: Item[] }>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    const groupedCompletedItems = completedItems.reduce<{ [cat: string]: Item[] }>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});     
   
    // --- Firestore helpers
    const listRef = id ? doc(firestore, "lists", id) : null;

    async function deleteItem(item: Item) {
        if (!listRef) return;
        try {
        await updateDoc(listRef, {
            items: arrayRemove(item),
        });
        } catch (error) {
        console.error("Failed to delete item:", error);
        }
    }

    async function toggleItemCompletion(item: Item) {
        if (!listRef) return;
        try {
        const updatedItem = { ...item, completed: !item.completed };
        await updateDoc(listRef, {
            items: listItems.map((i) => (i.id === item.id ? updatedItem : i)),
        });
        } catch (error) {
        console.error("Failed to update item:", error);
        }
    }

    // --- Option actions
    async function handleUncheckAll() {
        if (!listRef) return;
        try {
        const updatedItems = listItems.map((i) => ({ ...i, completed: false }));
        await updateDoc(listRef, { items: updatedItems });
        setOptionsModalVisible(false);
        } catch (error) {
        console.error("Error unchecking items:", error);
        }
    }
    
    async function handleCheckAll() {
        if (!listRef) return;
        try {
        const updatedItems = listItems.map((i) => ({ ...i, completed: true }));
        await updateDoc(listRef, { items: updatedItems });
        setOptionsModalVisible(false);
        } catch (error) {
        console.error("Error checking all items:", error);
        }
    }    

    async function handleMoveCheckedToPantry() {
        if (!listRef) return;
        const user = auth.currentUser;
        if (!user) return;

        try {
            // Fetch current pantry items for this user
            const pantryCol = collection(firestore, "pantry");
            const q = query(pantryCol, where("userId", "==", user.uid));
            const pantrySnapshot = await getDocs(q);
            const pantryItems = pantrySnapshot.docs.map(
            doc => ({
                name: doc.data().name,
                category: doc.data().category,
            })
            );

            // Filter completed (checked) items to only those not already in pantry
            const newItems = completedItems.filter(li => {
            return !pantryItems.some(p =>
                p.name.toLowerCase() === li.name.toLowerCase() &&
                p.category.toLowerCase() === li.category.toLowerCase()
            );
            });

            const now = Timestamp.now();

            // Add each unique (non-duplicate) item to pantry and create expense records
            for (const item of newItems) {
            const { completed, ...pantryItem } = item;
            await addDoc(collection(firestore, "pantry"), {
                ...pantryItem,
                userId: user.uid,
                dateAdded: now,
            });

            // Create expense record if item has a price
            const price = parseFloat((pantryItem.price || "").replace(/[^0-9.]/g, "")) || 0;
            if (price > 0) {
                await addDoc(collection(firestore, "expenses"), {
                userId: user.uid,
                itemName: item.name,
                category: item.category,
                amount: price,
                date: now,
                source: "list",
                });
            }
            }

            // Remove checked items from the list
            const remainingItems = listItems.filter(item => !item.completed);
            await updateDoc(listRef, { items: remainingItems });

            setOptionsModalVisible(false);
            Alert.alert("Moved", "Checked items have been moved to pantry.");
        } catch (error) {
            console.error("Error moving items to pantry:", error);
            Alert.alert("Error", "Failed to move items to pantry.");
        }
    }

    async function handleDeleteAll() {
        if (!listRef) return;
        Alert.alert("Delete all items?", "This will remove all items from your list.", [
        { text: "Cancel", style: "cancel" },
        {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
            try {
                await updateDoc(listRef, { items: [] });
                setOptionsModalVisible(false);
            } catch (error) {
                console.error("Error deleting all items:", error);
            }
            },
        },
        ]);
    }

    // Handle input changes for the editable fields
    const handleInputChange = (field: keyof Item, value: string) => {
        setEditedValues(prevState => ({
            ...prevState,
            [field]: value,
        }));
    };


    const handleSaveChanges = async () => {
        if (!editingItem) return;

        const updatedItem = {
            ...editingItem,
            ...editedValues, // Include updated values from the form
        };

        const fieldsToUpdate: Partial<Item> = {};
            (Object.keys(updatedItem) as (keyof Item)[]).forEach(key => {
            const value = updatedItem[key];
            if (value !== undefined && value !== "") {
                fieldsToUpdate[key] = value as any; // type assertion prevents TS2322
            }
        });

        if (!listRef) return;

        try {
            await updateDoc(listRef, {
                items: listItems.map((i) => 
                    i.id === updatedItem.id ? { ...i, ...fieldsToUpdate } : i
                ),
            });
            setDetailsModalVisible(false)
        } catch (error) {
            console.error("Failed to save item:", error);
            Alert.alert("Error", "Failed to save item. Please try again later.");
        }
    };

    function getItemDetailLine(item: Item) {
        const parts: string[] = [];
        // Price (show only if present, without leading $ if user already types a dollar sign)
        if (item.price && item.price.trim() !== "") {
            let price = item.price.startsWith("$") ? item.price : `$${item.price}`;
            parts.push(price);
        }
        // Quantity and Unit (either, but as a single string if both present)
        if (item.quantity && item.quantity.trim() !== "" && item.unit && item.unit.trim() !== "") {
            parts.push(`${item.quantity} ${item.unit}`);
        } else if (item.quantity && item.quantity.trim() !== "") {
            parts.push(item.quantity);
        } else if (item.unit && item.unit.trim() !== "") {
            parts.push(item.unit);
        }
        // Expiration date (show only if present)
        if (item.expirationDate && item.expirationDate.trim() !== "") {
            parts.push(item.expirationDate);
        }
        // Join with " - "
        return parts.join(" - ");
    }

    // Barcode scanner handler
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
            completed: false,
        };

        // Check for duplicates
        const duplicate = listItems.find(
            (i) =>
            i.name.trim().toLowerCase() === newItem.name.trim().toLowerCase() &&
            i.category.trim().toLowerCase() === newItem.category.trim().toLowerCase()
        );

        if (duplicate) {
            setTimeout(() => {
            Alert.alert(
                "Already in list",
                `${newItem.name} is already in your list.`,
                [{ text: "OK", onPress: resetLock }]
            );
            }, 500);
            return;
        }

        if (!listRef) {
            resetLock();
            return;
        }

        await updateDoc(listRef, {
            items: [...listItems, newItem],
        });

        setTimeout(() => {
            Alert.alert(
            "Added!",
            `${newItem.name} has been added to your list.`,
            [{ text: "OK", onPress: resetLock }]
            );
        }, 500);
        },
        onProductNotFound: (barcode) => {
        setTimeout(() => {
            Alert.alert(
            "Product Not Found",
            `Barcode: ${barcode}\nWould you like to add this item manually?`,
            [
                { text: "Cancel", style: "cancel", onPress: resetLock },
                {
                text: "Add Manually",
                onPress: () => {
                    resetLock();
                    router.push(`/list/${id}/add-list-item`);
                },
                },
            ]
            );
        }, 500);
        },
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <Header
                title={listName || "Loading..."}
                titleAlign="center"
                showLeftIcon
                showRightIcon
                onRightPress={() => setOptionsModalVisible(true)}
            />

            {/* Modal for Options */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={optionsModalVisible}
                onRequestClose={() => setOptionsModalVisible(false)}
                >
                <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
                    {/* overlay close tap */}
                    <TouchableOpacity style={styles.background} onPress={() => setOptionsModalVisible(false)} />   

                    <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                        <TouchableOpacity style={styles.modalCloseButton} onPress={()=> setOptionsModalVisible(false)}>
                            <Ionicons name="close" size={32} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {/* Options */}
                        <TouchableOpacity style={styles.option} onPress={handleUncheckAll}>
                            <MaterialIcons name="refresh" size={24} color={colors.textSecondary} />
                            <Text style={[styles.optionText, { color: colors.text }]}>Uncheck all items</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.option} onPress={handleCheckAll}>
                            <MaterialIcons name="done-all" size={24} color={colors.textSecondary} />
                            <Text style={[styles.optionText, { color: colors.text }]}>Check off all items</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.option} onPress={handleMoveCheckedToPantry}>
                            <MaterialCommunityIcons name="cart-arrow-right" size={24} color={colors.textSecondary} />
                            <Text style={[styles.optionText, { color: colors.text }]}>Move checked items to pantry</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.option} onPress={handleDeleteAll}>
                            <MaterialIcons name="delete-outline" size={24} color="#dc3545" />
                            <Text style={[styles.optionText, { color: "#dc3545" }]}>Delete all items</Text>
                        </TouchableOpacity>

                </View>     
            </View>
        </Modal>

        {hasItems ? (
            <Animated.ScrollView
                contentContainerStyle={styles.listContent}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
            >
            {/* Tabs */}
            <View style={[styles.tabHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setActiveTab("active")}>
                    <Text style={[activeTab === "active" ? { ...styles.tabActive, color: colors.primary } : { ...styles.tabInactive, color: colors.textSecondary }]}>Your list</Text>
                    <Text style={[activeTab === "active" ? { ...styles.tabCountActive, color: colors.primary } : { ...styles.tabCountInactive, color: colors.textSecondary }]}>
                        {activeItems.length} Items
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveTab("completed")}>
                    <Text style={[activeTab === "completed" ? { ...styles.tabActive, color: colors.primary } : { ...styles.tabInactive, color: colors.textSecondary }]}>Completed Items</Text>
                    <Text style={[activeTab === "completed" ? { ...styles.tabCountActive, color: colors.primary } : { ...styles.tabCountInactive, color: colors.textSecondary }]}>
                        {completedItems.length} Items
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Render only the selected tab items */}
            {activeTab === "active" &&
                Object.entries(groupedActiveItems).map(([category, items]) => (
                <Fragment key={category}>
                    <View style={[styles.categoryHeader, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.categoryText, { color: colors.background }]}>{category}</Text>
                    </View>
                    {items.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.itemRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
                        onPress={() => {
                            setEditingItem(item);
                            setEditedValues({ 
                                quantity: item.quantity,
                                unit: item.unit,
                                price: item.price,
                                expirationDate: item.expirationDate,
                            });
                            setDetailsModalVisible(true);
                        }}
                    >
                        <TouchableOpacity style={[styles.circle, item.completed && { ...styles.checkedCircle, backgroundColor: colors.primary }]} onPress={() => toggleItemCompletion(item)}>
                            {item.completed && <MaterialIcons name="check" size={16} color={colors.background} />}
                        </TouchableOpacity>                
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.itemText, { color: colors.text }]}>{item.name}</Text>
                            {/* Detail line in gray, below name */}
                            {getItemDetailLine(item) !== "" && (
                                <Text style={[styles.itemDetailText, { color: colors.textSecondary }]}>{getItemDetailLine(item)}</Text>
                            )}
                        </View>

                        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteItem(item)}>
                            <MaterialIcons name="delete-outline" size={22} color="#dc3545" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                    ))}
                </Fragment>
                ))}

            {activeTab === "completed" &&
                Object.entries(groupedCompletedItems).map(([category, items]) => (
                <Fragment key={category}>
                    <View style={[styles.categoryHeader, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.categoryText, { color: colors.background }]}>{category}</Text>
                    </View>
                    {items.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.itemRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
                        onPress={() => toggleItemCompletion(item)}
                    >
                        <View style={[styles.circle, item.completed && { ...styles.checkedCircle, backgroundColor: colors.primary }]}>
                            {item.completed && <MaterialIcons name="check" size={16} color={colors.background} />}
                        </View>                       
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.itemText, { textDecorationLine: 'line-through', color: colors.textSecondary }]}>
                                {item.name}
                            </Text>
                            {/* Detail line in gray, below name */}
                            {getItemDetailLine(item) !== "" && (
                                <Text style={[styles.itemDetailText, { textDecorationLine: 'line-through', color: '#888' }]}>{getItemDetailLine(item)}</Text>
                            )}
                        </View>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteItem(item)}>
                            <MaterialIcons name="delete-outline" size={22} color="#dc3545" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                    ))}
                </Fragment>
                ))}
                
                <Modal
                    visible={detailsModalVisible}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setDetailsModalVisible(false)}
                >
                    <View style={[styles.detailsModalOverlay, { backgroundColor: colors.overlay }]}>
                        {/* TouchableWithoutFeedback to dismiss keyboard */}
                        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                            <View style={styles.background} />
                        </TouchableWithoutFeedback>

                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined} // For iOS, use 'padding' behavior
                            style={[styles.detailsModalContainer, { backgroundColor: colors.card }]}
                        >
                            {/* Header row */}
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 }}>
                                <Text style={{ fontWeight: "bold", fontSize: 26, flex: 1, marginRight: 10 }}>
                                    {editingItem?.name}
                                </Text>

                                <TouchableOpacity onPress={handleSaveChanges}>
                                    <Text style={[{ fontSize: 18, color: colors.primary, fontWeight: "600" }]}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            {/* Grid Inputs */}
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                <View style={{ flex: 1, marginRight: 5 }}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Quantity</Text>
                                    <TextInput
                                        style={[styles.inputBoxText, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                        value={editedValues.quantity ?? ""}
                                        onChangeText={(value) => handleInputChange("quantity", value)}
                                        placeholder="1"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                    />
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Price</Text>                                  
                                    <TextInput
                                        style={[styles.inputBoxText, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                        value={editedValues.price ? `$${editedValues.price}` : ""}
                                        onChangeText={(value) => handleInputChange("price", value.replace(/[^0-9.]/g, ''))}  // Strip non-numeric characters except for the dot
                                        placeholder="0"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 5 }}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Unit</Text>
                                    <TextInput
                                        style={[styles.inputBoxText, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                        value={editedValues.unit ?? ""}
                                        onChangeText={(value) => handleInputChange("unit", value)}
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
                    </View>

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
                </Modal>  
           
            </Animated.ScrollView>
        ) : (
            <View style={[styles.centeredContent, { backgroundColor: colors.background }]}>
                <Image source={require("../../assets/cheese.png")} style={styles.illustration} resizeMode="contain" />
                <BodyTitle>Let's plan your shopping</BodyTitle>
                <BodySubtitle>Tap the plus button to start adding products</BodySubtitle>
                <TouchableOpacity 
                    style={styles.scanBarcodesButton}
                    onPress={openScanner}
                >
                    <Ionicons name="camera" size={20} color="#22c55e" />
                    <Text style={styles.scanText}>Scan Barcodes</Text>
                </TouchableOpacity>
            </View>
        )}      
      
        {/* Add Button */}
        <Animated.View style={[styles.addButton, { opacity: addButtonOpacity }]} pointerEvents="box-none">
            <TouchableOpacity
                style={styles.addButtonTouchable}
                onPress={() => router.push(`/list/${id}/add-list-item`)}
                activeOpacity={0.85}
                hitSlop={{ top: 18, bottom: 18, left: 18, right: 18 }}
            >
                <Text style={[styles.addButtonText, { color: colors.background }]}>+ Add</Text>
            </TouchableOpacity>
        </Animated.View>

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
        backgroundColor: "#F6F6F6" 
    },
    listContent: { 
        paddingBottom: 80 
    },
    tabHeader: {
        flexDirection: "row",
        backgroundColor: "#F6F6F6",
        justifyContent: "space-around",
        alignItems: "flex-end",
        gap: 8,
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderColor: "#36AF27",
    },
    tabActive: { 
        color: "#36AF27",
        fontWeight: "600", 
        fontSize: 18 
    },
    tabInactive: { 
        color: "#888", 
        fontSize: 18, 
        fontWeight: "500" 
    },
    tabCountActive: { 
        color: "#36AF27", 
        fontSize: 13, 
        fontWeight: "400", 
        textAlign: "center" 
    },
    tabCountInactive: { 
        color: "#888", 
        fontSize: 13, 
        fontWeight: "400", 
        textAlign: "center" 
    },
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
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#E1E4E8",
        paddingHorizontal: 14,
    },
    circle: {
        height: 24,
        width: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#CBCBCB",
        marginRight: 20,
    },
    checkedCircle: {
        backgroundColor: "#36AF27",
        justifyContent: "center",
        alignItems: "center",
    },
    itemText: { 
        flex: 1, 
        fontSize: 16, 
        color: "#333" 
    },
    deleteButton: {
        padding: 4,
        marginLeft: 10
    },
    // Modal for options
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(32,32,32,0.3)",
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "transparent"
    },
    modalContainer: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 16, // Android-only property that controls the visual depth
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
    centeredContent: {
        marginTop: 50,
        alignItems: "center",
        justifyContent: "flex-start",
        flex: 1
    },
    illustration: {
        height: 210,
        width: 270,
        marginTop: 60,
    },
    scanBarcodesButton: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 28,
    },
    scanText: {
        fontSize: 16,
        color: "#36AF27",
        marginLeft: 6
    },
    addButton: {
        position: "absolute",
        bottom: 150,
        right: 50,
        alignSelf: "center",
        backgroundColor: "#36AF27",
        borderRadius: 999,
        paddingVertical: 16,
        paddingHorizontal: 35,
        marginBottom: 36,
        flexDirection: "row",
        alignItems: "center",
        zIndex: 100,
        elevation: 10, // Android
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
        fontSize: 22
    },  
    
    // Detail Item Modal
    detailsModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(32,32,32,0.4)",
        justifyContent: "flex-end",
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
