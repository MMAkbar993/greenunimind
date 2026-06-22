import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  sidebarWidth: string;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(() => {
    // Initialize from localStorage if available, default to true (collapsed) for testing
    try {
      const savedCollapsed = localStorage.getItem('sidebar-collapsed');
      return savedCollapsed ? JSON.parse(savedCollapsed) : true;
    } catch {
      return true;
    }
  });

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  // Toggle collapsed state
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // Calculate sidebar width based on collapsed state
  const sidebarWidth = collapsed ? '6rem' : '16rem';

  const value: SidebarContextType = {
    collapsed,
    setCollapsed,
    toggleCollapsed,
    sidebarWidth,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};
