"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

function getInitials(user) {
  if (!user) return '';
  const first = user.firstName?.[0] || '';
  const last = user.lastName?.[0] || '';
  if (first || last) return (first + last).toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  if (user.uid) return user.uid[0].toUpperCase();
  return '?';
}

export default function TaskDataTableTanstack({ tasks, users, onEdit, onDelete, onAddNote }) {
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tytuł <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.title}</span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span>
            {row.original.status === "TODO"
              ? "Do zrobienia"
              : row.original.status === "IN_PROGRESS"
              ? "W trakcie"
              : "Zrobione"}
          </span>
        ),
      },
      {
        id: "assigned",
        header: "Przypisani",
        cell: ({ row }) => {
          const assignedUsers = users.filter(u =>
            row.original.assignedUserIds.includes(u.uid)
          );
          const maxAvatars = 3;
          const visibleUsers = assignedUsers.slice(0, maxAvatars);
          const extraCount = assignedUsers.length - maxAvatars;
          return (
            <div className={
              visibleUsers.length > 1
                ? "flex items-center -space-x-3"
                : "flex items-center"
            }>
              {visibleUsers.map((u, idx) => (
                <Avatar
                  key={u.uid}
                  className="w-8 h-8 border-2 border-white dark:border-zinc-800 rounded-full bg-zinc-200 text-zinc-700 font-bold text-xs"
                  style={visibleUsers.length > 1 ? { zIndex: 10 - idx } : {}}
                >
                  {u.photo ? (
                    <AvatarImage src={u.photo} alt={u.firstName} />
                  ) : null}
                  <AvatarFallback>{getInitials(u)}</AvatarFallback>
                </Avatar>
              ))}
              {extraCount > 0 && (
                <span
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs border-2 border-white dark:border-zinc-800"
                  style={{ zIndex: 10 - maxAvatars }}
                >
                  +{extraCount}
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "actions",
        header: "Akcje",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs px-2 py-1" onClick={() => onAddNote(row.original)}>Notatka</Button>
            <Button size="sm" variant="outline" className="text-xs px-2 py-1" onClick={() => onEdit(row.original)}>Edytuj</Button>
            <Button size="sm" variant="destructive" className="text-xs px-2 py-1" onClick={() => onDelete(row.original)}>Usuń</Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [users, onEdit, onDelete, onAddNote]
  );

  const [sorting, setSorting] = React.useState([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      return row.original.title.toLowerCase().includes(filterValue.toLowerCase());
    },
    initialState: { pagination: { pageSize: 5 } },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Szukaj po tytule..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Brak wyników.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} row(s) selected.
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Poprzednia
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Następna
        </Button>
      </div>
    </div>
  );
} 