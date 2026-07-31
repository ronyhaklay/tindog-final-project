import type { Metadata } from "next";
import { DogForm } from "@/components/dogs/dog-form";

export const metadata: Metadata = { title: "Add a dog" };

export default function NewDogPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">Add a dog</h1>
      <DogForm />
    </div>
  );
}
