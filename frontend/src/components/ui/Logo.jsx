
import { Activity } from "lucide-react";

export default function Logo({ dark = false }) {
  return (
    <div className={`logo${dark ? " logo-dark" : ""}`}>
      <span className="logo-icon">
        <Activity size={21} aria-hidden="true" />
      </span>
      <span className="logo-text">ChronicCare</span>
    </div>
  );
}


