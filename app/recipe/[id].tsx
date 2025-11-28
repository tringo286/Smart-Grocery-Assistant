import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { firestore } from "../../firebaseConfig";
import { getThemeColors } from "../../theme/colors";

export default function RecipeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [meal, setMeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pantryItems, setPantryItems] = useState<string[]>([]);

  useEffect(() => {
    async function fetchMeal() {
      try {
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
        );
        if (!res.ok) {
          console.error(`API returned status ${res.status}`);
          setMeal(null);
          return;
        }
        const contentType = res.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          console.error(`Expected JSON but got ${contentType}`);
          setMeal(null);
          return;
        }
        const data = await res.json();
        if (data.meals && data.meals.length > 0) {
          setMeal(data.meals[0]);
        } else {
          setMeal(null);
        }
      } catch (err) {
        console.error("Error fetching meal details:", err);
        setMeal(null);
      } finally {
        setLoading(false);
      }
    }
    fetchMeal();
  }, [id]);

  useEffect(() => {
    async function fetchPantry() {
      try {
        const snapshot = await getDocs(collection(firestore, "pantry"));
        const pantryNames = snapshot.docs.map(doc => doc.data().name.toLowerCase());
        setPantryItems(pantryNames);
      } catch (err) {
        console.error("Error fetching pantry items:", err);
      }
    }
    fetchPantry();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!meal) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <Text style={[{ color: colors.textSecondary }]}>Meal not found.</Text>
      </View>
    );
  }

  // Extract ingredients and measures
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim() !== "") {
      ingredients.push({ ingredient, measure });
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {meal.strMeal}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Meal Image */}
      <Image source={{ uri: meal.strMealThumb }} style={styles.mealImage} />

      {/* Info Card */}
      <View style={[styles.contentCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredients</Text>
        {ingredients.map((item, idx) => {
          const isInPantry = pantryItems.includes(item.ingredient.toLowerCase());
          return (
            <Text
              key={idx}
              style={[
                styles.ingredientText,
                { 
                  color: isInPantry ? "#22c55e" : colors.text, // green if in pantry
                  fontWeight: isInPantry ? "600" : "400",
                }
              ]}
            >
              • {item.ingredient} — {item.measure} {isInPantry ? "(In Pantry)" : ""}
            </Text>
          );
        })}

        <Text style={[styles.sectionTitle, { marginTop: 18, color: colors.text }]}>
          Instructions
        </Text>
        <Text style={[styles.instructions, { color: colors.text }]}>{meal.strInstructions}</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f6f6" },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 10,
    justifyContent: "space-between",
  },
  backButton: {
    padding: 6,
    borderRadius: 50,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
  },
  mealImage: {
    width: "92%",
    height: 220,
    alignSelf: "center",
    borderRadius: 18,
    marginVertical: 12,
  },
  contentCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#111",
  },
  ingredientText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 6,
  },
  instructions: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
});
