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
import { getInitials } from "@/utils/getInitials"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import UserAvatar from "@/components/ui/UserAvatar"

export default function TaskDataTableTanstack({ tasks, users, onEdit, onDelete, onAddNote, onRowClick }) {
  const [noteModal, setNoteModal] = React.useState({ open: false, taskId: null })
  const [noteContent, setNoteContent] = React.useState("")
  const [detailsModal, setDetailsModal] = React.useState({ open: false, task: null })
  const [activeRowId, setActiveRowId] = React.useState(null);

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
              {visibleUsers.map((u, idx) => {
                const [imgError, setImgError] = React.useState(false);
                return (
                  <Avatar
                    key={u.uid}
                    className="w-8 h-8 border-2 border-white dark:border-zinc-800 rounded-full bg-zinc-200 text-zinc-700 font-bold text-xs"
                    style={visibleUsers.length > 1 ? { zIndex: 10 - idx } : {}}
                  >
                    {u.photo && !imgError ? (
                      <AvatarImage src={u.photo} alt={u.firstName} onError={() => setImgError(true)} />
                    ) : (
                      <AvatarFallback>{getInitials(u)}</AvatarFallback>
                    )}
                  </Avatar>
                );
              })}
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
            <Button size="sm" variant="outline" className="text-xs px-2 py-1" onClick={() => setNoteModal({ open: true, taskId: row.original.id })}>Notatka</Button>
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
                <TableRow
                  key={row.id}
                  className={`cursor-pointer transition ${activeRowId === row.original.id ? 'bg-zinc-200' : 'hover:bg-indigo-50'}`}
                  onClick={e => {
                    if (e.target.closest('button')) return;
                    setActiveRowId(row.original.id);
                    if (onRowClick) onRowClick(row.original);
                  }}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      onClick={cell.column.id === 'actions' ? e => e.stopPropagation() : undefined}
                    >
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
      {detailsModal.open && detailsModal.task && (
        <Dialog open={detailsModal.open} onOpenChange={open => {
          setDetailsModal({ open, task: open ? detailsModal.task : null });
          if (!open) setActiveRowId(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Szczegóły zadania</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <span className="font-semibold">Tytuł:</span> <span className="break-words">{detailsModal.task.title}</span>
              </div>
              <div>
                <span className="font-semibold">Status:</span> {detailsModal.task.status === 'TODO' ? 'Do zrobienia' : detailsModal.task.status === 'IN_PROGRESS' ? 'W trakcie' : 'Zrobione'}
              </div>
              <div>
                <span className="font-semibold">Przypisani:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {users.filter(u => detailsModal.task.assignedUserIds.includes(u.uid)).map(u => (
                    <UserAvatar key={u.uid} user={u} className="w-6 h-6" size="w-6 h-6" />
                  ))}
                </div>
              </div>
              <div>
                <span className="font-semibold">Notatki:</span>
                <ul className="mt-2 space-y-2">
                  {detailsModal.task.notes && detailsModal.task.notes.length > 0 ? (
                    detailsModal.task.notes.map((n, idx) => (
                      <li key={idx} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2">
                        <div className="text-zinc-700 dark:text-zinc-200">{n.content}</div>
                      </li>
                    ))
                  ) : (
                    <li className="text-zinc-400 dark:text-zinc-500">Brak notatek</li>
                  )}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setDetailsModal({ open: false, task: null })}>Zamknij</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {noteModal.open && (
        <Dialog open={noteModal.open} onOpenChange={open => setNoteModal({ open, taskId: noteModal.taskId })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj notatkę</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Treść notatki"
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
            />
            <DialogFooter>
              <Button
                onClick={() => {
                  onAddNote(noteModal.taskId, noteContent);
                  setNoteModal({ open: false, taskId: null });
                  setNoteContent("");
                }}
                disabled={!noteContent.trim()}
              >
                Dodaj
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 