import type { CSSProperties, ReactNode } from "react";
import { Brand, LogoMark } from "@/components/brand";
import { OWNER_NAME } from "@/components/run-by";

/** Animatsiya kechikishi (ketma-ket paydo bo'lish uchun). */
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/**
 * "Run by Maftuna Ismoilova" — kirish sahifasidagi katta imzo kartochkasi:
 * oltin halqali avatar, ism va lavozim.
 */
function OwnerCard() {
  return (
    <div lang="en" className="owner-card relative flex w-fit items-center gap-3 rounded-2xl p-2.5 pr-5">
      <span aria-hidden className="owner-ring relative grid size-12 shrink-0 place-items-center rounded-full">
        <span className="grid size-[42px] place-items-center rounded-full text-sm font-bold tracking-wide" style={{ backgroundColor: "#1d1608", color: "#F5C76A" }}>
          MI
        </span>
      </span>
      <span className="leading-tight">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">Run by</span>
        <span className="mt-0.5 block text-[15px] font-bold" style={{ color: "#F5C76A" }}>
          {OWNER_NAME}
        </span>
        <span className="mt-0.5 block text-xs text-white/60">English teacher · NSP Language Center</span>
      </span>
      <span aria-hidden className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full text-[10px]" style={{ backgroundColor: "#F1A93B", color: "#1d1608" }}>
        ✦
      </span>
    </div>
  );
}

/** Orbitadagi logo — namunadagi "globus" o'rniga: aylana, oltin orbita va suzib yurgan kartochkalar. */
function OrbitArt() {
  return (
    <div aria-hidden className="relative mx-auto mt-6 hidden aspect-square w-[300px] select-none lg:block xl:w-[330px]">
      <div className="orbit-globe absolute inset-[12%] rounded-full" />
      <svg viewBox="0 0 400 160" className="absolute inset-x-[-8%] top-1/2 w-[116%] -translate-y-1/2 -rotate-[14deg] overflow-visible">
        <ellipse cx="200" cy="80" rx="196" ry="74" fill="none" stroke="#f1a93b" strokeOpacity="0.75" strokeWidth="2" />
        <circle r="7" fill="#f5c76a" className="orbit-runner">
          <animateMotion dur="7s" repeatCount="indefinite" path="M4,80 a196,74 0 1,0 392,0 a196,74 0 1,0 -392,0" />
        </circle>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="anim-float">
          <LogoMark size={104} tone="light" className="anim-glow" />
        </div>
      </div>
      {/* Suzib yurgan kartochkalar */}
      <div className="float-y chip absolute -left-4 top-[14%]" style={delay(0)}>
        <span className="text-[#8fe3bc]">✓</span> She <b>goes</b> to school
      </div>
      <div className="float-y chip absolute -right-6 top-[30%]" style={{ animationDelay: "1.2s" }}>
        🏆 <b style={{ color: "#F5C76A" }}>92</b>/100
      </div>
      <div className="float-y chip absolute bottom-[10%] left-[8%]" style={{ animationDelay: "2.1s" }}>
        🔥 7-day streak
      </div>
    </div>
  );
}

/**
 * Kirish va parol sahifalari. Namuna: sayohat ilovasi dizayni — chapda "onboarding" ekrani
 * (ajratilgan so'zli sarlavha, orbita, dumaloq strelka), o'ngda egri rangli sarlavhali kirish kartasi,
 * orqada katta yashil yarim doira va oltin nuqtalar. Telefonda: sarlavha → karta → imzo.
 */
export function AuthShell({
  title,
  description,
  greeting = "Hi, welcome back! 👋",
  children,
}: {
  title: string;
  description: string;
  greeting?: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-stage relative isolate flex min-h-dvh flex-1 items-center justify-center overflow-hidden px-4 py-6 sm:py-10 lg:px-10">
      {/* Bezaklar: katta yarim doira, oltin nuqtalar, xira nurlar */}
      <div aria-hidden className="auth-arc" />
      <span aria-hidden className="auth-dot auth-dot-a" />
      <span aria-hidden className="auth-dot auth-dot-b" />
      <span aria-hidden className="auth-dot auth-dot-c" />
      <div aria-hidden className="aurora aurora-gold -right-24 -top-24" />

      <div className="auth-grid relative w-full max-w-5xl">
        {/* 1. Sarlavha (onboarding ekrani) */}
        <section className="auth-top anim-rise" style={delay(0)}>
          <Brand size={40} tone="light" subtitle="Language Center" />
          <h2 lang="en" className="mt-6 text-[1.75rem] font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:mt-8 lg:text-[2.6rem]">
            Let’s speak English
            <br />
            with <span className="auth-highlight">confidence</span>!
          </h2>
          <p lang="en" className="mt-3 max-w-md text-sm leading-relaxed text-white/65 lg:text-base">
            Daily lessons, instant AI feedback on every mistake, and exam tests that show your real level.
          </p>
        </section>

        {/* 2. Kirish kartasi (Sign In ekrani) */}
        <main className="auth-card-area anim-rise" style={delay(150)}>
          <div className="auth-card overflow-hidden rounded-[28px]">
            <header className="auth-card-head relative overflow-hidden px-6 pb-12 pt-9 text-center text-white">
              <span aria-hidden className="absolute -left-10 -top-12 size-36 rounded-full border-[18px] border-white/[0.06]" />
              <span aria-hidden className="absolute -bottom-16 -right-8 size-40 rounded-full border-[22px] border-white/[0.05]" />
              <div className="relative mx-auto w-fit">
                <LogoMark size={46} tone="light" />
              </div>
              <h1 className="relative mt-3 text-[1.7rem] font-bold tracking-tight">{title}</h1>
              <p className="relative mt-1 text-sm text-white/75">{greeting}</p>
            </header>
            <div className="relative -mt-6 rounded-t-[26px] px-5 pb-6 pt-6 sm:px-7" style={{ backgroundColor: "var(--color-surface)" }}>
              <p className="mb-5 text-center text-sm text-neutral-500">{description}</p>
              {children}
            </div>
          </div>
        </main>

        {/* 3. Orbita va imzo */}
        <section className="auth-bottom anim-rise" style={delay(300)}>
          <OrbitArt />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 lg:mt-8 lg:justify-between">
            <OwnerCard />
            {/* Namunadagi "swipe right to start" — dumaloq strelka (bezak) */}
            <div aria-hidden className="hidden items-center gap-3 lg:flex">
              <span className="flex gap-1.5">
                <span className="size-1.5 rounded-full bg-white/25" />
                <span className="h-1.5 w-5 rounded-full" style={{ backgroundColor: "#F1A93B" }} />
                <span className="size-1.5 rounded-full bg-white/25" />
              </span>
              <span className="arrow-ring grid size-12 place-items-center rounded-full">
                <span className="grid size-9 place-items-center rounded-full text-lg font-bold" style={{ backgroundColor: "#F1A93B", color: "#1d1608" }}>
                  →
                </span>
              </span>
            </div>
          </div>
          <p lang="en" className="mt-4 text-center text-xs text-white/40 lg:text-left">© NSP Language Center</p>
        </section>
      </div>
    </div>
  );
}
