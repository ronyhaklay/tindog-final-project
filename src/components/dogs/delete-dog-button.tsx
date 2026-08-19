"use client";

import { useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";

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
  const { isHebrew } = useLanguage();

  function handleDelete() {
    if (!confirm(isHebrew ? `למחוק את הפרופיל של ${dogName}? לא ניתן לבטל פעולה זו.` : `Delete ${dogName}\'s profile? This cannot be undone.`)) {
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
      aria-label={isHebrew ? `מחיקת ${dogName}` : `Delete ${dogName}`}
      disabled={pending}
      onClick={handleDelete}
    >
      <Trash2Icon />
    </Button>
  );
}
