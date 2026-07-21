import { useEffect, useRef, useState } from "react";
import { SearchIcon, CloseIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";
import {
  geocodeSuggestions,
  GeocodeResult,
} from "@/features/try-fair/api/hot-imagery";

const DEBOUNCE_MS = 350;

/**
 * Location search for the OpenAerialMap map: type to get debounced Nominatim
 * suggestions, pick one to frame it. Clearing resets the view (onClear), and
 * the whole box collapses to an icon so it never blocks the map / panel on
 * small screens.
 */
export const LocationSearch = ({
  onPick,
  onClear,
}: {
  onPick: (result: GeocodeResult) => void;
  /** Fired when the user clears the search (e.g. to reset the map view). */
  onClear: () => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Debounced suggestion fetch.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      geocodeSuggestions(query.trim(), 5, controller.signal)
        .then((r) => {
          if (controller.signal.aborted) return;
          setResults(r);
          setOpen(true);
        })
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handlePick = (r: GeocodeResult) => {
    setQuery(r.displayName);
    setResults([]);
    setOpen(false);
    onPick(r);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    onClear();
  };

  if (!expanded) {
    return (
      <button
        type="button"
        aria-label="Search for a place"
        onClick={() => setExpanded(true)}
        className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-md border border-gray-border hover:bg-off-white"
      >
        <SearchIcon />
      </button>
    );
  }

  return (
    <div className="relative w-[min(340px,78vw)]">
      <div className="flex items-center bg-white rounded-lg shadow-md border border-gray-border overflow-hidden">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search for a place to map"
          className="flex-1 px-3 py-2.5 text-sm text-dark outline-none min-w-0"
        />
        {loading && (
          <span className="px-2 shrink-0">
            <Spinner style={{ fontSize: "14px" }} />
          </span>
        )}
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
            className="px-3 py-2.5 text-grey hover:text-dark shrink-0"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Search location"
          className="m-1 px-3 py-1.5 rounded-md bg-off-white border border-gray-border hover:bg-light-gray disabled:opacity-50"
        >
          <SearchIcon />
        </button>
      </div>

      {open && results.length > 0 && (
        <ul className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-border overflow-hidden max-h-60 overflow-y-auto scrollable">
          {results.map((r, i) => (
            <li key={`${r.displayName}-${i}`}>
              <button
                type="button"
                onClick={() => handlePick(r)}
                className="w-full text-left px-3 py-2 text-xs text-dark hover:bg-off-white truncate"
                title={r.displayName}
              >
                {r.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
