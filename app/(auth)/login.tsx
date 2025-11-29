import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { app } from "../../firebaseConfig";
import { getThemeColors } from "../../theme/colors";
import AuthHeader from "../components/AuthHeader";
import PrimaryButton from "../components/PrimaryButton";

export default function LoginScreen() {
  const auth = getAuth(app);
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorFields, setErrorFields] = useState<{ email?: boolean; password?: boolean }>({});


  const handleLogin = async () => {
    setError(null);
    setErrorFields({});

    let hasError = false;

    // Validate input
    if (!email) {
      hasError = true;
      setErrorFields((prev) => ({ ...prev, email: true }));
    }
    if (!password) {
      hasError = true;
      setErrorFields((prev) => ({ ...prev, password: true }));
    }

    if (hasError) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/lists");
    } catch (error: any) {
      const code = error.code;

      // Customize common Firebase error messages
      let errorMessage = "Login failed. Please try again.";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        errorMessage = "Invalid email or password.";
        setErrorFields({ email: true, password: true });
      } else if (code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      } else if (code === "auth/invalid-email") {
        errorMessage = "Invalid email format.";
        setErrorFields({ email: true });
      } else if (code === "auth/user-not-found") {
        errorMessage = "No account found with this email.";
        setErrorFields({ email: true });
      }

      setError(errorMessage);
    }
  };

  return (      
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
   
          backgroundColor: colors.background,
        }}
        keyboardShouldPersistTaps="handled"
      >

      {/* Header */}
      <AuthHeader
        title="PantryPal"
        subtitle={"Welcome back! Log in to manage\nyour groceries, budget, and meals."}
      />

      {/* Login Form */}
      <View style={styles.form}>
        <Text style={[styles.loginTitle, { color: colors.text }]}>Log In</Text>

        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <View
          style={[
            styles.passwordContainer,
            errorFields.email && styles.inputError,
            { backgroundColor: colors.surface, borderColor: colors.border }
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <Text style={[styles.label, { marginTop: 16, color: colors.text }]}>Password</Text>
        <View
          style={[
            styles.passwordContainer,
            errorFields.password && styles.inputError,
            { backgroundColor: colors.surface, borderColor: colors.border }
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            // style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        
        {/* Error Message */}
        {error && <Text style={[styles.errorText, { color: "#dc3545" }]}>{error}</Text>}

        <PrimaryButton
          text="Log in"              
          width="100%"
          onPress={handleLogin}
        />

        {/* Sign Up Link */}  
        <View style={styles.signUpContainer}>
          <Text style={[styles.signUpText, { color: colors.text }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text style={[styles.signUpLink, { color: colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>  
    </KeyboardAvoidingView> 
  );
}

const styles = StyleSheet.create({    
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  loginTitle: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 50,
    color: "#212121",
  },
  label: {
    fontSize: 17,
    color: "#222",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#222",
    borderWidth: 1,
    borderColor: "transparent", 
  },
  inputError: {
    borderColor: "#E53935",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center", // this vertically centers children
    justifyContent: "space-between", // so input and icon are at ends
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "transparent",
    minHeight: 44,
  },
  // eyeIcon: {
  //   position: "absolute",
  //   right: 16,
  //   top: "50%",
  //   marginTop: -11,
  // },
  errorText: {
    color: "#E53935",
    fontSize: 14,
    marginTop: 5,
    marginBottom: 20,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    gap: 5,
  },
  signUpText: {
    color: "#888",
    fontSize: 16,
  },
  signUpLink: {
    color: "#36AF27",
    fontSize: 16,
    fontWeight: "bold",
  },
});