import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type ThemeType = 'default' | 'purple';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>('default');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'default' ? 'purple' : 'default'));
  };

  const colors = theme === 'purple'
    ? {
        primary: 'rgba(139, 92, 246, 0.8)', // Purple
        secondary: 'rgba(236, 72, 153, 0.8)', // Pink
        accent: 'rgba(167, 139, 250, 0.6)', // Light purple
        glow: 'rgba(139, 92, 246, 0.12)',
      }
    : {
        primary: 'rgba(16, 185, 129, 0.8)', // Emerald
        secondary: 'rgba(20, 184, 166, 0.8)', // Teal
        accent: 'rgba(52, 211, 153, 0.6)', // Light emerald
        glow: 'rgba(16, 185, 129, 0.12)',
      };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
