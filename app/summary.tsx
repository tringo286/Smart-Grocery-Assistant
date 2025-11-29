import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, setDoc, Timestamp, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { useTheme } from "../context/ThemeContext";
import { app, firestore } from "../firebaseConfig";
import { getThemeColors } from "../theme/colors";
import Header from "./components/Header";
import InputModal from "./components/InputModal";

type Expense = {
  id: string;
  userId: string;
  itemName: string;
  category: string;
  amount: number;
  date: Timestamp;
  source: string;
};

export default function SummaryScreen() {
  const router = useRouter();
  const auth = getAuth(app);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [spendingLimit, setSpendingLimit] = useState<number>(0);
  const [budgetStartDay, setBudgetStartDay] = useState<number>(1);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [editLimitModalVisible, setEditLimitModalVisible] = useState(false);
  const [budgetDayModalVisible, setBudgetDayModalVisible] = useState(false);
  const [limitInputValue, setLimitInputValue] = useState("");
  const [budgetDayInputValue, setBudgetDayInputValue] = useState("");
  const [categoryExpenses, setCategoryExpenses] = useState<{ [key: string]: number }>({});
  const [monthlyExpenses, setMonthlyExpenses] = useState<number[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Helper function to get budget period start and end dates
  const getBudgetPeriod = (referenceDate: Date = new Date()) => {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const day = referenceDate.getDate();
    
    let startDate: Date;
    let endDate: Date;
    
    if (day >= budgetStartDay) {
      // Current period
      startDate = new Date(year, month, budgetStartDay);
      endDate = new Date(year, month + 1, budgetStartDay - 1, 23, 59, 59);
    } else {
      // Previous period
      startDate = new Date(year, month - 1, budgetStartDay);
      endDate = new Date(year, month, budgetStartDay - 1, 23, 59, 59);
    }
    
    return { startDate, endDate };
  };

  // Load user's settings from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userSettingsRef = doc(firestore, "userSettings", user.uid);
    
    const loadSettings = async () => {
      try {
        const docSnap = await getDoc(userSettingsRef);
        if (docSnap.exists()) {
          setSpendingLimit(docSnap.data().spendingLimit || 0);
          setBudgetStartDay(docSnap.data().budgetStartDay || 1);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };

    loadSettings();
  }, []);

  // Listen to expenses for current user
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const expensesCol = collection(firestore, "expenses");
    const q = query(expensesCol, where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allExpenses = snapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        }) as Expense
      );
      
      setExpenses(allExpenses);
      
      // Calculate current period expenses
      const { startDate, endDate } = getBudgetPeriod();
      
      const currentPeriodExpenses = allExpenses.filter(expense => {
        const expenseDate = expense.date.toDate();
        return expenseDate >= startDate && expenseDate <= endDate;
      });
      
      const total = currentPeriodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      setTotalExpenses(total);

      // Calculate expenses by category for current period
      const categoryTotals: { [key: string]: number } = {};
      currentPeriodExpenses.forEach((expense) => {
        if (!categoryTotals[expense.category]) {
          categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.amount;
      });
      setCategoryExpenses(categoryTotals);

      // Calculate monthly expenses for last 6 periods
      const monthlyTotals: number[] = [];
      for (let i = 5; i >= 0; i--) {
        const refDate = new Date();
        refDate.setMonth(refDate.getMonth() - i);
        const period = getBudgetPeriod(refDate);
        
        const periodExpenses = allExpenses.filter(expense => {
          const expenseDate = expense.date.toDate();
          return expenseDate >= period.startDate && expenseDate <= period.endDate;
        });
        
        const periodTotal = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        monthlyTotals.push(periodTotal);
      }
      setMonthlyExpenses(monthlyTotals);
    });

    return () => unsubscribe();
  }, [budgetStartDay]);

  const handleSaveSpendingLimit = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const newLimit = parseFloat(limitInputValue) || 0;
    
    try {
      const userSettingsRef = doc(firestore, "userSettings", user.uid);
      await setDoc(userSettingsRef, { spendingLimit: newLimit }, { merge: true });
      setSpendingLimit(newLimit);
      setEditLimitModalVisible(false);
      Alert.alert("Success", "Spending limit updated!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleSaveBudgetDay = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const newDay = parseInt(budgetDayInputValue) || 1;
    if (newDay < 1 || newDay > 31) {
      Alert.alert("Invalid Day", "Please enter a day between 1 and 31");
      return;
    }
    
    try {
      const userSettingsRef = doc(firestore, "userSettings", user.uid);
      await setDoc(userSettingsRef, { budgetStartDay: newDay }, { merge: true });
      setBudgetStartDay(newDay);
      setBudgetDayModalVisible(false);
      Alert.alert("Success", "Budget cycle updated!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const remainingBalance = spendingLimit - totalExpenses;
  const spendingPercentage = spendingLimit > 0 ? Math.min(totalExpenses / spendingLimit, 1) : 0;
  
  // Get month labels for last 6 periods
  const getMonthLabels = () => {
    const labels: string[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      labels.push(monthNames[date.getMonth()]);
    }
    return labels;
  };

  // Prepare data for pie chart
  const pieChartData = spendingLimit > 0 ? [
    {
      name: "Spent",
      amount: spendingPercentage >= 1 ? spendingLimit : totalExpenses,
      color: spendingPercentage >= 0.9 ? "#dc3545" : colors.primary,
      legendFontColor: colors.text,
      legendFontSize: 14,
    },
    ...(spendingPercentage < 1 ? [{
      name: "Remaining",
      amount: remainingBalance,
      color: "#e0e0e0",
      legendFontColor: colors.text,
      legendFontSize: 14,
    }] : []),
  ] : [];

  // Prepare data for line chart
  const monthlyData = {
    labels: getMonthLabels(),
    datasets: [
      {
        data: monthlyExpenses.length > 0 ? monthlyExpenses : [0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => colors.primary,
        strokeWidth: 3,
      },
    ],
  };

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Expense Summary" titleAlign="center" showLeftIcon />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Budget Period Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Budget Cycle</Text>
            <TouchableOpacity
              onPress={() => {
                setBudgetDayInputValue(budgetStartDay.toString());
                setBudgetDayModalVisible(true);
              }}
            >
              <MaterialIcons name="edit" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.budgetPeriodText, { color: colors.textSecondary }]}>
            Resets on day {budgetStartDay} of each month
          </Text>
          <Text style={[styles.budgetPeriodText, { color: colors.textSecondary, fontSize: 14, marginTop: 5 }]}>
            Current period: {getBudgetPeriod().startDate.toLocaleDateString()} - {getBudgetPeriod().endDate.toLocaleDateString()}
          </Text>
        </View>

        {/* Spending Limit Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Monthly Budget</Text>
            <TouchableOpacity
              onPress={() => {
                setLimitInputValue(spendingLimit.toString());
                setEditLimitModalVisible(true);
              }}
            >
              <MaterialIcons name="edit" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.limitAmount, { color: colors.primary }]}>
            ${spendingLimit.toFixed(2)}
          </Text>
        </View>

        {/* Current Expenses Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Total Expenses</Text>
          <Text style={[styles.expenseAmount, { color: colors.text }]}>
            ${totalExpenses.toFixed(2)}
          </Text>
        </View>

        {/* Remaining Balance Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Remaining Balance</Text>
          <Text
            style={[
              styles.balanceAmount,
              { color: remainingBalance >= 0 ? "#36AF27" : "#dc3545" },
            ]}
          >
            ${Math.abs(remainingBalance).toFixed(2)}
            {remainingBalance < 0 && " (Over Budget)"}
          </Text>
        </View>

        {/* Progress Chart */}
        {spendingLimit > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Spending Progress</Text>
            
            <View style={styles.progressChartContainer}>
              <PieChart
                data={pieChartData}
                width={screenWidth - 60}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => colors.text,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 0]}
                absolute={false}
              />
            </View>

            <View style={styles.progressLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: pieChartData[0]?.color }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>
                  Spent: ${totalExpenses.toFixed(2)} ({(spendingPercentage * 100).toFixed(1)}%)
                </Text>
              </View>
              {spendingPercentage < 1 && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#e0e0e0" }]} />
                  <Text style={[styles.legendText, { color: colors.text }]}>
                    Remaining: ${remainingBalance.toFixed(2)} ({((1 - spendingPercentage) * 100).toFixed(1)}%)
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Monthly Trend Chart */}
        {totalExpenses > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Spending Trend</Text>
            <LineChart
              data={monthlyData}
              width={screenWidth - 80}
              height={220}
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 2,
                color: (opacity = 1) => colors.primary,
                labelColor: (opacity = 1) => colors.text,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: colors.primary,
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Category Breakdown */}
        {Object.keys(categoryExpenses).length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Expenses by Category
            </Text>
            {Object.entries(categoryExpenses)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => (
                <View key={category} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {category}
                    </Text>
                    <View
                      style={[
                        styles.categoryBar,
                        {
                          backgroundColor: colors.surface,
                          width: screenWidth - 160,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.categoryBarFill,
                          {
                            backgroundColor: colors.primary,
                            width: `${Math.min(
                              (amount / totalExpenses) * 100,
                              100
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.categoryAmount, { color: colors.text }]}>
                    ${amount.toFixed(2)}
                  </Text>
                </View>
              ))}
          </View>
        )}

        {/* Empty State */}
        {totalExpenses === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={80} color={colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No expenses tracked yet
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
              Add items with prices to your pantry to start tracking
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Spending Limit Modal */}
      <InputModal
        visible={editLimitModalVisible}
        title="Set Monthly Budget"
        placeholder="Enter amount"
        value={limitInputValue}
        onChangeText={setLimitInputValue}
        onSave={handleSaveSpendingLimit}
        onClose={() => setEditLimitModalVisible(false)}
        keyboardType="numeric"
      />

      {/* Edit Budget Day Modal */}
      <InputModal
        visible={budgetDayModalVisible}
        title="Budget Cycle Start Day"
        placeholder="Day (1-31)"
        value={budgetDayInputValue}
        onChangeText={setBudgetDayInputValue}
        onSave={handleSaveBudgetDay}
        onClose={() => setBudgetDayModalVisible(false)}
        keyboardType="numeric"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 18,
    shadowColor: "#161616",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#313131",
    marginBottom: 12,
  },
  limitAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#36AF27",
  },
  budgetPeriodText: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  expenseAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#313131",
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
  },
  chart: {
    marginVertical: 10,
    borderRadius: 16,
  },
  progressChartContainer: {
    alignItems: "center",
  },
  progressLegend: {
    marginTop: 15,
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 15,
    fontWeight: "500",
  },
  progressText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    color: "#666",
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryInfo: {
    flex: 1,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#313131",
    marginBottom: 6,
  },
  categoryBar: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  categoryBarFill: {
    height: "100%",
    backgroundColor: "#36AF27",
    borderRadius: 4,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#313131",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
