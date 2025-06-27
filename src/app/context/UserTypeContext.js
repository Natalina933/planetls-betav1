import { createContext, useState, useContext } from 'react';

export const UserTypeContext = createContext();

export function UserTypeProvider({ children }) {
    const [userType, setUserType] = useState(null); // 'owner', 'concierge', 'tradespeople', etc.

    const changeUserType = (type) => setUserType(type);

    return (
        <UserTypeContext.Provider value={{ userType, changeUserType }}>
            {children}
        </UserTypeContext.Provider>
    );
}

// Hook personnalisé pour utiliser le contexte facilement
export function useUserType() {
    return useContext(UserTypeContext);
}