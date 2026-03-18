"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const Header = dynamic(() => import("../Header/Header"), { ssr: false });
const MapPopup = dynamic(() => import("../MapPopup/MapPopup"), { ssr: false });

function shouldHideChrome(pathname: string | null) {
  if (!pathname) return false;
  return pathname.startsWith("/dashboard");
}

export default function AppChrome() {
  const pathname = usePathname();

  if (shouldHideChrome(pathname)) {
    return null;
  }

  return (
    <>
      <Header />
      <MapPopup />
    </>
  );
}
