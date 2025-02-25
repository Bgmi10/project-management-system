import { createContext, useEffect, useState } from "react";

interface ThemeContextType {
  isLight: string;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isLight: "light",
  toggleTheme: () => {}, 
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isLight, setIsLight] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme : "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", isLight);
    if (isLight === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, [isLight]);

  const toggleTheme = () => {
    setIsLight((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ isLight, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
