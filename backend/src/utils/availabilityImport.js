import readXlsxFile from "read-excel-file/node";
import slugify from "slugify";

const columnAliases = {
  resortName: ["resort", "resort name", "resort_name", "property", "hotel"],
  resortSlug: ["resort slug", "resort_slug", "slug"],
  roomCategory: ["room", "room name", "room category", "room_category", "category", "room type", "room_type"],
  date: ["date", "checkin", "check-in", "check in", "check-in date", "check in date", "available date"],
  availableRooms: ["available", "available rooms", "available_rooms", "rooms available", "rooms left", "rooms", "stock", "inventory", "count", "qty", "quantity", "no of rooms"],
  status: ["status", "availability"],
  price: ["price", "rate", "amount", "tariff", "cost"],
  note: ["note", "notes", "remarks", "comment", "comments"]
};

function normalizeKey(key) {
  return String(key || "").trim().toLowerCase();
}

function readCell(row, field) {
  const aliases = columnAliases[field];
  const key = Object.keys(row).find((item) => aliases.includes(normalizeKey(item)));
  return key ? row[key] : "";
}

function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const raw = String(value).trim();
  const dateParts = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);

  if (dateParts) {
    const [, first, second, yearPart] = dateParts;
    const year = yearPart.length === 2 ? `20${yearPart}` : yearPart;
    const dayFirst = Number(first) > 12;
    const monthFirst = Number(second) > 12;
    const day = dayFirst || !monthFirst ? first : second;
    const month = dayFirst || !monthFirst ? second : first;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeNumber(value, fallback = 0) {
  if (typeof value === "number") return value;
  const normalized = String(value || "").replace(/,/g, "").match(/-?\d+(\.\d+)?/)?.[0];
  const number = Number(normalized);
  return Number.isNaN(number) ? fallback : number;
}

function normalizeStatus(rawStatus, availableRooms) {
  const status = String(rawStatus || "").trim().toLowerCase();
  if (["available", "yes", "open"].includes(status)) return "available";
  if (["limited", "few"].includes(status)) return "limited";
  if (["sold_out", "sold out", "full", "no", "unavailable"].includes(status)) return "sold_out";
  if (availableRooms > 3) return "available";
  if (availableRooms > 0) return "limited";
  return "sold_out";
}

function googleSheetExportUrl(url) {
  if (!url.includes("docs.google.com/spreadsheets")) return url;

  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const sheetUrl = new URL(normalizedUrl);
  const gid = sheetUrl.searchParams.get("gid") || sheetUrl.hash.match(/gid=(\d+)/)?.[1] || "0";

  if (sheetUrl.pathname.includes("/export")) {
    sheetUrl.searchParams.set("format", "csv");
    sheetUrl.searchParams.set("gid", gid);
    return sheetUrl.toString();
  }

  if (sheetUrl.pathname.includes("/gviz/tq")) {
    sheetUrl.searchParams.set("tqx", "out:csv");
    return sheetUrl.toString();
  }

  if (sheetUrl.pathname.includes("/pubhtml")) {
    sheetUrl.pathname = sheetUrl.pathname.replace("/pubhtml", "/pub");
    sheetUrl.searchParams.set("output", "csv");
    sheetUrl.searchParams.set("gid", gid);
    sheetUrl.searchParams.set("single", "true");
    return sheetUrl.toString();
  }

  if (sheetUrl.pathname.includes("/pub")) {
    sheetUrl.searchParams.set("output", "csv");
    sheetUrl.searchParams.set("gid", gid);
    sheetUrl.searchParams.set("single", "true");
    return sheetUrl.toString();
  }

  const idMatch = sheetUrl.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!idMatch) return url;

  return `${sheetUrl.origin}/spreadsheets/d/${idMatch[1]}/export?format=csv&gid=${gid}`;
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function csvToRows(buffer) {
  const lines = buffer
    .toString("utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const headers = parseCsvLine(lines[0] || "");
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {});
  });
}

async function xlsxToRows(buffer) {
  const sheetRows = await readXlsxFile(buffer);
  const headers = (sheetRows[0] || []).map((cell) => String(cell || "").trim());

  return sheetRows.slice(1).map((cells) =>
    headers.reduce((row, header, index) => {
      if (header) row[header] = cells[index] || "";
      return row;
    }, {})
  );
}

async function fetchBufferFromUrl(url) {
  let exportUrl;

  try {
    exportUrl = googleSheetExportUrl(url);
  } catch {
    const error = new Error("The availability sheet link is not a valid URL");
    error.status = 400;
    throw error;
  }

  const response = await fetch(exportUrl);
  if (!response.ok) {
    const error = new Error(
      response.status === 401 || response.status === 403
        ? "Google Sheet is not public. Open Share in Google Sheets, set General access to Anyone with the link as Viewer, then paste the sharing link again."
        : `Could not fetch availability sheet (${response.status})`
    );
    error.status = 400;
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    const error = new Error("Google returned a web page instead of CSV data. Use a public Google Sheet sharing link or publish the sheet as CSV.");
    error.status = 400;
    throw error;
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType,
    sourceUrl: url
  };
}

function rowsToAvailability(rows, sourceUrl = "", defaultResort = {}) {
  const parsedRows = rows
    .map((row) => {
      const resortName = String(readCell(row, "resortName") || defaultResort.name || "").trim();
      const roomCategory = String(readCell(row, "roomCategory") || "").trim();
      const date = normalizeDate(readCell(row, "date"));
      const availableRooms = normalizeNumber(readCell(row, "availableRooms"));
      const resortSlug =
        String(readCell(row, "resortSlug") || defaultResort.slug || "").trim() ||
        slugify(resortName, { lower: true, strict: true });

      if (!resortName || !roomCategory || !date || !resortSlug) return null;

      return {
        resortName,
        resortSlug,
        roomCategory,
        date,
        availableRooms,
        status: normalizeStatus(readCell(row, "status"), availableRooms),
        price: normalizeNumber(readCell(row, "price")),
        note: String(readCell(row, "note") || "").trim(),
        sourceUrl
      };
    })
    .filter(Boolean);

  return Array.from(
    new Map(
      parsedRows.map((row) => [
        `${row.resortSlug}-${row.roomCategory.toLowerCase()}-${row.date.toISOString().slice(0, 10)}`,
        row
      ])
    ).values()
  );
}

export async function parseAvailabilitySource({ file, sheetUrl, defaultResort }) {
  const payload = file
    ? {
        buffer: file.buffer,
        contentType: file.mimetype || "",
        sourceUrl: file.originalname || ""
      }
    : await fetchBufferFromUrl(sheetUrl);

  const source = payload.sourceUrl || sheetUrl || "";
  const isCsv =
    payload.contentType.includes("csv") ||
    source.toLowerCase().endsWith(".csv") ||
    source.includes("docs.google.com/spreadsheets");
  const rows = isCsv ? csvToRows(payload.buffer) : await xlsxToRows(payload.buffer);

  const availabilityRows = rowsToAvailability(rows, source, defaultResort);
  if (rows.length === 0 || availabilityRows.length === 0) {
    const error = new Error("No valid availability rows were found. Use columns like Room Category, Date, Available Rooms, Status, Price, and Note.");
    error.status = 400;
    throw error;
  }

  return availabilityRows;
}

export async function parseAvailabilityUpload({ file, sheetUrl, defaultResort }) {
  return parseAvailabilitySource({ file, sheetUrl, defaultResort });
}
