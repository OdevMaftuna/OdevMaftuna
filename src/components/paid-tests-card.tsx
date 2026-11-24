import Link from "next/link";
import { TestCover } from "@/components/test-cover";

/**
 * Kurs sahifasidagi "Pullik imtihon testlari" bo'limi — boshqa bo'limlardan ajralib turadigan,
 * e'tiborni tortadigan karta (oltin chegara, biletlar to'plami, narx).
 */
export function PaidTestsCard({
  href,
  title,
  text,
  meta,
  cta,
  badge = "YANGI",
  course = "Beginner",
}: {
  href: string;
  title: string;
  text: string;
  meta: string;
  cta: string;
  badge?: string;
  course?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-36 overflow-hidden rounded-2xl border-2 border-sun-400/60 p-4 shadow-[0_0_0_1px_rgb(241_169_59/0.15),0_10px_30px_-12px_rgb(241_169_59/0.45)] transition hover:-translate-y-0.5 hover:border-sun-400"
      style={{ background: "radial-gradient(120% 160% at 0% 0%, #3b2a08 0%, #17120a 45%, #0d2a21 100%)" }}
    >
      <span aria-hidden className="pointer-events-none absolute -left-8 -top-8 size-32 rounded-full bg-[#F5C76A]/15 blur-2xl" />
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col pr-28 sm:pr-72">
        <div className="flex items-center gap-2">
          <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F5C76A]/15 text-xl">🏆</span>
          <span className="rounded-full bg-[#F5C76A] px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-[#1d1608]">{badge}</span>
        </div>
        <p className="mt-2 text-lg font-bold leading-tight text-white">{title}</p>
        <p className="mt-0.5 text-sm leading-snug text-white/70">{text}</p>
        <p className="mt-1.5 text-xs font-semibold" style={{ color: "#F5C76A" }}>{meta}</p>
        <span className="mt-2 w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-[#17120a] transition group-hover:translate-x-0.5">
          {cta} →
        </span>
      </div>
      <div aria-hidden className="absolute -right-2 bottom-3 flex items-end">
        <TestCover unit={5} course={course} title="" size={9} className="hidden w-[78px] -rotate-6 translate-x-6 sm:block" />
        <TestCover unit={2} course={course} title="" size={9} className="w-[58px] rotate-3 translate-x-3 sm:w-[84px]" />
        {course === "Beginner" ? (
          <TestCover unit={null} level title="" size={11} className="w-[78px] -rotate-3 sm:w-[104px]" />
        ) : (
          <TestCover unit={8} course={course} title="" size={11} className="w-[78px] -rotate-3 sm:w-[104px]" />
        )}
      </div>
    </Link>
  );
}
