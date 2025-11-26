import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider> 
      <ThemeProvider>
        <Stack 
          screenOptions={{ headerShown: false }}
          initialRouteName="index"
        />
      </ThemeProvider>
    </SafeAreaProvider>   
  );
}
