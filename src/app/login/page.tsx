import { Suspense } from "react";
import LoginPage from "@/app/login/LoginPage";

export default function Page() {
  return (
    <Suspense fallback={<p>Chargement du formulaire...</p>}>
      <LoginPage />
    </Suspense>
  );
}
