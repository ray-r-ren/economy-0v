"use client";

import { useState, useCallback } from "react";

interface CountryResult {
  country: string;
  iso3: string;
  status: "pending" | "processing" | "success" | "error";
  agentGdp?: number;
  error?: string;
}

export default function AdminPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<CountryResult[]>([]);
  const [currentCountry, setCurrentCountry] = useState<string | null>(null);

  const runResearch = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    try {
      // First, get all countries
      const countriesRes = await fetch("/api/economy/countries");
      const countriesData = await countriesRes.json();
      const countries = countriesData.countries || [];
      
      setTotal(countries.length);
      
      // Initialize results
      const initialResults: CountryResult[] = countries.map((c: { name: string; iso3: string }) => ({
        country: c.name,
        iso3: c.iso3,
        status: "pending" as const,
      }));
      setResults(initialResults);

      // Process countries one by one
      for (let i = 0; i < countries.length; i++) {
        const country = countries[i];
        setCurrentCountry(country.name);
        
        // Update status to processing
        setResults(prev => prev.map(r => 
          r.iso3 === country.iso3 ? { ...r, status: "processing" as const } : r
        ));

        try {
          const res = await fetch("/api/admin/research-single", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ iso3: country.iso3, name: country.name }),
          });

          const data = await res.json();

          if (data.success) {
            setResults(prev => prev.map(r => 
              r.iso3 === country.iso3 
                ? { ...r, status: "success" as const, agentGdp: data.metrics?.agent_gdp_usd_month } 
                : r
            ));
          } else {
            setResults(prev => prev.map(r => 
              r.iso3 === country.iso3 
                ? { ...r, status: "error" as const, error: data.error || "Unknown error" } 
                : r
            ));
          }
        } catch (err) {
          setResults(prev => prev.map(r => 
            r.iso3 === country.iso3 
              ? { ...r, status: "error" as const, error: String(err) } 
              : r
          ));
        }

        setProgress(i + 1);
      }
    } catch (err) {
      console.error("Failed to run research:", err);
    } finally {
      setIsRunning(false);
      setCurrentCountry(null);
    }
  }, []);

  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Economy Admin</h1>
        <p className="text-zinc-400 mb-8">Run OpenAI research for all countries</p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Run Research</h2>
              <p className="text-zinc-400 text-sm">
                Process all countries using OpenAI to gather agent economy data
              </p>
            </div>
            <button
              onClick={runResearch}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isRunning
                  ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {isRunning ? "Running..." : "Start Research"}
            </button>
          </div>

          {isRunning && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progress: {progress} / {total} countries</span>
                <span>{Math.round((progress / total) * 100)}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress / total) * 100}%` }}
                />
              </div>
              {currentCountry && (
                <p className="text-sm text-zinc-400">
                  Currently processing: <span className="text-zinc-200">{currentCountry}</span>
                </p>
              )}
            </div>
          )}

          {!isRunning && results.length > 0 && (
            <div className="flex gap-4 text-sm">
              <span className="text-emerald-400">Success: {successCount}</span>
              <span className="text-red-400">Errors: {errorCount}</span>
              <span className="text-zinc-400">Total: {total}</span>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold">Results</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Country</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Status</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Agent GDP</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.iso3} className="border-t border-zinc-800/50">
                      <td className="p-3 text-sm">{result.country}</td>
                      <td className="p-3 text-sm">
                        {result.status === "pending" && (
                          <span className="text-zinc-500">Pending</span>
                        )}
                        {result.status === "processing" && (
                          <span className="text-amber-400">Processing...</span>
                        )}
                        {result.status === "success" && (
                          <span className="text-emerald-400">Success</span>
                        )}
                        {result.status === "error" && (
                          <span className="text-red-400" title={result.error}>Error</span>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {result.agentGdp 
                          ? `$${(result.agentGdp / 1000000).toFixed(1)}M/mo`
                          : result.status === "success" ? "No data" : "-"
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
