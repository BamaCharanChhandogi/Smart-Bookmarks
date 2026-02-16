"use client";

import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh" }}>
      {/* Ambient background glows */}
      <div className="ambient-glow ambient-glow-1" />
      <div className="ambient-glow ambient-glow-2" />

      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Smart Bookmark
          </span>
        </div>
      </nav>

      {/* Hero */}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 24px 120px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          className="animate-fade-in-up"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(139, 92, 246, 0.1)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            borderRadius: "999px",
            padding: "6px 16px",
            fontSize: "0.85rem",
            color: "var(--accent-purple)",
            marginBottom: "32px",
            fontWeight: 500,
          }}
        >
          Real-time bookmark syncing across all your tabs
        </div>

        <h1
          className="animate-fade-in-up"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            maxWidth: "700px",
            marginBottom: "24px",
            animationDelay: "0.1s",
          }}
        >
          Save your links{" "}
          <span className="gradient-text">effortlessly</span>
        </h1>

        <p
          className="animate-fade-in-up"
          style={{
            fontSize: "1.15rem",
            color: "var(--text-secondary)",
            maxWidth: "520px",
            lineHeight: 1.7,
            marginBottom: "48px",
            animationDelay: "0.2s",
          }}
        >
          A sleek, private bookmark manager. Sign in with Google, save your
          favorite links, and watch them sync in real-time.
        </p>

        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          <button className="btn-google" onClick={handleGoogleLogin}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
        </div>

        {/* Feature cards */}
        <div
          className="animate-fade-in-up"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            maxWidth: "740px",
            width: "100%",
            marginTop: "80px",
            animationDelay: "0.4s",
          }}
        >
          {[
            {
              title: "Private",
              desc: "Your bookmarks are yours alone",
            },
            {
              title: "Real-time",
              desc: "Syncs instantly across tabs",
            },
            {
              title: "Anywhere",
              desc: "Access from any device, anytime",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="glass-card"
              style={{
                padding: "28px 24px",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  marginBottom: "6px",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "24px",
          color: "var(--text-muted)",
          fontSize: "0.8rem",
          position: "relative",
          zIndex: 10,
        }}
      >
        Built with Next.js & Supabase
      </footer>
    </div>
  );
}
