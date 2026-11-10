import { Clock } from "lucide-react";
import Card from "./Card";

// Fonctionnalités des maquettes sans service backend : aucune donnée fictive affichée.
export default function ComingSoon({ title = "Bientôt disponible", items }) {
  return (
    <Card className="border-dashed">
      <div className="flex items-center gap-2 text-slate-700">
        <Clock className="h-4 w-4" aria-hidden="true" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Ces fonctionnalités ne sont pas encore disponibles : {items.join(", ")}.
      </p>
    </Card>
  );
}
