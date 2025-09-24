import { Suspense } from "react";
import SearchFormPage from "./SearchFormPage";

export default function Page() {
  return (
    <Suspense fallback={<p>Chargement du formulaire...</p>}>
      <SearchFormPage />
    </Suspense>
  );
}
