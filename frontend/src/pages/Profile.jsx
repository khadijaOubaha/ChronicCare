
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile } from "../services/auth";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const token = sessionStorage.getItem("access_token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const data = await getMyProfile(token);
        if (!cancelled) setUser(data);
      } catch {
        sessionStorage.removeItem("access_token");
        if (!cancelled) {
          setError("Votre session a expiré. Veuillez vous reconnecter.");
          navigate("/login", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function logout() {
    sessionStorage.removeItem("access_token");
    navigate("/login", { replace: true });
  }

  if (loading) return <main className="auth-container">Chargement du profil...</main>;
  if (!user) return <main className="auth-container">{error}</main>;

  return (
    <main className="auth-container">
      <section className="auth-card">
        <h1>Mon profil ChronicCare</h1>
        <p><strong>Nom :</strong> {user.full_name}</p>
        <p><strong>E-mail :</strong> {user.email}</p>
        <p><strong>Rôle :</strong> {user.role}</p>
        <p><strong>Compte actif :</strong> {user.is_active ? "Oui" : "Non"}</p>

        <button type="button" onClick={logout}>
          Se déconnecter
        </button>
      </section>
    </main>
  );
}
