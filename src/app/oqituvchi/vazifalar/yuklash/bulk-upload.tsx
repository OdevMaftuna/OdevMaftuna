"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { bulkCreateAssignments } from "@/app/actions/assignments";
import { Notice, btn, card } from "@/components/ui";
import { downloadWorkbook, readSheet } from "@/lib/excel";
import { SUBMISSION_TYPE_LABELS, type SubmissionType } from "@/lib/types";
import {
  ASSIGNMENT_COLUMNS,
  MAX_BULK_ASSIGNMENTS,
  assignmentSchema,
  issueMessages,
  normalizeAssignmentRow,
  type AssignmentInput,
} from "@/lib/validation";

type PreviewRow = {
  rowNumber: number;
  raw: ReturnType<typeof normalizeAssignmentRow>;
  /** Fayldagi asl sana kataklari — xato bo'lsa nima yozilganini ko'rsatish uchun. */
  rawPublish: string;
  rawDue: string;
  data: AssignmentInput | null;
  errors: string[];
};

async function downloadTemplate() {
  await downloadWorkbook("vazifalar-namuna.xlsx", [
    {
      name: "Vazifalar",
      widths: [28, 50, 16, 40, 10, 18, 18, 13, 20],
      rows: [
        [...ASSIGNMENT_COLUMNS],
        [
          "My daily routine",
          "Write 8-10 sentences about your daily routine. Use Present Simple.",
          "text",
          "Grammar 40, vocabulary 30, content 30",
          100,
          "2026-12-01 08:00",
          "2026-12-01 21:00",
          false,
          0,
        ],
        [
          "Workbook page 24",
          "Do exercises 1-3 in your notebook and upload a photo.",
          "image",
          "Each exercise 10 points",
          30,
          "2026-12-02 08:00",
          "2026-12-03 21:00",
          true,
          20,
        ],
      ],
    },
    {
      name: "Yo‘riqnoma",
      widths: [24, 90],
      rows: [
        ["Ustun", "Izoh"],
        ["title", "Vazifa sarlavhasi (majburiy, 200 belgigacha)."],
        ["instructions", "O‘quvchi ko‘radigan ko‘rsatma."],
        ["submission_type", "text (matn), image (rasm) yoki both (matn va rasm). Bo‘sh bo‘lsa: text."],
        ["rubric", "Baholash mezonlari. Sun’iy intellekt shu bo‘yicha ball qo‘yadi."],
        ["max_score", "Maksimal ball, 1–1000. Bo‘sh bo‘lsa: 100."],
        ["publish_at", "E’lon vaqti, Toshkent vaqti bilan. Ko‘rinishi: 2026-12-01 08:00 yoki 01.12.2026 08:00."],
        ["due_at", "Topshirish muddati, xuddi shu ko‘rinishda. E’lon vaqtidan keyin bo‘lishi kerak."],
        ["late_allowed", "Kech topshirishga ruxsat: true yoki false. Bo‘sh bo‘lsa: false."],
        ["late_penalty_percent", "Kech topshirish jarimasi, 0–100 (foiz). Bo‘sh bo‘lsa: 0."],
        ["", ""],
        ["Eslatma", "Birinchi qatordagi ustun nomlarini o‘zgartirmang. Namuna qatorlarini o‘chirib, o‘zingiznikini yozing."],
      ],
    },
  ]);
}

const display = (local: string) => local.replace("T", " ");

export function BulkUpload({
  courses,
  initialCourseId,
}: {
  courses: { id: string; name: string }[];
  initialCourseId: string;
}) {
  const [courseId, setCourseId] = useState(initialCourseId);
  const courseName = courses.find((c) => c.id === courseId)?.name ?? "";
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const onFile = async (file: File | undefined) => {
    setRows([]);
    setFileError(null);
    setResult(null);
    setFileName(file?.name ?? "");
    if (!file) return;
    try {
      const sheet = await readSheet(file);
      const missing = ["title", "publish_at", "due_at"].filter(
        (column) => !sheet.headers.includes(column),
      );
      if (missing.length > 0) {
        setFileError(
          `Faylda quyidagi ustun(lar) topilmadi: ${missing.join(", ")}. Birinchi qatorda ustun nomlari namunadagidek bo‘lishi kerak.`,
        );
        return;
      }
      if (sheet.rows.length === 0) {
        setFileError("Faylda sarlavhadan boshqa qator yo‘q.");
        return;
      }
      if (sheet.rows.length > MAX_BULK_ASSIGNMENTS) {
        setFileError(
          `Faylda ${sheet.rows.length} ta qator bor. Bir martada ko‘pi bilan ${MAX_BULK_ASSIGNMENTS} ta yuklash mumkin.`,
        );
        return;
      }
      setRows(
        sheet.rows.map(({ rowNumber, cells }) => {
          const raw = normalizeAssignmentRow(cells);
          const parsed = assignmentSchema.safeParse(raw);
          return {
            rowNumber,
            raw,
            rawPublish: String(cells.publish_at ?? ""),
            rawDue: String(cells.due_at ?? ""),
            data: parsed.success ? parsed.data : null,
            errors: parsed.success ? [] : issueMessages(parsed.error),
          };
        }),
      );
    } catch (e) {
      setFileError(
        e instanceof Error && e.message
          ? e.message
          : "Faylni o‘qib bo‘lmadi. .xlsx yoki .csv fayl tanlang.",
      );
    }
  };

  const invalidCount = rows.filter((r) => r.data === null).length;
  const validRows = rows.flatMap((r) => (r.data ? [r.data] : []));
  const canUpload = rows.length > 0 && invalidCount === 0 && !pending && courseId !== "";

  const upload = () => {
    setResult(null);
    startTransition(async () => {
      const response = await bulkCreateAssignments(courseId, validRows);
      if (response.ok) {
        setResult({ ok: true, message: `${courseName} kursiga ${response.count} ta vazifa qo‘shildi.` });
        setRows([]);
        setFileName("");
      } else {
        setResult({ ok: false, message: response.error });
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className={`${card} space-y-4 p-5`}>
        <label className="block">
          <span className="mb-1.5 block text-sm text-neutral-700">
            1. Vazifalar qaysi kurs uchun?
          </span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="block h-12 w-full max-w-xs rounded-xl border border-neutral-300 bg-surface px-3.5 text-base outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-700/15"
          >
            <option value="" disabled>
              Kursni tanlang
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
          <p className="text-sm text-neutral-700">
            2. Namuna faylni yuklab oling va vazifalarni shu ko‘rinishda yozing.
          </p>
          <button type="button" onClick={downloadTemplate} className={btn.secondary}>
            Namuna faylni yuklab olish
          </button>
        </div>
        <div className="border-t border-neutral-200 pt-4">
          <p className="mb-2 text-sm text-neutral-700">
            3. To‘ldirilgan faylni tanlang (.xlsx yoki .csv).
          </p>
          <label className={`${btn.primary} cursor-pointer`}>
            Fayl tanlash
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {fileName ? (
            <span className="ml-3 text-sm text-neutral-600">{fileName}</span>
          ) : null}
        </div>
      </div>

      {fileError ? <Notice tone="error">{fileError}</Notice> : null}

      {result ? (
        <Notice tone={result.ok ? "success" : "error"}>
          {result.message}{" "}
          {result.ok ? (
            <Link href={`/oqituvchi/vazifalar?kurs=${courseId}`} className="font-semibold underline">
              Vazifalar ro‘yxatini ochish
            </Link>
          ) : null}
        </Notice>
      ) : null}

      {rows.length > 0 ? (
        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
            <p className="text-sm">
              <span className="font-semibold">{rows.length} ta qator</span>
              {" · "}
              <span className="text-emerald-700">{rows.length - invalidCount} ta to‘g‘ri</span>
              {invalidCount > 0 ? (
                <>
                  {" · "}
                  <span className="font-semibold text-red-700">{invalidCount} ta xato</span>
                </>
              ) : null}
            </p>
            <button type="button" onClick={upload} disabled={!canUpload} className={btn.primary}>
              {pending ? "Yuklanmoqda…" : courseId ? `${courseName}: ${rows.length} ta vazifani yuklash` : "Avval kursni tanlang"}
            </button>
          </div>
          {invalidCount > 0 ? (
            <p className="border-b border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              Qizil qatorlarda xato bor. Ularni faylda tuzatib, faylni qayta tanlang.
              Xatolar tuzatilmaguncha hech narsa yuklanmaydi.
            </p>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs text-neutral-500">
                <tr className="border-b border-neutral-200">
                  <th className="px-3 py-2 font-medium">Qator</th>
                  <th className="px-3 py-2 font-medium">Sarlavha</th>
                  <th className="px-3 py-2 font-medium">Turi</th>
                  <th className="px-3 py-2 font-medium">Ball</th>
                  <th className="px-3 py-2 font-medium">E’lon vaqti</th>
                  <th className="px-3 py-2 font-medium">Muddat</th>
                  <th className="px-3 py-2 font-medium">Kech topshirish</th>
                  <th className="px-3 py-2 font-medium">Holat</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const bad = row.data === null;
                  const type = String(row.raw.submission_type);
                  return (
                    <tr
                      key={row.rowNumber}
                      className={`border-b border-neutral-100 align-top last:border-0 ${bad ? "bg-red-50" : ""}`}
                    >
                      <td className="px-3 py-2 tabular-nums text-neutral-500">{row.rowNumber}</td>
                      <td className="max-w-64 px-3 py-2">
                        <p className="truncate font-medium">{row.raw.title || "—"}</p>
                        <p className="truncate text-xs text-neutral-500">{row.raw.instructions}</p>
                      </td>
                      <td className="px-3 py-2">
                        {SUBMISSION_TYPE_LABELS[type as SubmissionType] ?? type}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{String(row.raw.max_score)}</td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                        {row.raw.publish_at ? display(row.raw.publish_at) : row.rawPublish || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                        {row.raw.due_at ? display(row.raw.due_at) : row.rawDue || "—"}
                      </td>
                      <td className="px-3 py-2">
                        {row.raw.late_allowed === true
                          ? `Ha, −${String(row.raw.late_penalty_percent)}%`
                          : row.raw.late_allowed === false
                            ? "Yo‘q"
                            : String(row.raw.late_allowed)}
                      </td>
                      <td className="px-3 py-2">
                        {bad ? (
                          <ul className="space-y-0.5 font-medium text-red-700">
                            {row.errors.map((message) => (
                              <li key={message}>{message}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-emerald-700">To‘g‘ri</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
