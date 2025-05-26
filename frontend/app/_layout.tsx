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

    const inTabsGroup = segments[0] === "(tabs)";

    if (!userToken) {
      if (segments[0] !== "login") {
        router.replace("/login");
      }
    } else {
      const inPublicPages =
        segments[0] === "report-lost" || segments[0] === "report-found";

      if (!inTabsGroup && !inPublicPages) {
        router.replace("/(tabs)/home");
      }
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
