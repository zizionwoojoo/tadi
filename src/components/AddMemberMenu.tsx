"use client";

import { useEffect, useRef, useState } from "react";
import { addMemberToCategoryAction } from "@/app/project/[id]/actions";
import type { MemberData } from "@/app/project/[id]/types";

export default function AddMemberMenu({
  categoryId,
  allMembers,
  assignedMemberIds,
  onAdded,
}: {
  categoryId: string;
  allMembers: MemberData[];
  assignedMemberIds: string[];
  onAdded: (member: MemberData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [pending, setPending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const availableMembers = allMembers.filter((m) => !assignedMemberIds.includes(m.id));

  async function handleSelectExisting(memberId: string) {
    setPending(true);
    try {
      const member = await addMemberToCategoryAction(categoryId, { existingMemberId: memberId });
      onAdded(member);
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  async function handleCreateNew(event: React.FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setPending(true);
    try {
      const member = await addMemberToCategoryAction(categoryId, { newName: name });
      onAdded(member);
      setNewName("");
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative" ref={containerRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-dashed border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-400"
      >
        + 팀원 추가
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-1 w-52 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {availableMembers.length > 0 && (
            <div className="mb-2 flex flex-col gap-1 border-b border-zinc-100 pb-2 dark:border-zinc-700">
              {availableMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={pending}
                  onClick={() => handleSelectExisting(m.id)}
                  className="rounded-md px-2 py-1 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleCreateNew} className="flex gap-1">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="새 팀원 이름"
              className="min-w-0 flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={pending || !newName.trim()}
              className="shrink-0 rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              추가
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
