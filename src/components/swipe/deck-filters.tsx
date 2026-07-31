"use client";

import { useState } from "react";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  LISTING_TYPE_LABELS,
  LISTING_TYPES,
  type ListingType,
} from "@/lib/constants";
import type { DeckFilters } from "@/lib/validation";

export function DeckFiltersBar({
  filters,
  onChange,
}: {
  filters: DeckFilters;
  onChange: (filters: DeckFilters) => void;
}) {
  const [city, setCity] = useState(filters.city ?? "");

  function submit(listingType: DeckFilters["listingType"], cityValue: string) {
    onChange({
      listingType,
      city: cityValue.trim() || undefined,
    });
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit(filters.listingType, city);
      }}
    >
      <NativeSelect
        aria-label="Listing type"
        className="w-40"
        value={filters.listingType ?? ""}
        onChange={(e) =>
          submit((e.target.value || undefined) as ListingType | undefined, city)
        }
      >
        <option value="">All listings</option>
        {LISTING_TYPES.map((t) => (
          <option key={t} value={t}>
            {LISTING_TYPE_LABELS[t]}
          </option>
        ))}
      </NativeSelect>
      <Input
        aria-label="City"
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" variant="outline" size="icon" aria-label="Search">
        <SearchIcon />
      </Button>
    </form>
  );
}
