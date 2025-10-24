import { Entypo } from '@expo/vector-icons';
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PrimaryButtonProps {
  text: string;
  iconName?: React.ComponentProps<typeof Entypo>['name'];
  iconPosition?: "left" | "right";
  width?: number | 'auto' | `${number}%`;
  onPress: () => void;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  text,
  iconName,
  iconPosition = "right",
  width = "100%" as const,
  onPress,
}) => {
  const iconElement = iconName ? (
    <Entypo name={iconName} style={styles.icon} />
  ) : null;

  return (
    <TouchableOpacity style={[styles.button, typeof width === "number" ? { width } : { width: width }]} onPress={onPress}>
        <View
            style={[
            styles.buttonContent,
            iconPosition === "right" ? styles.flexRow : styles.flexRowReverse
            ]}
        >
            {iconPosition === "left" && iconElement}
            <Text style={styles.buttonText}>{text}</Text>
            {iconPosition === "right" && iconElement}
        </View>
    </TouchableOpacity>

  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#36AF27",
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: "center",
    marginTop: 32,
    marginBottom: 18,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  flexRow: {
    flexDirection: "row",
  },
  flexRowReverse: {
    flexDirection: "row-reverse",
  },
  iconLeft: {
    flexDirection: "row",
  },
  iconRight: {
    flexDirection: "row-reverse",
  },
  buttonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  icon: {
    fontSize: 30,
    color: "white",
  },
});

export default PrimaryButton;
