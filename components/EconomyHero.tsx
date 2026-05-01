"use client";

export function EconomyHero() {
  return (
    <header className="flex flex-col items-center text-center">
      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
        Agent Economy
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-zinc-400 sm:text-xl">
        Tracking the emerging agent economy across countries.
      </p>
      <p className="mt-3 max-w-xl text-sm text-zinc-500">
        Built from public web signals, nowcast estimates, and source-weighted
        calculations.
      </p>
    </header>
  );
}
