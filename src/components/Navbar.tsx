import { useState, useEffect } from "react";
// Using native <a> for hash links since React Router <Link> doesn't trigger scroll
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X, LogOut, Terminal, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Solutions", path: "/#features" },
  { label: "Architecture", path: "/#architecture" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide navbar during active exam
  if (location.pathname.match(/^\/exam\/[^/]+$/) && !location.pathname.includes("instructions")) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4">
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`relative rounded-2xl transition-all duration-300 ${scrolled
          ? "bg-background/70 backdrop-blur-xl shadow-lg shadow-primary/5 border border-border"
          : "bg-background/50 backdrop-blur-xl border border-border/50"
          }`}
      >
        <div className="flex items-center justify-between px-4 py-2.5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary glow-primary transition-transform group-hover:scale-110">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground tracking-tight hidden sm:inline">ProctorAI</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.path === "/" ? (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={(e) => {
                    if (location.pathname === "/") {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.path}
                  href={link.path}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                >
                  {link.label}
                </a>
              )
            )}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">{user.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { logout(); navigate("/"); }}
                  className="rounded-lg h-8 px-2.5 text-xs"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className="rounded-lg h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  <User className="mr-1.5 h-3.5 w-3.5" />
                  Login
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/signup")}
                  className="rounded-lg h-8 px-3 text-xs"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) =>
                  link.path === "/" ? (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="block text-sm text-muted-foreground hover:text-foreground py-2 px-2 rounded-lg hover:bg-muted/50"
                      onClick={(e) => {
                        if (location.pathname === "/") {
                          e.preventDefault();
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                        setMobileOpen(false);
                      }}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.path}
                      href={link.path}
                      className="block text-sm text-muted-foreground hover:text-foreground py-2 px-2 rounded-lg hover:bg-muted/50"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </a>
                  )
                )}
                <div className="flex flex-col gap-2 pt-2 border-t border-border mt-2">
                  {user ? (
                    <div className="flex items-center justify-between px-2">
                      <span className="text-sm font-mono text-muted-foreground truncate">{user.name}</span>
                      <Button variant="ghost" size="sm" className="rounded-lg h-8 px-2.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { logout(); navigate("/"); setMobileOpen(false); }}>
                        <LogOut className="h-3.5 w-3.5 mr-1" /> Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 rounded-lg h-8 text-xs" onClick={() => { navigate("/login"); setMobileOpen(false); }}>
                        Login
                      </Button>
                      <Button variant="default" size="sm" className="flex-1 rounded-lg h-8 text-xs glow-primary" onClick={() => { navigate("/signup"); setMobileOpen(false); }}>
                        Sign Up
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}
