import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Sidebar from "../../../../src/app/components/dashboard/Sidebar/Sidebar";
import { NavigationContext } from "./adapters";
import "../../../../src/app/styles/main.scss";

function Preview() {
  const [open, setOpen] = useState(innerWidth > 900);
  const [path, navigate] = useState("/dashboard/concierge");
  useEffect(() => {
    const media = matchMedia("(max-width: 900px)");
    const change = () => setOpen(!media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return <NavigationContext.Provider value={{ path, navigate }}>
    <main className="dashboard-root" data-concierge-dashboard="">
      <button style={{ position: "fixed", right: 16, top: 16 }} onClick={() => setOpen(value => !value)}>Ouvrir ou fermer le menu</button>
      <Sidebar isOpen={open} toggleSidebar={() => setOpen(value => !value)} conciergeBranding />
    </main>
  </NavigationContext.Provider>;
}

globalThis.fetch = async input => {
  if (typeof input === "string" && input === "/api/service-requests?view=concierge&limit=30") {
    return new Response(JSON.stringify({ items: [{ id: "fixture", recipient_status: "sent" }] }), { headers: { "Content-Type": "application/json" } });
  }
  throw new Error("Recette sidebar : requête non autorisée.");
};
document.documentElement.dataset.theme = "mucha-dark";
document.body.dataset.theme = "mucha-dark";
createRoot(document.getElementById("root")!).render(<Preview />);
