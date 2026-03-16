"use client";
import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";

export default function ThemeProvider({ children }) {
  const theme = usePlayerStore(s => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return <>{children}</>;
}