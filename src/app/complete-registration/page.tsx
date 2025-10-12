import { Suspense } from "react";
import CompleteRegistrationPage from "./CompleteRegistrationPage";

export default function Page() {
  return (
    <Suspense fallback={<p>Chargement du formulaire...</p>}>
      <CompleteRegistrationPage />
    </Suspense>
  );
}
