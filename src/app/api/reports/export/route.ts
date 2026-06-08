import { NextResponse } from "next/server";
import { strToU8, zipSync } from "fflate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "summary";
  
  const supabase = await createSupabaseServerClient();
  const { data: reports } = await supabase.from("daily_reports").select("*, employees(full_name)").order("report_date", { ascending: false });

  const rows = (reports || []).map((report: any) => ({
    Date: report.report_date,
    Sales: report.total_sales,
    "Daily Expenses": report.total_daily_expenses,
    "Bank Deposits": report.total_bank_deposits,
    "Cash In Shop": report.cash_in_shop,
    "Submitted By": report.employees?.full_name ?? "",
  }));

  const workbook = buildWorkbook(rows);
  return new NextResponse(workbook, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="madefit-${type}.xlsx"`,
    },
  });
}

function buildWorkbook(rows: Array<Record<string, string | number>>) {
  const headers = Object.keys(rows[0] ?? { Date: "" });
  const sheetRows = [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))];
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${sheetRows
      .map(
        (row, rowIndex) =>
          `<row r="${rowIndex + 1}">${row
            .map((cell, cellIndex) => {
              const ref = `${columnName(cellIndex + 1)}${rowIndex + 1}`;
              if (typeof cell === "number") return `<c r="${ref}"><v>${cell}</v></c>`;
              return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(String(cell))}</t></is></c>`;
            })
            .join("")}</row>`,
      )
      .join("")}
  </sheetData>
</worksheet>`;

  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="MadeFit Reports" sheetId="1" r:id="rId1"/></sheets>
</workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`),
    "xl/worksheets/sheet1.xml": strToU8(sheetXml),
  };

  return zipSync(files, { level: 6 });
}

function columnName(index: number) {
  let name = "";
  while (index > 0) {
    const remainder = (index - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    index = Math.floor((index - 1) / 26);
  }
  return name;
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
