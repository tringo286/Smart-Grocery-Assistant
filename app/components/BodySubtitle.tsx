import React from "react";
import { StyleSheet, Text, TextStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getThemeColors } from "../../theme/colors";

type BodySubtitleProps = {
  children: string;
  style?: TextStyle;
};

const BodySubtitle = ({ children, style }: BodySubtitleProps) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  return <Text style={[styles.bodySubtitle, { color: colors.textSecondary }, style]}>{children}</Text>;
};

const styles = StyleSheet.create({
  bodySubtitle: {
    fontSize: 17,
    marginBottom: 20,
  },
});

export default BodySubtitle;
