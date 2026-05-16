import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2, Mail, MessageSquare, Sparkles } from "lucide-react";

import { Reveal } from "@/components/home/v2/Reveal";
import { useClickSound } from "@/components/home/v2/useClickSound";

const CONTACT_EMAIL = "mr.jwswain@gmail.com";

type Stage = "idle" | "submitting" | "sent" | "error";

export const Contact: React.FC = () => {
  const [stage, setStage] = useState<Stage>("idle");
  const [form, setForm] = useState({ name: "", email: "", subject: "general", message: "" });
  const [errMsg, setErrMsg] = useState<string>("");
  const click = useClickSound("tick");
  const ding = useClickSound("ding");

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setErrMsg("Name is required.");
      setStage("error");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setErrMsg("Use a valid email address.");
      setStage("error");
      return;
    }
    if (form.message.trim().length < 10) {
      setErrMsg("Tell us a bit more — at least 10 characters.");
      setStage("error");
      return;
    }
    ding();
    setStage("submitting");
    setErrMsg("");

    // Open the user's mail client as the reliable delivery path. We could
    // back this with a /api/contact endpoint later, but mailto avoids spam,
    // captchas, and inbox routing problems on day one.
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nSubject: ${form.subject}\n\n${form.message}`,
    );
    const subject = encodeURIComponent(`[VoiceToWebsite] ${form.subject} — ${form.name}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    // Optimistically show the success state — user can come back if their mail
    // client didn't open.
    window.setTimeout(() => setStage("sent"), 600);
  };

  const subjects = [
    { value: "general", label: "General question" },
    { value: "support", label: "Support / bug" },
    { value: "billing", label: "Billing or refund" },
    { value: "partnership", label: "Partnership / press" },
  ];

  return (
    <>
      <Helmet>
        <title>Contact — VoiceToWebsite</title>
        <meta name="description" content="Get in touch with VoiceToWebsite. Support, billing, partnerships — every inquiry goes straight to a human." />
        <link rel="canonical" href="https://voicetowebsite.com/contact" />
      </Helmet>

      <section className="relative px-5 pt-32 pb-12 sm:px-8 lg:px-12 lg:pt-44 lg:pb-20">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-200 backdrop-blur">
              <Sparkles className="h-3 w-3" /> Talk to a human
            </span>
            <h1 className="mt-7 font-display text-[clamp(2.4rem,5.5vw,4.4rem)] font-black leading-[0.96] tracking-tight">
              Real answers. <span className="bg-gradient-to-r from-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">Same business day.</span>
            </h1>
            <p className="mt-5 text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
              Every message hits an inbox a human reads. Most replies go out within a few hours during US business hours.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="relative px-5 pb-24 sm:px-8 lg:px-12 lg:pb-32">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Sidebar */}
          <Reveal>
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.01] p-7 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-200">
                    <Mail className="h-4 w-4" />
                  </span>
                  <h2 className="font-display text-xl font-black tracking-tight">Email us directly</h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/65">
                  Prefer your own mail client? Send it straight to:
                </p>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  onClick={() => click()}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-white hover:border-cyan-300/40 transition"
                >
                  <Mail className="h-4 w-4 text-cyan-300" /> {CONTACT_EMAIL}
                </a>
              </div>

              <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.01] p-7 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-fuchsia-300/15 text-fuchsia-200">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                  <h2 className="font-display text-xl font-black tracking-tight">Try these first</h2>
                </div>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li><Link to="/faq" className="text-white/75 hover:text-white underline-offset-4 hover:underline">FAQ — answers to most common questions</Link></li>
                  <li><Link to="/pricing" className="text-white/75 hover:text-white underline-offset-4 hover:underline">Pricing — locked at $9.99 / $19.99 / $49.99</Link></li>
                  <li><Link to="/refunds" className="text-white/75 hover:text-white underline-offset-4 hover:underline">Refund policy — exceptions we honor</Link></li>
                  <li><Link to="/examples" className="text-white/75 hover:text-white underline-offset-4 hover:underline">Examples — see what we ship</Link></li>
                </ul>
              </div>

              <div className="rounded-3xl border border-cyan-300/30 bg-cyan-400/5 p-7 backdrop-blur-xl">
                <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-200">Response time</div>
                <h2 className="mt-2 font-display text-xl font-black tracking-tight">Same business day</h2>
                <p className="mt-3 text-sm leading-6 text-white/65">
                  Messages sent before 4pm ET on a weekday usually get a reply by end of day. Weekend messages get answered Monday morning.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Form */}
          <Reveal delay={0.1}>
            <form
              onSubmit={submit}
              className="rounded-3xl border border-white/12 bg-gradient-to-b from-white/[0.07] to-white/[0.01] p-7 backdrop-blur-xl lg:p-10"
            >
              {stage === "sent" ? (
                <div className="flex flex-col items-center text-center">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-cyan-300/15 text-cyan-200">
                    <CheckCircle2 className="h-7 w-7" />
                  </span>
                  <h2 className="mt-5 font-display text-2xl font-black tracking-tight">Message sent</h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/65">
                    Your mail client should have opened with the message pre-filled. If it didn&apos;t, copy this and email us directly:
                  </p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-white hover:border-cyan-300/40 transition"
                  >
                    <Mail className="h-4 w-4 text-cyan-300" /> {CONTACT_EMAIL}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      click();
                      setStage("idle");
                      setForm({ name: "", email: "", subject: "general", message: "" });
                    }}
                    className="mt-6 text-xs text-white/55 hover:text-white underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-black tracking-tight">Send a message</h2>
                  <p className="mt-2 text-sm text-white/55">All fields required. We don&apos;t use this for marketing — only your direct inquiry.</p>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">Name</span>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/12 bg-black/60 px-4 py-3 text-base text-white outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/15 transition"
                        placeholder="Your name"
                        maxLength={120}
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">Email</span>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/12 bg-black/60 px-4 py-3 text-base text-white outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/15 transition"
                        placeholder="you@example.com"
                        maxLength={200}
                      />
                    </label>
                  </div>

                  <label className="mt-5 block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">Subject</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {subjects.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => {
                            click();
                            update("subject", s.value);
                          }}
                          className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                            form.subject === s.value
                              ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                              : "border-white/10 bg-white/5 text-white/65 hover:border-white/25 hover:text-white"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </label>

                  <label className="mt-5 block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">Message</span>
                    <textarea
                      value={form.message}
                      onChange={(e) => update("message", e.target.value)}
                      rows={7}
                      className="mt-2 w-full resize-none rounded-2xl border border-white/12 bg-black/60 px-4 py-3 text-base text-white outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/15 transition"
                      placeholder="Tell us what you need. Order ID, screenshots, links — anything that helps us help you."
                      maxLength={4000}
                    />
                    <div className="mt-1 text-right text-[10px] text-white/35">{form.message.length} / 4000</div>
                  </label>

                  {errMsg && stage === "error" && (
                    <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-3 text-sm text-rose-100">
                      {errMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={stage === "submitting"}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black shadow-[0_18px_60px_-12px_rgba(34,211,238,0.55)] transition hover:-translate-y-[1px] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {stage === "submitting" ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                    ) : (
                      <>Send message <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </>
              )}
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
};
