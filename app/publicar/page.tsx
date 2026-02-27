import { Suspense } from "react";
import PublishClient from "./PublishClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando…</div>}>
      <PublishClient />
    </Suspense>
  );
}