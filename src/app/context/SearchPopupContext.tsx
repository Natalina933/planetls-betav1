"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SearchPopupContextProps {
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  forceClose: boolean;
  setForceClose: (close: boolean) => void;
}

const SearchPopupContext = createContext<SearchPopupContextProps | undefined>(undefined);

export const SearchPopupProvider = ({ children }: { children: ReactNode }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [forceClose, setForceClose] = useState(false);

  return (
    <SearchPopupContext.Provider value={{ searchOpen, setSearchOpen, forceClose, setForceClose }}>
      {children}
    </SearchPopupContext.Provider>
  );
};

export const useSearchPopup = () => {
  const context = useContext(SearchPopupContext);
  if (!context) throw new Error("useSearchPopup must be used within SearchPopupProvider");
  return context;
};
