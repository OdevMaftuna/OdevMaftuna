import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Badge, Notice, card } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { formatSom, loadMyTests, loadPaymentSettings, type TestAnswer, type TestContent, type TestResult, withAudioUrls } from "@/lib/paid-tests";
import { createClient } from "@/lib/supabase/server";
import { testMotivation } from "@/lib/test-motivation";
import { BuyPanel } from "./buy-panel";
import { TestResultView } from "./test-result";
import { TestRunner } from "./test-runner";

export const metadata: Metadata = { title: "Exam test" };

export default async function PaidTestPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireStudent();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const state = (await loadMyTests(profile.id)).find((s) => s.test.id === id);
  if (!state) notFound();
  const { test, purchase, attempt } = state;
  const motto = testMotivation(test.course, test.unit);
  const count = test.kind === "level" && test.course === "Beginner" ? 111 : null;

  const supabase = await createClient();
  let content: TestContent | null = null;
  let review: { answers: TestAnswer[]; result: TestResult } | null = null;
  if (purchase?.status === "approved") {
    const { data } = await supabase.from("paid_test_content").select("content").eq("test_id", id).maybeSingle();
    content = data?.content ? await withAudioUrls(data.content as TestContent) : null;
    if (attempt?.submitted_at) {
      const { data: a } = await supabase
        .from("test_attempts")
        .select("answers, result")
        .eq("purchase_id", purchase.id)
        .maybeSingle();
      if (a?.result) review = { answers: a.answers as TestAnswer[], result: a.result as TestResult };
    }
  }
  const payment = purchase?.status === "approved" ? null : await loadPaymentSettings();

  return (
    <article className="space-y-5">
      <Link href={`/oquvchi/testlar?kurs=${encodeURIComponent(test.course)}`} className="text-sm text-neutral-600 hover:text-neutral-900">
        ← All exam tests
      </Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sun-400">
          {test.kind === "level" ? "Level test · Final exam" : `Unit ${test.unit} · Exam test`}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{test.title}</h1>
        <p className="mt-1 text-sm text-neutral-600">{test.subtitle}</p>
        {motto ? (
          <p className="mt-3 rounded-2xl border border-sun-400/40 bg-sun-50 px-4 py-3 text-sm leading-snug text-sun-700">
            <b className="block">{motto.short}</b>
            {motto.long}
          </p>
        ) : null}
      </header>

      {review && content ? (
        <TestResultView content={content} answers={review.answers} result={review.result} />
      ) : purchase?.status === "approved" && content ? (
        <TestRunner testId={test.id} content={content} />
      ) : purchase?.status === "pending" ? (
        <div className={`${card} space-y-2 p-5 text-center`}>
          <p className="text-3xl">⏳</p>
          <p className="font-semibold">Your payment is being checked</p>
          <p className="text-sm text-neutral-600">
            To‘lovingiz qabul qilindi. O‘qituvchi chekni tasdiqlashi bilan test shu yerda ochiladi — odatda bir necha soat ichida.
          </p>
          <Badge tone="amber">Waiting for confirmation</Badge>
        </div>
      ) : (
        <>
          <div className={`${card} space-y-3 p-5`}>
            <p className="text-sm font-semibold">What you get</p>
            <ul className="space-y-1.5 text-sm">
              <li>✓ {count ? `${count} ta savol — butun kurs bitta imtihonda` : "6–7 bo‘lim, kitobdagi imtihon formatida"}</li>
              <li>✓ Natija darhol — 100 ballik tizimda</li>
              <li>✓ Har bir xatoyingiz va to‘g‘ri javob ko‘rsatiladi</li>
              <li>✓ Natija o‘qituvchingizga ham boradi</li>
            </ul>
            <p className="rounded-xl bg-sun-50 px-3 py-2 text-sm text-sun-700">
              Haqiqiy imtihondan oldin xatolaringizni shu yerda topib oling — sinfda emas! 💪
            </p>
          </div>
          {purchase?.status === "rejected" ? (
            <Notice tone="error">Your last payment was not confirmed. Check the amount and send the receipt again.</Notice>
          ) : null}
          <BuyPanel testId={test.id} userId={profile.id} price={test.price} priceText={formatSom(test.price)} card={payment?.card ?? ""} holder={payment?.holder ?? ""} />
        </>
      )}
    </article>
  );
}
