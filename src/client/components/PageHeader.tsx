import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type Props = {
  username: string;
  title: string | null;
  displayName: string;
  avatarUrl: string | null;
};

/**
 * Sticky header shown only on sub-pages. Left: back arrow to the username's
 * main page. Right: owner avatar that also links back to the main page.
 */
export default function PageHeader({ username, title, displayName, avatarUrl }: Props) {
  const initial = (displayName || username).charAt(0).toUpperCase();
  const mainHref = `/${username}`;

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        zIndex: 100,
        color: "#111827",
      }}
    >
      <Link
        to={mainHref}
        aria-label="返回"
        style={{
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          color: "inherit",
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={22} />
      </Link>

      <span
        style={{
          fontSize: "0.95rem",
          fontWeight: 600,
          maxWidth: "55%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title || displayName}
      </span>

      <Link
        to={mainHref}
        aria-label={displayName}
        style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.95rem",
              fontWeight: 700,
            }}
          >
            {initial}
          </div>
        )}
      </Link>
    </header>
  );
}
