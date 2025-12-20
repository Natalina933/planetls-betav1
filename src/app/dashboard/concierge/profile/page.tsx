// src/app/dashboard/concierge/profile/page.tsx
import { Suspense } from "react";
import ConciergeProfilePage from "./ConciergeProfilePage";
import styles from "./ConciergeProfilePage.module.scss";

// Composant de chargement - Simple et sans styled-jsx
function ProfileLoadingSkeleton() {
  return (
    <div className={styles.pageContainer}>
      <div style={{ 
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "1rem"
      }}>
        <div style={{ 
          width: "50px",
          height: "50px",
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #3498db",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <p style={{ 
          color: "#666",
          fontSize: "1.1rem",
          fontWeight: 500
        }}>
          Chargement du profil...
        </p>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />
      </div>
    </div>
  );
}

// Page wrapper avec Suspense - requis pour useSearchParams() dans Next.js 15
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoadingSkeleton />}>
      <ConciergeProfilePage />
    </Suspense>
  );
}