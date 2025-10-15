'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const menuItems = [
    { name: "Accueil", path: "/" },
    { name: "Profil", path: "/profile" },
    { name: "Tableau de bord", path: "/dashboard" },
    { name: "Paramètres", path: "/settings" },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
    const pathname = usePathname();

    return (
        <>
            {/* Overlay pour ferme sidebar mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={toggleSidebar}
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 p-6 transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
            >
                <h2 className="text-xl font-bold mb-6">Mon Application</h2>
                <nav className="flex flex-col gap-2">
                    {menuItems.map(({ name, path }) => {
                        const isActive = pathname === path;
                        return (
                            <Link key={path} href={path} className={`block rounded px-4 py-2 ${isActive ? "bg-yellow-500 text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                                {name}
                            </Link>
                        );
                    })}

                </nav>
                <button onClick={toggleSidebar} className="mt-4 md:hidden">
                    Fermer
                </button>
            </aside>
        </>
    );
};

export default Sidebar;
