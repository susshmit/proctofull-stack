import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Shield, Mic, ArrowRight,
  Scan, Brain, Crosshair, Smartphone, AppWindow,
  Activity, Terminal
} from "lucide-react";

// Fast CDN Video Assets for continuous cross-fading
const VIDEO_1 = "https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4"; // High-visibility tech nodes moving
const VIDEO_2 = "https://cdn.pixabay.com/video/2019/11/14/29045-373302636_large.mp4"; // Cyber globe / Security
const VIDEO_3 = "https://cdn.pixabay.com/video/2020/03/12/33580-398202537_large.mp4"; // Binary matrix / code 
const VIDEO_4 = "https://cdn.pixabay.com/video/2021/08/04/83866-586111831_large.mp4"; // Data structures / AI

const features = [
  { icon: Scan, title: "Face Recognition", desc: "Real-time identity verification via facial recognition. Continuous monitoring detects unauthorized persons.", tag: "CV Model" },
  { icon: Smartphone, title: "Object Detection", desc: "YOLO-based detection of phones, books, earbuds, and other prohibited materials in the webcam feed.", tag: "YOLO v8" },
  { icon: Crosshair, title: "Gaze Tracking", desc: "Eye movement pattern analysis using landmark detection to identify off-screen gazing behavior.", tag: "MediaPipe" },
  { icon: Mic, title: "Audio Analysis", desc: "Background noise classification and voice detection using spectral analysis for unauthorized communication.", tag: "Whisper" },
  { icon: AppWindow, title: "Window Monitoring", desc: "Tab switching detection and application monitoring using the Visibility API and process enumeration.", tag: "Web API" },
  { icon: Brain, title: "Behavior Analysis", desc: "Aggregate anomaly scoring using multi-modal signals — head pose, typing cadence, and temporal patterns.", tag: "Ensemble" },
];

// Advanced Text Reveal with staggered characters and blur
const CinematicTextReveal = ({ text, className = "" }: { text: string; className?: string }) => {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30, filter: "blur(10px)", scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, delay: i * 0.15, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};


export default function LandingPage() {

  // GLOBAL SCROLL TRACKING
  // This hook tracks the scroll progress across the entire page (window).
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });

  // Map global scroll to video opacities for seamless 0-gap cross-fades
  const v1Opacity = useTransform(smoothProgress, [0, 0.25, 0.35], [1, 1, 0]);
  const v2Opacity = useTransform(smoothProgress, [0.25, 0.35, 0.55, 0.65], [0, 1, 1, 0]);
  const v3Opacity = useTransform(smoothProgress, [0.55, 0.65, 0.85, 0.95], [0, 1, 1, 0]);
  const v4Opacity = useTransform(smoothProgress, [0.85, 0.95, 1], [0, 1, 1]);

  // Hero custom parallax (Fly-forward zoom)
  const heroScale = useTransform(smoothProgress, [0, 0.25], [1, 1.5]);
  const heroY = useTransform(smoothProgress, [0, 0.25], ["0%", "20%"]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.1, 0.2], [1, 1, 0]);

  // Section-specific scroll tracking for continuous text zoom/fade
  const featuresRef = useRef<HTMLElement>(null);
  const { scrollYProgress: featScroll } = useScroll({ target: featuresRef, offset: ["start end", "end start"] });
  const featTextScale = useTransform(featScroll, [0, 0.3, 0.6, 1], [0.8, 1, 1, 1.2]);
  const featTextOpacity = useTransform(featScroll, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);
  const featTextY = useTransform(featScroll, [0, 0.3, 0.6, 1], [50, 0, 0, -50]);

  const archRef = useRef<HTMLElement>(null);
  const { scrollYProgress: archScroll } = useScroll({ target: archRef, offset: ["start end", "end start"] });
  const archTextScale = useTransform(archScroll, [0, 0.3, 0.6, 1], [0.8, 1, 1, 1.2]);
  const archTextOpacity = useTransform(archScroll, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);

  const journeyRef = useRef<HTMLElement>(null);
  const { scrollYProgress: journeyScroll } = useScroll({ target: journeyRef, offset: ["start end", "end start"] });
  const journeyTextScale = useTransform(journeyScroll, [0, 0.3, 0.6, 1], [0.8, 1, 1, 1.2]);
  const journeyTextOpacity = useTransform(journeyScroll, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);

  return (
    <div className="relative min-h-screen bg-black text-foreground selection:bg-primary/30 selection:text-primary-foreground overflow-x-hidden">

      {/* 
        GLOBAL CINEMATIC BACKGROUND
        Fixed to the viewport. Cross-fades videos based on scroll to eliminate blackouts.
      */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none bg-black">
        {/* Layer 1: Hero */}
        <motion.div style={{ opacity: v1Opacity }} className="absolute inset-0">
          <video autoPlay muted loop playsInline className="object-cover w-full h-full opacity-80 scale-[1.02]">
            <source src={VIDEO_1} type="video/mp4" />
          </video>
        </motion.div>

        {/* Layer 2: Features */}
        <motion.div style={{ opacity: v2Opacity }} className="absolute inset-0">
          <video autoPlay muted loop playsInline className="object-cover w-full h-full opacity-35 scale-[1.02]">
            <source src={VIDEO_2} type="video/mp4" />
          </video>
        </motion.div>

        {/* Layer 3: Walkthrough */}
        <motion.div style={{ opacity: v3Opacity }} className="absolute inset-0">
          <video autoPlay muted loop playsInline className="object-cover w-full h-full opacity-25 scale-[1.02]">
            <source src={VIDEO_3} type="video/mp4" />
          </video>
        </motion.div>

        {/* Layer 4: CTA */}
        <motion.div style={{ opacity: v4Opacity }} className="absolute inset-0">
          <video autoPlay muted loop playsInline className="object-cover w-full h-full opacity-40 scale-[1.02]">
            <source src={VIDEO_4} type="video/mp4" />
          </video>
        </motion.div>

        {/* Persistent Dark/Gradient Overlays to guarantee readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/50 to-black/80 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] z-10 opacity-70" />
      </div>

      {/* 
        CONTENT SCROLL CONTAINER 
        All sections are stacked here. Z-index 40 brings them safely above the fixed background.
      */}
      <div className="relative z-40 flex flex-col justify-start w-full">

        {/* 1. CINEMATIC HERO SECTION */}
        <section className="relative z-[100] px-4 flex items-center justify-center min-h-[100vh] lg:min-h-[120vh]">
          <motion.div
            style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
            className="container relative z-[100] text-center max-w-5xl pointer-events-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 backdrop-blur-md px-6 py-2.5 text-sm font-mono text-primary mb-10 tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(59,130,246,0.2)] relative z-10"
            >
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(59,130,246,1)]" />
              ProctorAI Protocol Active
            </motion.div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-[1.05] tracking-tighter mb-8 drop-shadow-2xl">
              Absolute <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-primary">Integrity.</span> <br />
              Zero <span className="text-white/40">Compromise.</span>
            </h1>

            <p className="text-xl md:text-3xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-16 font-light">
              <CinematicTextReveal text="Next-generation multimodal AI surveillance ensuring complete academic honesty through real-time behavioral analysis." />
            </p>

            {/* Preserved Routing Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="relative z-[110] flex flex-col sm:flex-row items-center justify-center gap-6 mt-8"
            >
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap h-16 px-10 rounded-2xl text-xl relative z-[110] group overflow-hidden bg-white text-black hover:bg-gray-200 transition-all duration-300 w-full sm:w-auto shadow-[0_0_40px_rgba(255,255,255,0.15)] pointer-events-auto cursor-pointer"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 -translate-x-[150%] skew-x-[-15deg] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                <span className="relative z-10 font-bold flex items-center pointer-events-none">
                  Start Examination <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300 pointer-events-none" />
                </span>
              </Link>

              <Link
                to="/admin-login"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium h-16 px-10 rounded-2xl text-xl backdrop-blur-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all duration-300 w-full sm:w-auto relative z-[110] pointer-events-auto cursor-pointer"
              >
                <Terminal className="mr-3 h-6 w-6 pointer-events-none" /> <span className="pointer-events-none">Admin Console</span>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* 2. SCROLLYTELLING FEATURES (Cinematic Bento Grid) */}
        <section ref={featuresRef} className="relative px-4 flex items-center justify-center min-h-screen lg:min-h-[150vh] py-20 md:py-32" id="features">
          <div className="container">
            <motion.div
              style={{ scale: featTextScale, opacity: featTextOpacity, y: featTextY }}
              className="mb-24 md:w-3/4 flex flex-col justify-center items-center md:items-start text-center md:text-left mx-auto md:mx-0"
            >
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-8">
                Perceives Everything.
              </h2>
              <p className="text-2xl text-gray-500 font-light max-w-2xl">
                Six neural networks running concurrently to detect the slightest anomalies in behavior, audio, and visual patterns.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, scale: 0.8, rotateX: 30, y: 100 }}
                  whileInView={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
                  viewport={{ once: true, margin: "-15%" }}
                  transition={{ duration: 0.8, delay: i * 0.1, type: "spring", stiffness: 50 }}
                  whileHover={{ y: -10, scale: 1.03, rotateX: 5, rotateY: -5 }}
                  className="group relative rounded-3xl p-8 overflow-hidden bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.08] hover:border-primary/50 transition-all duration-500 backdrop-blur-md shadow-2xl"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Magnetic Hover Glow Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 4 + (i % 3), ease: "easeInOut" }}
                    className="relative z-10 flex flex-col h-full transform-gpu"
                    style={{ transform: "translateZ(30px)" }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary/20 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-500">
                        <feat.icon className="h-8 w-8 text-white group-hover:text-primary transition-colors duration-500" />
                      </div>
                      <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-primary/80 group-hover:border-primary/30 transition-colors duration-500">
                        {feat.tag}
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-primary transition-colors duration-300">{feat.title}</h3>
                    <p className="text-gray-400 text-base leading-relaxed font-light">{feat.desc}</p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. IMMERSIVE WALKTHROUGH (Staggered Side-Scroll Feel) */}
        <section ref={archRef} className="relative px-4 flex flex-col justify-center min-h-screen lg:min-h-[150vh] py-20 md:py-32" id="architecture">
          <div className="container w-full">
            <div className="grid lg:grid-cols-2 gap-20 items-center">

              <div className="space-y-12">
                <motion.div
                  style={{ scale: archTextScale, opacity: archTextOpacity }}
                >
                  <span className="text-primary font-mono text-sm tracking-[0.3em] uppercase mb-6 block border-l-2 border-primary pl-4">System Architecture</span>
                  <h2 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-8">
                    Meticulous <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-gray-200">Processing.</span>
                  </h2>
                  <p className="text-2xl text-gray-400 font-light max-w-lg leading-relaxed">
                    Watch the data flow from client capture to administrative review in real-time, secured continuously.
                  </p>
                </motion.div>
              </div>

              {/* Glassmorphic Pipeline Cards with dynamic 3D slide-in */}
              <div className="space-y-8 relative perspective-[1000px]">
                {[
                  { title: "Authentication", detail: "Biometric match via FaceNet", icon: Scan },
                  { title: "Environment Scan", detail: "360° audio/visual clearance", icon: Mic },
                  { title: "Active Session", detail: "Continuous ensemble monitoring", icon: Activity },
                  { title: "Trust Verification", detail: "Blockchain-backed report generation", icon: Shield }
                ].map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 100, rotateY: -30, scale: 0.9 }}
                    whileInView={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
                    viewport={{ once: false, margin: "-15%" }}
                    transition={{ duration: 0.8, delay: idx * 0.15, type: "spring", stiffness: 60 }}
                    className="backdrop-blur-2xl bg-gradient-to-r from-white/[0.05] to-white/[0.01] border border-white/10 p-8 rounded-3xl flex items-center gap-8 group hover:border-primary/50 hover:bg-white/[0.08] transition-all duration-500 shadow-2xl"
                  >
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 3 + idx * 0.5, ease: "easeInOut" }}
                      className="h-16 w-16 rounded-2xl bg-black/50 border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:border-primary group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-500"
                    >
                      <step.icon className="h-7 w-7 text-white group-hover:text-primary transition-colors" />
                    </motion.div>
                    <div>
                      <h4 className="text-2xl font-bold text-white tracking-wide mb-1 group-hover:text-primary transition-colors">{step.title}</h4>
                      <p className="text-base font-mono text-gray-500">{step.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* 4. USER JOURNEY TIMELINE */}
        <section ref={journeyRef} className="relative px-4 py-20 md:py-32 border-t border-white/10 bg-black/50 backdrop-blur-sm" id="journey">
          <div className="container max-w-6xl mx-auto">
            <motion.div
              style={{ scale: journeyTextScale, opacity: journeyTextOpacity }}
              className="text-center mb-24"
            >
              <span className="text-primary font-mono text-sm tracking-[0.3em] uppercase mb-4 block">The Process</span>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
                Frictionless Onboarding.
              </h2>
              <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
                A streamlined, step-by-step journey from identity verification to secure exam submission.
              </p>
            </motion.div>

            <div className="relative border-l-2 border-white/10 ml-4 md:ml-12 space-y-24 pb-12">
              {[
                {
                  phase: "Phase 1: Registration",
                  title: "Biometric Setup",
                  desc: "A secure one-time onboarding. The user registers their primary facial biometric template and ambient microphone baseline.",
                  video: "https://videos.pexels.com/video-files/5198159/5198159-hd_1920_1080_25fps.mp4"
                },
                {
                  phase: "Phase 2: Pre-Flight",
                  title: "Environment Clearance",
                  desc: "A required 360-degree pan of the workspace using the device camera, scanned by AI for unauthorized devices.",
                  video: "https://videos.pexels.com/video-files/3163534/3163534-hd_1920_1080_30fps.mp4"
                },
                {
                  phase: "Phase 3: Active Exam",
                  title: "Continuous Telemetry",
                  desc: "Six neural networks run concurrently checking gaze, audio, and background movement—transparently in the browser.",
                  video: "https://videos.pexels.com/video-files/2887463/2887463-hd_1920_1080_25fps.mp4"
                }
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, margin: "-15%" }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="relative pl-10 md:pl-16"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-[-9px] top-10 h-4 w-4 rounded-full bg-primary shadow-[0_0_15px_rgba(59,130,246,0.8)]" />

                  <div className="grid md:grid-cols-2 gap-12 items-center group">
                    <div>
                      <span className="text-sm font-mono text-primary/80 mb-2 block">{step.phase}</span>
                      <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-primary transition-colors">{step.title}</h3>
                      <p className="text-gray-400 leading-relaxed text-lg">{step.desc}</p>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ repeat: Infinity, duration: 8 + (idx * 2), ease: "easeInOut" }}
                      className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group-hover:border-primary/40 transition-colors duration-500"
                    >
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                      <video autoPlay muted loop playsInline className="w-full object-cover aspect-video opacity-80 group-hover:opacity-100 transition-opacity duration-700">
                        <source src={step.video} type="video/mp4" />
                      </video>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. CINEMATIC CTA SECTION */}
        <section className="relative z-[100] px-4 flex items-center justify-center min-h-[120vh] border-t border-white/10 mt-20">
          <div className="container text-center relative z-[100]">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: false, margin: "-20%" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="max-w-5xl mx-auto backdrop-blur-3xl bg-black/40 border border-white/10 p-8 sm:p-12 md:p-32 rounded-[2rem] md:rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-[100] overflow-hidden group pointer-events-auto"
            >
              {/* Rotating Magnetic Border Glow */}
              <div className="absolute inset-0 border-[2px] border-transparent rounded-[4rem] [background:linear-gradient(120deg,transparent,rgba(59,130,246,0.4),transparent)_border-box] [mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] mask-composite-exclude group-hover:opacity-100 opacity-50 transition-opacity duration-1000 pointer-events-none" />

              <motion.div
                animate={{ scale: [1, 1.1, 1], filter: ["drop-shadow(0 0 20px rgba(59,130,246,0.3))", "drop-shadow(0 0 40px rgba(59,130,246,0.8))", "drop-shadow(0 0 20px rgba(59,130,246,0.3))"] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <Shield className="h-24 w-24 text-primary mx-auto mb-10 group-hover:scale-110 transition-transform duration-700" />
              </motion.div>

              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-8">
                Enforce Standards. <br /> <span className="text-gray-600">Effortlessly.</span>
              </h2>

              <div className="relative z-[110] flex flex-col sm:flex-row justify-center gap-6 mt-16 w-full max-w-2xl mx-auto pointer-events-auto">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap w-full text-xl h-20 rounded-3xl bg-white text-black hover:bg-gray-200 shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] transition-all font-bold pointer-events-auto relative z-[110] cursor-pointer"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap w-full text-xl h-20 rounded-3xl bg-transparent border border-white/20 text-white hover:bg-white/10 backdrop-blur-lg transition-all font-bold pointer-events-auto relative z-[110] cursor-pointer"
                >
                  Student Sign In
                </Link>
              </div>

              <Link
                to="/system-check"
                className="mt-16 text-base text-gray-500 hover:text-white font-mono tracking-widest uppercase transition-colors group/diag flex items-center justify-center mx-auto relative z-[110] pointer-events-auto cursor-pointer"
              >
                Run Hardware Diagnostic <ArrowRight className="ml-3 h-5 w-5 group-hover/diag:translate-x-2 transition-transform duration-300 pointer-events-none" />
              </Link>
            </motion.div>
          </div>
        </section>

      </div>
    </div>
  );
}
