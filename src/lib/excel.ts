/**
 * Brauzerda Excel/CSV o'qish va yozish (SheetJS).
 * Kutubxona faqat kerak bo'lganda yuklanadi (dynamic import).
 */

export type SheetRow = {
  /** Fayldagi qator raqami (sarlavha 1-qator). */
  rowNumber: number;
  cells: Record<string, unknown>;
};

export type ParsedSheet = {
  headers: string[];
  rows: SheetRow[];
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** Birinchi varaqni o'qiydi: 1-qator sarlavha, bo'sh qatorlar tashlab ketiladi. */
export async function readSheet(file: File): Promise<ParsedSheet> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Fayl juda katta (5 MB dan oshmasin).");
  }
  const XLSX = await import("xlsx");
  const isCsv = /\.(csv|txt)$/i.test(file.name);
  // CSV UTF-8 matn sifatida o'qiladi va kataklar o'zgartirilmaydi (raw),
  // aks holda sanalar va o'zbekcha harflar buzilishi mumkin.
  const workbook = isCsv
    ? XLSX.read(await file.text(), { type: "string", raw: true })
    : XLSX.read(await file.arrayBuffer(), { type: "array" });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("Faylda varaq topilmadi.");

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: "",
    blankrows: false,
  });
  if (matrix.length === 0) throw new Error("Fayl bo‘sh.");

  const headers = (matrix[0] as unknown[]).map((h) =>
    String(h ?? "").trim().toLowerCase(),
  );

  const rows: SheetRow[] = [];
  for (let i = 1; i < matrix.length; i++) {
    const line = matrix[i] as unknown[];
    if (line.every((cell) => String(cell ?? "").trim() === "")) continue;
    const cells: Record<string, unknown> = {};
    headers.forEach((header, col) => {
      if (header) cells[header] = line[col] ?? "";
    });
    rows.push({ rowNumber: i + 1, cells });
  }
  return { headers, rows };
}

/** Bir yoki bir nechta varaqli .xlsx faylni yuklab beradi. */
export async function downloadWorkbook(
  fileName: string,
  sheets: { name: string; rows: (string | number | boolean)[][]; widths?: number[] }[],
) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  for (const { name, rows, widths } of sheets) {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    if (widths) sheet["!cols"] = widths.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }
  XLSX.writeFile(workbook, fileName);
}
