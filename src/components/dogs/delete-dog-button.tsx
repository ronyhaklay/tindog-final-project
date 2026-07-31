"use client";

import { useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteDogButton({
  dogId,
  dogName,
  deleteAction,
}: {
  dogId: string;
  dogName: string;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete ${dogName}'s profile? This cannot be undone.`)) {
      return;
    }
    const formData = new FormData();
    formData.set("dogId", dogId);
    startTransition(() => deleteAction(formData));
  }

  return (
    <Button
      variant="destructive"
      size="icon"
      aria-label={`Delete ${dogName}`}
      disabled={pending}
      onClick={handleDelete}
    >
      <Trash2Icon />
    </Button>
  );
}
