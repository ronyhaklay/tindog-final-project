"use client";

import { useState } from "react";
import { FilterIcon, RotateCcwIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  DOG_SIZE_LABELS,
  DOG_SIZES,
  ENERGY_LEVEL_LABELS,
  ENERGY_LEVELS,
  LISTING_TYPE_LABELS,
  LISTING_TYPES,
  type DogSize,
  type EnergyLevel,
  type ListingType,
} from "@/lib/constants";
import type { DeckFilters } from "@/lib/validation";

export function DeckFiltersBar({ filters, onChange }: { filters: DeckFilters; onChange: (filters: DeckFilters) => void }) {
  const [city, setCity] = useState(filters.city ?? "");
  const [advanced, setAdvanced] = useState(false);

  function patch(next: Partial<DeckFilters>) {
    onChange({ ...filters, ...next, city: city.trim() || filters.city });
  }

  function submit() {
    onChange({ ...filters, city: city.trim() || undefined });
  }

  function clear() {
    setCity("");
    onChange({});
  }

  const activeCount = [filters.size, filters.energyLevel, filters.goodWithKids].filter(Boolean).length;

  return (
    <div className="rounded-2xl border bg-white/90 p-3 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row">
        <NativeSelect
          aria-label="Listing type"
          className="sm:w-40"
          value={filters.listingType ?? ""}
          onChange={(e) => patch({ listingType: (e.target.value || undefined) as ListingType | undefined })}
        >
          <option value="">All listings</option>
          {LISTING_TYPES.map((t) => <option key={t} value={t}>{LISTING_TYPE_LABELS[t]}</option>)}
        </NativeSelect>
        <div className="flex flex-1 gap-2">
          <Input aria-label="City" placeholder="Search by city" value={city} onChange={(e) => setCity(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }} />
          <Button type="button" variant="outline" size="icon" aria-label="Search" onClick={submit}><SearchIcon /></Button>
          <Button type="button" variant={advanced ? "secondary" : "outline"} onClick={() => setAdvanced((v) => !v)}>
            <SlidersHorizontalIcon data-icon="inline-start" />
            Filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </Button>
        </div>
      </div>

      {advanced && (
        <div className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-3">
          <NativeSelect aria-label="Dog size" value={filters.size ?? ""} onChange={(e) => patch({ size: (e.target.value || undefined) as DogSize | undefined })}>
            <option value="">Any size</option>
            {DOG_SIZES.map((s) => <option key={s} value={s}>{DOG_SIZE_LABELS[s]}</option>)}
          </NativeSelect>
          <NativeSelect aria-label="Energy level" value={filters.energyLevel ?? ""} onChange={(e) => patch({ energyLevel: (e.target.value || undefined) as EnergyLevel | undefined })}>
            <option value="">Any energy level</option>
            {ENERGY_LEVELS.map((e) => <option key={e} value={e}>{ENERGY_LEVEL_LABELS[e]}</option>)}
          </NativeSelect>
          <label className="flex items-center gap-2 rounded-md border bg-background px-3 text-sm">
            <input type="checkbox" checked={filters.goodWithKids ?? false} onChange={(e) => patch({ goodWithKids: e.target.checked ? true : undefined })} className="size-4 accent-[var(--primary)]" />
            Good with kids
          </label>
          <div className="flex items-center gap-2 sm:col-span-3">
            <FilterIcon className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Filters update the discovery deck instantly.</span>
            <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={clear}><RotateCcwIcon data-icon="inline-start" />Clear</Button>
          </div>
        </div>
      )}
    </div>
  );
}
