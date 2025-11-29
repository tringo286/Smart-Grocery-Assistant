import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getThemeColors } from "../../theme/colors";

type InputModalProps = {
  visible: boolean;
  title: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

const InputModal: React.FC<InputModalProps> = ({
  visible,
  title,
  placeholder,
  value,
  onChangeText,
  onSave,
  onClose,
  secureTextEntry,
  keyboardType,
}) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        enabled
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.modalWrapper, { backgroundColor: colors.overlay }]}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Ionicons name="close" size={32} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={secureTextEntry ?? false}
            keyboardType={keyboardType ?? "default"}
          />

          <TouchableOpacity
            style={[styles.modalSaveButton, { backgroundColor: colors.primary, opacity: value.trim() ? 1 : 0.6 }]}
            onPress={onSave}
            disabled={!value.trim()}
          >
            <Text style={styles.modalSaveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(32,32,32,0.4)",
  },
  modalContainer: {
    width: "100%",
    minHeight: 210,
    borderRadius: 32,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 40,
    alignItems: "center",
    shadowColor: "#999",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 10,
  },
  modalCloseButton: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 1,
  },
  modalTitle: {
    width: "100%",
    textAlign: "left",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 22,
    color: "#222",
  },
  modalInput: {
    width: "100%",
    backgroundColor: "#f8f8f8",
    borderRadius: 11,
    fontSize: 18,
    paddingVertical: 13,
    paddingHorizontal: 15,
    marginBottom: 22,
    color: "#222",
  },
  modalSaveButton: {
    backgroundColor: "#36AF27",
    borderRadius: 28,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 5,
  },
  modalSaveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 19,
  },
});

export default InputModal;