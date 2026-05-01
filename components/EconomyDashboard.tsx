"use client";

import { useState } from "react";
import useSWR from "swr";
import { EconomyHero } from "@/components/EconomyHero";
import { SummaryCards } from "@/components/SummaryCards";
import { WorldMap } from "@/components/WorldMap";
import { CountryTable } from "@/components/CountryTable";
import { MethodologyPanel } from "@/components/MethodologyPanel";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import type { CountryWithMetrics, EconomySummary } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function EconomyDashboard() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const {
    data: countries,
    error: countriesError,
    isLoading: countriesLoading,
    mutate: refreshCountries,
  } = useSWR<CountryWithMetrics[]>("/api/economy/countries", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const {
    data: summary,
    error: summaryError,
    isLoading: summaryLoading,
  } = useSWR<EconomySummary>("/api/economy/summary", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const isLoading = countriesLoading || summaryLoading;
  const hasError = countriesError || summaryError;

  if (isLoading && !countries) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <EconomyHero />
        <div className="mt-12">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <EconomyHero />
        <div className="mt-12">
          <ErrorState onRetry={() => refreshCountries()} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <EconomyHero />

      {/* Summary Cards */}
      <section className="mt-12">
        <SummaryCards summary={summary || null} isLoading={summaryLoading} />
      </section>

      {/* World Map */}
      <section className="mt-12">
        <h2 className="mb-6 text-lg font-semibold text-zinc-200">
          Global Agent Economy
        </h2>
        <WorldMap
          countries={countries || []}
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
        />
      </section>

      {/* Country Table */}
      <section className="mt-12">
        <h2 className="mb-6 text-lg font-semibold text-zinc-200">
          Countries
        </h2>
        <CountryTable
          countries={countries || []}
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
        />
      </section>

      {/* Methodology */}
      <section className="mt-12">
        <MethodologyPanel />
      </section>
    </div>
  );
}
