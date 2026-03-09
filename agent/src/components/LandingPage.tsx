/** @format */

import React from "react";

interface LandingPageProps {
  onDoctorLogin: () => void;
}

const KEYFRAMES = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-ring {
  0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99,179,237,0.5); }
  70%  { transform: scale(1);    box-shadow: 0 0 0 18px rgba(99,179,237,0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99,179,237,0); }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
`;

const STEPS = [
  {
    icon: "🔗",
    title: "Doctor creates a patient",
    desc: "Add a patient in the dashboard and share their unique private link via email or SMS.",
  },
  {
    icon: "📱",
    title: "Patient scans from home",
    desc: "Patient clicks the link — no login, no app. Just their webcam and 10 seconds.",
  },
  {
    icon: "📊",
    title: "AI analysis + doctor review",
    desc: "Gemini scores tremor, rigidity and bradykinesia. Doctor monitors trends over time.",
  },
];

const FEATURES = [
  {
    icon: "🤖",
    title: "Gemini 2.5 Flash AI",
    desc: "Real-time multimodal video analysis with Parkinson-specific motor assessment prompts.",
  },
  {
    icon: "🎙️",
    title: "Voice Feedback",
    desc: "AI speaks the diagnosis results aloud — ideal for patients with visual impairments.",
  },
  {
    icon: "📋",
    title: "Medical Reports",
    desc: "Auto-generated HTML reports with Chart.js severity trends over time.",
  },
  {
    icon: "🏠",
    title: "Home Monitoring",
    desc: "Patients scan without any app or login — just a private link and their webcam.",
  },
  {
    icon: "🩺",
    title: "Doctor Dashboard",
    desc: "Manage unlimited patients, review session histories, and generate reports.",
  },
  {
    icon: "🔒",
    title: "Secure & Private",
    desc: "Multi-tenant Firestore isolation. Each doctor only sees their own patients.",
  },
];

const STATS = [
  { value: "60M+", label: "people with Parkinson's worldwide" },
  { value: "10 sec", label: "to complete a scan" },
  { value: "0", label: "apps or logins for patients" },
  { value: "6", label: "motor symptoms tracked" },
];

export function LandingPage({ onDoctorLogin }: LandingPageProps) {
  const BG =
    "linear-gradient(160deg, #0a0f1e 0%, #0f172a 40%, #0d2a4a 75%, #0f1f3d 100%)";
  const BLUE = "#3b82f6";
  const CYAN = "#06b6d4";
  const font = "'Segoe UI', system-ui, -apple-system, sans-serif";

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div
        style={{
          minHeight: "100vh",
          background: BG,
          fontFamily: font,
          color: "white",
          overflowX: "hidden",
        }}>
        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.1rem 2.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "rgba(10,15,30,0.7)",
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              style={{
                fontSize: "1.6rem",
                animation: "float 3s ease-in-out infinite",
              }}>
              🧠
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: "1.15rem",
                letterSpacing: "-0.02em",
              }}>
              Parkinson<span style={{ color: CYAN }}>Agent</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={onDoctorLogin}
              style={{
                background: BLUE,
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "0.5rem 1.2rem",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#2563eb")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = BLUE)}>
              Doctor Portal →
            </button>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section
          style={{
            textAlign: "center",
            padding: "6rem 1.5rem 4rem",
            animation: "fadeUp 0.7s ease both",
          }}>
          <div
            style={{
              display: "inline-block",
              marginBottom: "1.5rem",
              background: "rgba(6,182,212,0.12)",
              border: "1px solid rgba(6,182,212,0.35)",
              borderRadius: 20,
              padding: "0.3rem 1rem",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: CYAN,
              letterSpacing: "0.06em",
            }}>
            ⚡ POWERED BY GEMINI 2.5 FLASH · GOOGLE CLOUD · FIREBASE
          </div>

          <h1
            style={{
              fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              margin: "0 auto 1.5rem",
              maxWidth: 800,
              letterSpacing: "-0.03em",
            }}>
            AI-Powered{" "}
            <span
              style={{
                background: `linear-gradient(90deg, ${BLUE}, ${CYAN}, ${BLUE})`,
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 3s linear infinite",
              }}>
              Parkinson's
            </span>{" "}
            Monitoring
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              color: "#94a3b8",
              maxWidth: 620,
              margin: "0 auto 2.5rem",
              lineHeight: 1.65,
            }}>
            Doctors monitor patients' motor symptoms remotely using only a
            webcam. Patients scan from home in{" "}
            <strong style={{ color: "white" }}>10 seconds</strong> — no app, no
            login.
          </p>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}>
            <button
              onClick={onDoctorLogin}
              style={{
                background: `linear-gradient(135deg, ${BLUE}, #1d4ed8)`,
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "0.9rem 2.2rem",
                fontSize: "1rem",
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: "-0.01em",
                boxShadow: `0 8px 32px rgba(59,130,246,0.4)`,
                animation: "pulse-ring 2.5s ease-in-out infinite",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.04)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }>
              🩺 Open Doctor Portal
            </button>
          </div>

          {/* Webcam illustration */}
          <div
            style={{
              marginTop: "4rem",
              display: "inline-block",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: "1.5rem 2rem",
              fontSize: "0.82rem",
              color: "#64748b",
            }}>
            <div
              style={{
                display: "flex",
                gap: "2rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}>
              {[
                "🖥️ Standard webcam only",
                "⏱️ 10-second scan",
                "🔒 HIPAA-ready isolation",
                "🌍 Works in any browser",
              ].map((t) => (
                <span key={t} style={{ color: "#94a3b8", fontWeight: 500 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <section
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "1px",
            margin: "0 2rem 5rem",
            background: "rgba(255,255,255,0.06)",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            maxWidth: 900,
            marginInline: "auto",
            animation: "fadeUp 0.9s ease 0.15s both",
          }}>
          {STATS.map(({ value, label }) => (
            <div
              key={label}
              style={{
                flex: "1 1 180px",
                padding: "2rem 1.5rem",
                textAlign: "center",
                background: "rgba(255,255,255,0.025)",
              }}>
              <div
                style={{
                  fontSize: "2.2rem",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  background: `linear-gradient(135deg, white, ${CYAN})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                {value}
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "#64748b",
                  marginTop: "0.3rem",
                  fontWeight: 500,
                }}>
                {label}
              </div>
            </div>
          ))}
        </section>

        {/* ── How it works ────────────────────────────────────────────────── */}
        <section
          style={{
            padding: "0 1.5rem 5rem",
            maxWidth: 1000,
            margin: "0 auto",
            animation: "fadeUp 1s ease 0.25s both",
          }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "1.9rem",
              fontWeight: 800,
              marginBottom: "0.6rem",
              letterSpacing: "-0.02em",
            }}>
            How it works
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              marginBottom: "3rem",
              fontSize: "0.95rem",
            }}>
            From clinic setup to home monitoring in minutes.
          </p>

          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}>
            {STEPS.map(({ icon, title, desc }, i) => (
              <div
                key={title}
                style={{
                  flex: "1 1 260px",
                  maxWidth: 300,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "1.75rem",
                  position: "relative",
                  overflow: "hidden",
                }}>
                <div
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    color: "#1e40af",
                    background: "rgba(59,130,246,0.15)",
                    border: "1px solid rgba(59,130,246,0.3)",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: "2.2rem", marginBottom: "0.75rem" }}>
                  {icon}
                </div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                    color: "white",
                  }}>
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#64748b",
                    lineHeight: 1.6,
                    margin: 0,
                  }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features grid ───────────────────────────────────────────────── */}
        <section
          style={{
            padding: "0 1.5rem 5rem",
            maxWidth: 1000,
            margin: "0 auto",
            animation: "fadeUp 1s ease 0.35s both",
          }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "1.9rem",
              fontWeight: 800,
              marginBottom: "0.6rem",
              letterSpacing: "-0.02em",
            }}>
            Everything you need
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              marginBottom: "3rem",
              fontSize: "0.95rem",
            }}>
            Clinical-grade AI monitoring without the clinical overhead.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: "1.4rem",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)";
                  e.currentTarget.style.background = "rgba(59,130,246,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                }}>
                <div style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>
                  {icon}
                </div>
                <h3
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    marginBottom: "0.4rem",
                    color: "white",
                  }}>
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "#64748b",
                    lineHeight: 1.6,
                    margin: 0,
                  }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tech stack ──────────────────────────────────────────────────── */}
        <section
          style={{
            textAlign: "center",
            padding: "3rem 1.5rem",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            animation: "fadeUp 1s ease 0.45s both",
          }}>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#475569",
              marginBottom: "1rem",
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}>
            BUILT WITH
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}>
            {[
              { label: "Gemini 2.5 Flash", color: "#1a73e8" },
              { label: "Google Agent SDK", color: "#34a853" },
              { label: "Firebase Auth", color: "#f59e0b" },
              { label: "Cloud Firestore", color: "#ff6d00" },
              { label: "Cloud Run", color: "#4285f4" },
              { label: "React + TypeScript", color: "#61dafb" },
            ].map(({ label, color }) => (
              <span
                key={label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${color}40`,
                  borderRadius: 8,
                  padding: "0.35rem 0.85rem",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color,
                }}>
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────────── */}
        <section
          style={{
            textAlign: "center",
            padding: "4rem 1.5rem 6rem",
            background: "rgba(59,130,246,0.04)",
            borderTop: "1px solid rgba(59,130,246,0.15)",
          }}>
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              marginBottom: "0.75rem",
              letterSpacing: "-0.02em",
            }}>
            Ready to monitor your patients?
          </h2>
          <p
            style={{
              color: "#64748b",
              marginBottom: "2rem",
              fontSize: "0.95rem",
            }}>
            Create your doctor account in 30 seconds. Add patients, generate
            links, and start monitoring.
          </p>
          <button
            onClick={onDoctorLogin}
            style={{
              background: `linear-gradient(135deg, ${BLUE}, #1d4ed8)`,
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: "1rem 2.8rem",
              fontSize: "1.1rem",
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              boxShadow: `0 12px 40px rgba(59,130,246,0.35)`,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.04)";
              e.currentTarget.style.boxShadow = `0 16px 50px rgba(59,130,246,0.5)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = `0 12px 40px rgba(59,130,246,0.35)`;
            }}>
            🩺 Open Doctor Portal
          </button>
          <p
            style={{
              marginTop: "1.5rem",
              fontSize: "0.75rem",
              color: "#334155",
            }}>
            Patients access via their unique private link — no account needed.
          </p>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            padding: "1.25rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
            fontSize: "0.75rem",
            color: "#334155",
          }}>
          <span>© 2026 ParkinsonAgent — Built for the Google AI Hackathon</span>
          <span>Powered by Gemini 2.5 Flash · Not a medical device</span>
        </footer>
      </div>
    </>
  );
}
