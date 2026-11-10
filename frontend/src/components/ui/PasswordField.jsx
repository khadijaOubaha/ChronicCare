import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import TextField from "./TextField";

export default function PasswordField(props) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      icon={Lock}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="rounded p-1 text-slate-400 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
      {...props}
    />
  );
}
