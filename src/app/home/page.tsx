// export default function Home() {
//   return (
//     <main className="min-h-screen bg-gray-50 text-gray-900">
//       {/* Header */}
//       <header className="border-b bg-white">
//         <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
//           <h1 className="font-bold text-xl">Super Portal</h1>

//           <div className="space-x-4">
//             <a href="/auth" className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">
//               Sign In
//             </a>
//           </div>
//         </div>
//       </header>

//       {/* Hero Section */}
//       <section className="mx-auto max-w-5xl px-6 py-24 text-center">
//         <h2 className="font-bold text-4xl tracking-tight">One Portal. Many Internal Tools.</h2>

//         <p className="mt-6 text-gray-600 text-lg">
//           Super Portal is a central platform that brings together internal apps, services, and tools
//           into a single unified interface.
//         </p>

//         <div className="mt-10 flex justify-center gap-4">
//           <a href="/login" className="rounded-md bg-black px-6 py-3 text-white hover:bg-gray-800">
//             Access Portal
//           </a>

//           <a href="#apps" className="rounded-md border px-6 py-3 hover:bg-gray-100">
//             Explore Apps
//           </a>
//         </div>
//       </section>

//       {/* Apps Section */}
//       <section id="apps" className="bg-white py-20">
//         <div className="mx-auto max-w-6xl px-6">
//           <h3 className="text-center font-semibold text-2xl">Available Services</h3>

//           <div className="mt-12 grid gap-6 md:grid-cols-3">
//             <div className="rounded-lg border p-6">
//               <h4 className="font-semibold">Analytics Dashboard</h4>
//               <p className="mt-2 text-gray-600 text-sm">
//                 Access internal analytics and reporting tools.
//               </p>
//             </div>

//             <div className="rounded-lg border p-6">
//               <h4 className="font-semibold">Admin Tools</h4>
//               <p className="mt-2 text-gray-600 text-sm">
//                 Manage system settings and internal configurations.
//               </p>
//             </div>

//             <div className="rounded-lg border p-6">
//               <h4 className="font-semibold">Service Hub</h4>
//               <p className="mt-2 text-gray-600 text-sm">
//                 Discover and access all internal services from one place.
//               </p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="border-t bg-gray-100">
//         <div className="mx-auto max-w-6xl px-6 py-6 text-gray-600 text-sm">
//           © {new Date().getFullYear()} Super Portal
//         </div>
//       </footer>
//     </main>
//   );
// }

import {
  ArrowRight,
  BookOpen,
  Download,
  Instagram,
  Linkedin,
  Menu,
  Sparkles,
  Twitter,
  Wand2,
} from "lucide-react";

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Source+Serif+4:ital,wght@1,300;1,400&display=swap');

        body { font-family: 'Poppins', sans-serif; overflow: hidden; height: 100vh; }
        .font-serif-italic { font-family: 'Source Serif 4', serif; font-style: italic; font-weight: 300; }

        .liquid-glass {
          background: rgba(255,255,255,0.01);
          background-blend-mode: luminosity;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
          position: relative;
          overflow: hidden;
        }
        .liquid-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.4px;
          background: linear-gradient(180deg,rgba(255,255,255,0.45) 0%,rgba(255,255,255,0.15) 20%,transparent 40%,transparent 60%,rgba(255,255,255,0.15) 80%,rgba(255,255,255,0.45) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 1;
        }

        .liquid-glass-strong {
          background: rgba(255,255,255,0.01);
          background-blend-mode: luminosity;
          backdrop-filter: blur(50px);
          -webkit-backdrop-filter: blur(50px);
          box-shadow: 4px 4px 4px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.15);
          position: relative;
          overflow: hidden;
        }
        .liquid-glass-strong::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.4px;
          background: linear-gradient(180deg,rgba(255,255,255,0.5) 0%,rgba(255,255,255,0.2) 20%,transparent 40%,transparent 60%,rgba(255,255,255,0.2) 80%,rgba(255,255,255,0.5) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 1;
        }

        .author-line {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
        }
        .author-line::before, .author-line::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.2);
        }
      `}</style>

      {/* Video background */}
      <video
        className="fixed inset-0 z-0 h-full w-full object-cover"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Dark overlay */}
      <div className="fixed inset-0 z-1 bg-black/35" />

      {/* Shell */}
      <div className="relative z-10 flex min-h-screen w-full">
        {/* ── LEFT PANEL ── */}
        <div className="relative flex w-[52%] flex-col p-4">
          <div className="liquid-glass-strong absolute inset-6 z-2 flex flex-col rounded-3xl p-6">
            {/* Nav */}
            <nav className="mb-auto flex shrink-0 items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <Sparkles size={16} className="text-white" />
                </div>
                <span className="font-semibold text-white text-xl tracking-tighter">super</span>
              </div>
              <button
                type="button"
                className="liquid-glass flex cursor-pointer items-center gap-2 rounded-full bg-transparent px-4 py-2 text-white/80 text-xs transition-transform hover:scale-105 active:scale-95"
              >
                <Menu size={14} className="text-white" />
                Menu
              </button>
            </nav>

            {/* Hero center */}
            <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
              {/* Logo mark */}
              <div className="liquid-glass flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                <Sparkles size={36} className="text-white" />
              </div>

              {/* H1 */}
              <h1 className="max-w-[18ch] font-medium text-6xl text-white leading-[1.05] tracking-[-0.05em] lg:text-7xl">
                One Portal. <em className="font-serif-italic text-white/80">Many</em> Internal{" "}
                <em className="font-serif-italic text-white/80">Tools.</em>
              </h1>

              {/* CTA */}
              <a
                href="/auth"
                className="liquid-glass-strong flex cursor-pointer items-center gap-3 rounded-full py-3 pr-6 pl-3 no-underline transition-transform hover:scale-105 active:scale-95"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Download size={13} className="text-white" />
                </span>
                <span className="font-medium text-sm text-white">Access Portal</span>
              </a>

              {/* Pills */}
              <div className="flex flex-wrap justify-center gap-2">
                {["Security Suite", "AI Workflows", "Admin Tools"].map((label) => (
                  <span
                    key={label}
                    className="liquid-glass flex items-center whitespace-nowrap rounded-full px-4 py-1.5 text-white/80 text-xs"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom quote */}
            <div className="flex shrink-0 flex-col gap-2">
              <span className="text-[0.65rem] text-white/50 uppercase tracking-[0.15em]">
                Unified Platform
              </span>
              <p className="font-light text-sm text-white/80 leading-relaxed lg:text-base">
                &ldquo;We imagined a{" "}
                <em className="font-serif-italic">workspace with no boundaries.</em>
                &rdquo;
              </p>
              <div className="author-line">Super Portal</div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="hidden w-[48%] flex-col gap-4 py-6 pr-6 pl-3 lg:flex">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="liquid-glass flex items-center gap-3 rounded-full px-4 py-2">
              {[Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a
                  // biome-ignore lint/suspicious/noArrayIndexKey: <Fix later>
                  key={i}
                  href="./"
                  className="flex text-white transition-colors hover:text-white/70"
                >
                  <Icon size={15} />
                </a>
              ))}
              <div className="h-3.5 w-px bg-white/20" />
              <ArrowRight size={14} className="text-white/60" />
            </div>

            <button
              type="button"
              className="liquid-glass flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-transparent transition-transform hover:scale-105 active:scale-95"
            >
              <Sparkles size={15} className="text-white" />
            </button>
          </div>

          {/* Community card */}
          <div className="liquid-glass flex w-56 flex-col gap-1.5 rounded-2xl px-5 py-4">
            <span className="font-medium text-[0.8rem] text-white">Enter our ecosystem</span>
            <p className="text-[0.7rem] text-white/60 leading-relaxed">
              Connect with teams across every internal application.
            </p>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom feature section */}
          <div className="liquid-glass flex flex-col gap-3 rounded-[2.5rem] p-5">
            {/* Two side-by-side cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Wand2, title: "Processing", desc: "Automated workflows across your apps" },
                { icon: BookOpen, title: "Growth Archive", desc: "Track history and audit logs" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="liquid-glass flex flex-col gap-2 rounded-3xl p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                    <Icon size={15} className="text-white" />
                  </div>
                  <span className="font-medium text-[0.75rem] text-white">{title}</span>
                  <p className="text-[0.65rem] text-white/55 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Bottom card */}
            <div className="liquid-glass flex items-center gap-3.5 rounded-3xl px-4 py-3.5">
              <div className="liquid-glass flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-white/8">
                <Sparkles size={24} className="text-white/30" />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <span className="font-medium text-[0.75rem] text-white">
                  Advanced App Sculpting
                </span>
                <p className="text-[0.65rem] text-white/55 leading-relaxed">
                  Build and configure internal tools with precision.
                </p>
              </div>
              <button
                type="button"
                className="liquid-glass flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent font-light text-white text-xl transition-transform hover:scale-105 active:scale-95"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
