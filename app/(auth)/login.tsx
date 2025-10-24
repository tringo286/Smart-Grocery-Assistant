import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { app } from "../../firebaseConfig";
import AuthHeader from "../components/AuthHeader";
import PrimaryButton from "../components/PrimaryButton";

export default function LoginScreen() {
  const auth = getAuth(app);
  const router = useRouter();
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
      <View style={styles.container}>

      {/* Header */}
      <AuthHeader
        title="PantryPal"
        subtitle={"Welcome back! Log in to manage\nyour groceries, budget, and meals."}
      />

      {/* Login Form */}
      <View style={styles.form}>
        <Text style={styles.loginTitle}>Log In</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[
            styles.input,
            errorFields.email && styles.inputError
          ]}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#A3A3A3"
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
        <View
          style={[
            styles.passwordContainer,
            errorFields.password && styles.inputError
          ]}
        >
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#A3A3A3"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#606060"
            />
          </TouchableOpacity>
        </View>
        
        {/* Error Message */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <PrimaryButton
          text="Log in"              
          width="100%"
          onPress={handleLogin}
        />

        {/* Sign Up Link */}  
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don’t have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>   
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
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#222",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "transparent", 
  },
  inputError: {
    borderColor: "#E53935",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    paddingHorizontal: 0,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "transparent",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 12,
  },
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