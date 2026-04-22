import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export function AuditLogTable({
  rows,
}: {
  rows: Array<{ case_id: string; event_type: string; actor: string; summary: string; created_at: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Audit Logs</CardTitle>
        <CardDescription>Traceable control events written by the governance pipeline.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.case_id}-${row.created_at}`}>
                <TableCell>
                  <Link href={`/cases/${row.case_id}`} className="font-semibold text-primary">
                    {row.case_id}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{row.event_type}</Badge>
                </TableCell>
                <TableCell>{row.actor}</TableCell>
                <TableCell>{row.summary}</TableCell>
                <TableCell>{formatDate(row.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

