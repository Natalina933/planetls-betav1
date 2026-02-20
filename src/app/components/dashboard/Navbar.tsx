// components/dashboard/Navbar.tsx
"use client";


export default function Navbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
    return (
        <header className="dash-navbar">
            <button onClick={onToggleSidebar} aria-label="Toggle sidebar">☰</button>
            <div className="nav-right">
                {/* avatar, notifications, logout */}
            </div>
        </header>
    );
}
