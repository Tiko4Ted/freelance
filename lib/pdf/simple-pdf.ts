export type PdfSection = {
  heading: string;
  lines: string[];
};

type TextLine = {
  text: string;
  size: number;
  bold?: boolean;
  gapBefore?: number;
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 54;
const TOP_Y = 790;
const BOTTOM_Y = 58;

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function normalizePdfText(value: string) {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function wrapText(value: string, size: number) {
  const maxChars = Math.max(
    24,
    Math.floor((PAGE_WIDTH - MARGIN_X * 2) / (size * 0.48)),
  );
  const words = normalizePdfText(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      continue;
    }

    current = next;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function textCommand(line: TextLine, x: number, y: number) {
  const font = line.bold ? "F2" : "F1";

  return `BT /${font} ${line.size} Tf ${x} ${y} Td (${escapePdfText(
    normalizePdfText(line.text),
  )}) Tj ET`;
}

function buildTextLines(
  title: string,
  sections: PdfSection[],
  subtitle = "Downloadable task brief for approved candidate work.",
) {
  const lines: TextLine[] = [
    { text: title, size: 19, bold: true },
    {
      text: subtitle,
      size: 10,
      gapBefore: 18,
    },
  ];

  for (const section of sections) {
    lines.push({ text: section.heading, size: 13, bold: true, gapBefore: 18 });

    for (const item of section.lines) {
      for (const wrappedLine of wrapText(item, 10)) {
        lines.push({ text: wrappedLine, size: 10 });
      }
    }
  }

  return lines;
}

function paginate(lines: TextLine[]) {
  const pages: string[][] = [[]];
  let y = TOP_Y;

  for (const line of lines) {
    y -= line.gapBefore ?? 14;

    if (y < BOTTOM_Y) {
      pages.push([]);
      y = TOP_Y - (line.gapBefore ?? 14);
    }

    pages[pages.length - 1].push(textCommand(line, MARGIN_X, y));
  }

  return pages;
}

export function createSimplePdf(
  title: string,
  sections: PdfSection[],
  subtitle?: string,
) {
  const pages = paginate(buildTextLines(title, sections, subtitle));
  const pageCount = pages.length;
  const pageStartId = 3;
  const contentStartId = pageStartId + pageCount;
  const regularFontId = contentStartId + pageCount;
  const boldFontId = regularFontId + 1;
  const objects: string[] = [];

  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids ${pages
    .map((_, index) => `${pageStartId + index} 0 R`)
    .join(" ")} /Count ${pageCount} >>`;

  pages.forEach((_, index) => {
    objects[pageStartId + index - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> ` +
      `/Contents ${contentStartId + index} 0 R >>`;
  });

  pages.forEach((commands, index) => {
    const stream = commands.join("\n");
    objects[contentStartId + index - 1] = `<< /Length ${Buffer.byteLength(
      stream,
      "latin1",
    )} >>\nstream\n${stream}\nendstream`;
  });

  objects[regularFontId - 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[boldFontId - 1] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.byteLength(pdf, "latin1");
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}
