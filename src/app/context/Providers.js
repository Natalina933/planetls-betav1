// src/app/context/Providers.js
'use client';
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { UserTypeProvider } from './UserTypeContext';
import { NotificationProvider } from './NotificationContext';
import { LanguageProvider } from './LanguageContext';

export default function Providers({ children }) {
    return (
        <SessionProvider>
            <AuthProvider>
                <ThemeProvider>
                    <UserTypeProvider>
                        <NotificationProvider>
                            <LanguageProvider>
                                {children}
                            </LanguageProvider>
                        </NotificationProvider>
                    </UserTypeProvider>
                </ThemeProvider>
            </AuthProvider>
        </SessionProvider>
    );
}
