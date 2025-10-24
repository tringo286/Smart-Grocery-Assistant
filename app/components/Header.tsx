import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import React from "react";
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";

interface HeaderProps {
  title: string;
  titleAlign?: "left" | "center"; // choose title alignment
  showLeftIcon?: boolean;
  leftIconName?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  showRightIcon?: boolean;
  rightIconName?: keyof typeof MaterialIcons.glyphMap;
  onRightPress?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
}

const Header: React.FC<HeaderProps> = ({
  title,
  titleAlign = "left",
  showLeftIcon = false,
  leftIconName = "chevron-back",
  onLeftPress,
  showRightIcon = false,
  rightIconName = "more-vert",
  onRightPress,
  style,
  titleStyle,
}) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.header, style]}>
      {/* Left Icon */}
      <View style={styles.iconContainer}>
        {showLeftIcon && (
          <TouchableOpacity
            onPress={onLeftPress || navigation.goBack}
            style={styles.iconButton}
          >
            <Ionicons name={leftIconName} size={28} color="#161616" />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <View
        style={[
          styles.titleContainer,
          titleAlign === "center" && styles.centerTitleContainer,
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            titleAlign === "center" && styles.centerTitle,
            titleStyle,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {/* Right Icon */}
      <View style={styles.iconContainer}>
        {showRightIcon && (
          <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
            <MaterialIcons name={rightIconName} size={28} color="#161616" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  header: {
    zIndex: 10, 
    paddingTop: 70,
    padding: 20,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  iconContainer: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  centerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#161616",
  },
  centerTitle: {
    textAlign: "center",
  },
});

export default Header;
