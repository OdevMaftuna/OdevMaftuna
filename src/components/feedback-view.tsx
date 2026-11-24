import { Badge } from "@/components/ui";
import {
  MISTAKE_TYPE_LABELS,
  storedFeedbackSchema,
  type StoredFeedback,
} from "@/lib/ai/feedback";

/** Bazadagi ai_feedback (jsonb) ni xavfsiz o'qiydi; shakli buzilgan bo'lsa null. */
export function parseFeedback(value: unknown): StoredFeedback | null {
  const parsed = storedFeedbackSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-neutral-700">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** AI fikr-mulohazasi: xulosa, xatolar (asl → to'g'risi → izoh), kuchli tomonlar, tavsiyalar. */
export function FeedbackView({ feedback }: { feedback: StoredFeedback }) {
  return (
    <div className="space-y-5">
      <p className="leading-relaxed">{feedback.summary}</p>

      <div>
        <h3 className="text-sm font-semibold">
          Xatolar{" "}
          <span className="font-normal text-neutral-500">
            ({feedback.mistakes.length})
          </span>
        </h3>
        {feedback.mistakes.length === 0 ? (
          <p className="mt-1.5 text-sm text-emerald-700">Xato topilmadi. Barakalla!</p>
        ) : (
          <ol className="mt-2 space-y-2.5">
            {feedback.mistakes.map((mistake, index) => (
              <li key={index} className="rounded-xl border border-neutral-200 p-3">
                <div className="mb-1.5">
                  <Badge>{MISTAKE_TYPE_LABELS[mistake.type]}</Badge>
                </div>
                <p lang="en" className="text-sm text-red-700 line-through decoration-red-300">
                  {mistake.original}
                </p>
                <p lang="en" className="mt-0.5 font-medium text-emerald-700">
                  {mistake.correction}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                  {mistake.explanation}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <BulletList title="Yaxshi chiqqan joylar" items={feedback.strengths} />
      <BulletList title="Tavsiyalar" items={feedback.suggestions} />
    </div>
  );
}
