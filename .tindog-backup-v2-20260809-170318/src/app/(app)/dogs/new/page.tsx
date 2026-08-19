import type { Metadata } from "next";
import { DogForm } from "@/components/dogs/dog-form";

export const metadata: Metadata = { title: "Add a dog" };

export default function NewDogPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <p className="text-sm font-medium text-primary">Create a listing</p>
        <h1 className="text-3xl font-bold tracking-tight">Help the right person fall in love</h1>
      </div>
      <DogForm />
    </div>
  );
}
