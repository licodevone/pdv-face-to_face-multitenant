const normalizeHeader = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();

const countDelimiterOccurrences = (line: string, delimiter: string) =>
  [...line].filter((character) => character === delimiter).length;

const detectDelimiter = (text: string) => {
  const firstContentLine =
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "";

  const delimiterCandidates = [",", ";", "\t"] as const;

  return delimiterCandidates.reduce(
    (selectedDelimiter, candidate) =>
      countDelimiterOccurrences(firstContentLine, candidate) >
      countDelimiterOccurrences(firstContentLine, selectedDelimiter)
        ? candidate
        : selectedDelimiter,
    ",",
  );
};

const splitCsvTable = (text: string, delimiter: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let isInsideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === '"') {
      if (isInsideQuotes && text[index + 1] === '"') {
        currentCell += '"';
        index += 1;
        continue;
      }

      isInsideQuotes = !isInsideQuotes;
      continue;
    }

    if (!isInsideQuotes && character === delimiter) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if (!isInsideQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }

      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += character;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
};

const parseLocaleNumber = (value: string) => {
  const normalizedValue = value.trim().replace(/\s/g, "");

  if (!normalizedValue) {
    return 0;
  }

  const lastCommaIndex = normalizedValue.lastIndexOf(",");
  const lastDotIndex = normalizedValue.lastIndexOf(".");
  const hasComma = lastCommaIndex >= 0;
  const hasDot = lastDotIndex >= 0;

  if (hasComma && hasDot) {
    const decimalSeparator = lastCommaIndex > lastDotIndex ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    const parsedValue = Number(
      normalizedValue.replaceAll(thousandsSeparator, "").replace(decimalSeparator, "."),
    );
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  const separator = hasComma ? "," : hasDot ? "." : "";

  if (!separator) {
    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  const separatorOccurrences = normalizedValue.split(separator).length - 1;
  const fractionalLength = normalizedValue.length - normalizedValue.lastIndexOf(separator) - 1;

  if (separatorOccurrences > 1 || fractionalLength === 3) {
    const parsedValue = Number(normalizedValue.replaceAll(separator, ""));
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  const parsedValue = Number(normalizedValue.replace(separator, "."));
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

export interface ParsedCsvRow {
  rowNumber: number;
  values: Record<string, string>;
}

export const parseCsvText = (text: string): ParsedCsvRow[] => {
  const sanitizedText = text.replace(/^\uFEFF/, "").trim();

  if (!sanitizedText) {
    return [];
  }

  const delimiter = detectDelimiter(sanitizedText);
  const [headerRow = [], ...dataRows] = splitCsvTable(sanitizedText, delimiter);
  const normalizedHeaders = headerRow.map((header) => normalizeHeader(header));

  return dataRows
    .map((row, index) => {
      const values = normalizedHeaders.reduce<Record<string, string>>((accumulator, header, cellIndex) => {
        if (!header) {
          return accumulator;
        }

        accumulator[header] = row[cellIndex]?.trim() ?? "";
        return accumulator;
      }, {});

      return {
        rowNumber: index + 2,
        values,
      };
    })
    .filter((row) => Object.values(row.values).some((value) => value.trim().length > 0));
};

export const getCsvValue = (row: ParsedCsvRow, aliases: string[]) => {
  for (const alias of aliases) {
    const value = row.values[normalizeHeader(alias)];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

export const parseCsvNumber = (value: string) => parseLocaleNumber(value);

export const parseCsvMoneyToCents = (value: string) => Math.round(parseLocaleNumber(value) * 100);
