"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import type { DailyReport } from "@/lib/types";
import { inr } from "@/lib/utils";
import { deleteReport } from "@/app/actions/reports";

export function ReportsModule({ reports }: { reports: DailyReport[] }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
      startTransition(async () => {
        const res = await deleteReport(id);
        if (res.error) {
          alert("Failed to delete report: " + res.error);
        }
      });
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Daily Report Register</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Sales</Th>
                <Th>Expenses</Th>
                <Th>Closing</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <Td className="font-medium">{report.report_date}</Td>
                  <Td>{inr(report.total_sales)}</Td>
                  <Td>{inr(report.total_daily_expenses)}</Td>
                  <Td>{inr(report.closing_balance)}</Td>
                  <Td>
                    <Badge tone={report.status === "submitted" ? "green" : "amber"}>{report.status}</Badge>
                  </Td>
                  <Td className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(report.id)} disabled={isPending} aria-label="Delete report">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
