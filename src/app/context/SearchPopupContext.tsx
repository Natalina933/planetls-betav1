"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface SearchPopupContextType {
  searchOpen: boolean;
  openSearchPopup: () => void;
  closeSearchPopup: () => void;
}

const SearchPopupContext = createContext<SearchPopupContextType | undefined>(undefined);

export const SearchPopupProvider = ({ children }: { children: ReactNode }) => {
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearchPopup = () => setSearchOpen(true);
  const closeSearchPopup = () => setSearchOpen(false);

  return (
    <SearchPopupContext.Provider value={{ searchOpen, openSearchPopup, closeSearchPopup }}>
      {children}
    </SearchPopupContext.Provider>
  );
};

export const useSearchPopup = () => {
  const context = useContext(SearchPopupContext);
  if (!context) throw new Error("useSearchPopup must be used within a SearchPopupProvider");
  return context;
};
