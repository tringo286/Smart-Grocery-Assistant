import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, getAuth, updateProfile } from "firebase/auth";
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

export default function SignUpScreen() {
  const auth = getAuth(app);
  const router = useRouter(); 
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorFields, setErrorFields] = useState<{ name?: boolean; email?: boolean; password?: boolean, confirmPassword?: boolean}>({});

  const handleSignUp = async () => {
    setError(null);
    setErrorFields({});

    let hasError = false;    

    // Validate input
    if (!name) {
      hasError = true;
      setErrorFields((prev) => ({ ...prev, name: true }));
    }
    if (!email) {
      hasError = true;
      setErrorFields((prev) => ({ ...prev, email: true }));
    }
    if (!password) {
      hasError = true;
      setErrorFields((prev) => ({ ...prev, password: true }));
    }
    if (!confirmPassword) {
      hasError = true;
      setErrorFields((prev) => ({ ...prev, confirmPassword: true }));
    }

    if (hasError) {
      setError("Please fill in all required fields.");
      return;
    }

     // Validate password match, highlight both fields if mismatch
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setErrorFields((prev) => ({
        ...prev,
        password: true,
        confirmPassword: true
      }));
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: name,
      });
      router.replace("/login");
    } catch (error: any) {
      const code = error.code;

      // Customize common Firebase error messages
      let errorMessage = "Sign up failed. Please try again.";
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
      } else if (code === "auth/email-already-in-use") {
        errorMessage = "Email is already registered.";
        setErrorFields({ email: true });
      } else if (code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
        setErrorFields({ password: true });
      }

      setError(errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <AuthHeader
        title="PantryPal"
        subtitle={"Sign up to save money, reduce\nwaste,and simplify meal planning"}
      />

      {/* Sign Up Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Sign up</Text>    
          
          <Text style={[styles.label, { marginTop: 0 }]}>Name</Text>
            <View
              style={[
                styles.passwordContainer,
                errorFields.name && styles.inputError
              ]}
            >
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#A3A3A3"
            />
          </View>

          <Text style={[styles.label, { marginTop: 0 }]}>Email</Text>
            <View
              style={[
                styles.passwordContainer,
                errorFields.email && styles.inputError
              ]}
            >
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#A3A3A3"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={[styles.label, { marginTop: 0 }]}>Password</Text>
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

          <Text style={[styles.label, { marginTop: 0 }]}>Confirm Password</Text>
          <View
            style={[
              styles.passwordContainer,
              errorFields.confirmPassword && styles.inputError
            ]}
          >
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Enter your confirm password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor="#A3A3A3"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#606060"
              />
            </TouchableOpacity>
          </View>     

          {/* Error Message */}
          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={styles.signupButton}
            onPress={handleSignUp}
          >
            <Text style={styles.signupButtonText}>Sign up</Text>
          </TouchableOpacity>         

          {/* Log In Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.loginLink}>Log In</Text>
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
    paddingTop: 30,
  },
  formTitle: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 18,
    color: "#212121",
  },
  label: {
    fontSize: 17,
    color: "#222",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#222",
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
    marginBottom: 20,
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
    marginTop: 10,
    marginBottom: 5,
  },
  signupButton: {
    backgroundColor: "#36AF27",
    borderRadius: 28,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  signupButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 19,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 5,
  },
  loginText: {
    color: "#888",
    fontSize: 16,
  },
  loginLink: {
    color: "#36AF27",
    fontSize: 16,
    fontWeight: "bold",
  },
});
