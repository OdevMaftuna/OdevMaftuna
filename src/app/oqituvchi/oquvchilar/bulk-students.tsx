"use client";

import { useState, useTransition } from "react";
import { bulkCreateStudents, type CreatedStudent } from "@/app/actions/students";
import { Notice, btn } from "@/components/ui";
import { downloadWorkbook, readSheet } from "@/lib/excel";
import {
  MAX_BULK_STUDENTS,
  STUDENT_COLUMNS,
  issueMessages,
  studentSchema,
  type StudentInput,
} from "@/lib/validation";

type PreviewRow = {
  rowNumber: number;
  full_name: string;
  email: string;
  data: StudentInput | null;
  errors: string[];
};

const downloadTemplate = () =>
  downloadWorkbook("oquvchilar-namuna.xlsx", [
    {
      name: "O‘quvchilar",
      widths: [30, 34],
      rows: [
        [...STUDENT_COLUMNS],
        ["Ali Valiyev", "ali.valiyev@example.com"],
        ["Madina Karimova", "madina.karimova@example.com"],
      ],
    },
  ]);

export function BulkStudents({
  courses,
  initialCourseId,
  teachers,
  initialTeacherId,
}: {
  courses: { id: string; name: string }[];
  initialCourseId: string;
  teachers: { id: string; name: string }[];
  initialTeacherId: string;
}) {
  const [courseId, setCourseId] = useState(initialCourseId);
  const [teacherId, setTeacherId] = useState(initialTeacherId);
  const courseName = courses.find((c) => c.id === courseId)?.name ?? "";
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [results, setResults] = useState<CreatedStudent[] | null>(null);
  const [pending, startTransition] = useTransition();

  const onFile = async (file: File | undefined) => {
    setRows([]);
    setFileError(null);
    setResults(null);
    if (!file) return;
    try {
      const sheet = await readSheet(file);
      const missing = STUDENT_COLUMNS.filter((c) => !sheet.headers.includes(c));
      if (missing.length > 0) {
        setFileError(
          `Faylda quyidagi ustun(lar) topilmadi: ${missing.join(", ")}. Birinchi qatorda full_name va email bo‘lishi kerak.`,
        );
        return;
      }
      if (sheet.rows.length === 0) {
        setFileError("Faylda sarlavhadan boshqa qator yo‘q.");
        return;
      }
      if (sheet.rows.length > MAX_BULK_STUDENTS) {
        setFileError(`Bir martada ko‘pi bilan ${MAX_BULK_STUDENTS} ta o‘quvchi qo‘shish mumkin.`);
        return;
      }
      const seen = new Set<string>();
      setRows(
        sheet.rows.map(({ rowNumber, cells }) => {
          const raw = {
            full_name: String(cells.full_name ?? "").trim(),
            email: String(cells.email ?? "").trim(),
          };
          const parsed = studentSchema.safeParse(raw);
          const errors = parsed.success ? [] : issueMessages(parsed.error);
          if (parsed.success) {
            if (seen.has(parsed.data.email)) errors.push("Bu e-pochta faylda takrorlangan");
            seen.add(parsed.data.email);
          }
          return {
            rowNumber,
            ...raw,
            data: errors.length === 0 && parsed.success ? parsed.data : null,
            errors,
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

  const submit = () => {
    startTransition(async () => {
      const response = await bulkCreateStudents(courseId, validRows, teacherId);
      if (response.ok) {
        setResults(response.results);
        setRows([]);
      } else {
        setFileError(response.error);
      }
    });
  };

  const downloadResults = () =>
    results &&
    downloadWorkbook("oquvchilar-parollari.xlsx", [
      {
        name: "Parollar",
        widths: [30, 34, 22, 34],
        rows: [
          ["Ism familiya", "E-pochta", "Vaqtinchalik parol", "Izoh"],
          ...results.map((r) => [r.full_name, r.email, r.password ?? "", r.error ?? ""]),
        ],
      },
    ]);

  const createdCount = results?.filter((r) => r.password).length ?? 0;

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Kurs</span>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="block h-12 w-full rounded-xl border border-neutral-300 bg-surface px-3.5 text-base outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-700/15"
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
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">O‘qituvchi (guruh)</span>
        <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="block h-12 w-full rounded-xl border border-neutral-300 bg-surface px-3.5 text-base outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-700/15">
          <option value="">Guruhsiz</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-neutral-600">
        Faylda ikkita ustun bo‘lsin: <code className="font-mono">full_name</code> va{" "}
        <code className="font-mono">email</code>.
      </p>
      <div className="flex flex-wrap gap-2">
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
        <button type="button" onClick={downloadTemplate} className={btn.secondary}>
          Namuna fayl
        </button>
      </div>

      {fileError ? <Notice tone="error">{fileError}</Notice> : null}

      {rows.length > 0 ? (
        <div className="rounded-xl border border-neutral-200">
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface text-xs text-neutral-500">
                <tr className="border-b border-neutral-200">
                  <th className="px-3 py-2 font-medium">Qator</th>
                  <th className="px-3 py-2 font-medium">Ism familiya</th>
                  <th className="px-3 py-2 font-medium">E-pochta</th>
                  <th className="px-3 py-2 font-medium">Holat</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={`border-b border-neutral-100 last:border-0 ${row.data ? "" : "bg-red-50"}`}
                  >
                    <td className="px-3 py-2 tabular-nums text-neutral-500">{row.rowNumber}</td>
                    <td className="px-3 py-2">{row.full_name || "—"}</td>
                    <td className="break-all px-3 py-2">{row.email || "—"}</td>
                    <td className="px-3 py-2">
                      {row.data ? (
                        <span className="text-emerald-700">To‘g‘ri</span>
                      ) : (
                        <span className="font-medium text-red-700">{row.errors.join(". ")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 px-3 py-3">
            <p className="text-sm">
              {invalidCount > 0 ? (
                <span className="text-red-700">
                  {invalidCount} ta qatorda xato bor. Faylda tuzatib, qayta tanlang.
                </span>
              ) : (
                <span className="text-emerald-700">Hamma qator to‘g‘ri.</span>
              )}
            </p>
            <button
              type="button"
              onClick={submit}
              disabled={pending || invalidCount > 0 || courseId === ""}
              className={btn.primary}
            >
              {pending ? "Qo‘shilmoqda…" : courseId ? `${courseName}: ${rows.length} ta o‘quvchini qo‘shish` : "Avval kursni tanlang"}
            </button>
          </div>
        </div>
      ) : null}

      {results ? (
        <div className="space-y-3">
          <Notice tone={createdCount === results.length ? "success" : "info"}>
            <p className="font-semibold">
              {createdCount} ta hisob ochildi
              {createdCount < results.length
                ? `, ${results.length - createdCount} tasi ochilmadi`
                : ""}
              .
            </p>
            <p className="mt-1 text-xs">
              Parollar faqat hozir ko‘rsatiladi. Faylni yuklab oling yoki yozib oling.
            </p>
          </Notice>
          <div className="max-h-72 overflow-auto rounded-xl border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface text-xs text-neutral-500">
                <tr className="border-b border-neutral-200">
                  <th className="px-3 py-2 font-medium">Ism familiya</th>
                  <th className="px-3 py-2 font-medium">E-pochta</th>
                  <th className="px-3 py-2 font-medium">Vaqtinchalik parol</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.email} className={`border-b border-neutral-100 last:border-0 ${r.error ? "bg-red-50" : ""}`}>
                    <td className="px-3 py-2">{r.full_name}</td>
                    <td className="break-all px-3 py-2">{r.email}</td>
                    <td className="px-3 py-2">
                      {r.password ? (
                        <span className="font-mono font-semibold">{r.password}</span>
                      ) : (
                        <span className="font-medium text-red-700">{r.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={downloadResults} className={btn.secondary}>
            Parollar ro‘yxatini Excel qilib yuklab olish
          </button>
        </div>
      ) : null}
    </div>
  );
}
