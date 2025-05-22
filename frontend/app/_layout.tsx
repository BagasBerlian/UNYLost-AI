import React, { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, AuthContext } from "../contexts/AuthContext";
import { PaperProvider } from "react-native-paper";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function RootLayoutNav() {
  const { userToken, isLoading } = React.useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";

    if (!userToken && inAuthGroup) {
      router.replace("/login");
    } else if (userToken && !inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [userToken, segments, isLoading]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootLayoutNav />
      </AuthProvider>
    </PaperProvider>
  );
}
