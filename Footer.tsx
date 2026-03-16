import { Link, useLocation } from "react-router-dom";
import { Shield } from "lucide-react";

const footerLinks = {
  System: [
    { label: "Features", href: "/#features" },
    { label: "Architecture", href: "/#architecture" },
    { label: "System Check", href: "/system-check" },
    { label: "Demo Login", href: "/login" },
  ],
  Research: [
    { label: "Face Recognition", href: "#" },
    { label: "Gaze Tracking", href: "#" },
    { label: "Audio Analysis", href: "#" },
    { label: "Anomaly Detection", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Data Processing", href: "#" },
    { label: "Academic Ethics", href: "#" },
  ],
};

export default function Footer() {
  const location = useLocation();

  if (location.pathname.match(/^\/exam\/[^/]+$/) || location.pathname === "/dashboard" || location.pathname === "/admin") {
    return null;
  }

  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">ProctorAI</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              An AI-powered remote proctoring system ensuring academic integrity through automated surveillance and intelligent anomaly detection.
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Academic Project • Computer Science Department
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col md:flex-row items-center justify-between py-6 gap-4">
          <p className="text-xs text-muted-foreground font-mono">
            © 2026 ProctorAI — Academic Research Project
          </p>
          <p className="text-xs text-muted-foreground">
            Built with React • Tailwind CSS • Framer Motion
          </p>
        </div>
      </div>
    </footer>
  );
}
