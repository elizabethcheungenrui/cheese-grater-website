import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabaseClient";
import CCard from "../cards/CCard";
import { formatDate } from "../../methods/formatting";
import "./SearchClient.css";

type Result = {
  id: string;
  slug: string;
  section: string;
  subsection: string;
  title: string;
  image_url: string | null;
  author_thumbnail: string | null;
  date_published: string;
};

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  // Read ?q= from URL (client-only, reliable)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q")?.trim() ?? "";
    setQuery(q);
  }, []);

  // Fetch results
  useEffect(() => {
    if (!query) return;

    let cancelled = false;

    async function runSearch() {
      setLoading(true);

      const supabase = getSupabaseClient();

      const { data, error } = await supabase.rpc("search_articles", { query });

      if (cancelled) return;

      if (error) {
        console.error("Search failed:", error);
        setResults([]);
      } else {
        setResults(data ?? []);

        // Log successful searches without blocking the UI
        if (query.length >= 3 && query.length <= 200) {
          void supabase
            .from("search_logs")
            .insert({
              query,
              result_count: data?.length ?? 0,
            })
            .then(({ error: logError }) => {
              if (logError) {
                console.warn("Search logging failed:", logError);
              }
            });
        }
      }

      setLoading(false);
    }

    runSearch();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <section className="search-page">
      <h1>{query ? `Search results for “${query}”` : "Search"}</h1>

      {loading && <p>Searching…</p>}
      {!loading && query && results.length === 0 && <p>No results found.</p>}

      <ul className="card-grid">
        {results.map((article) => (
          <li key={article.id}>
            <CCard
              slug={article.slug}
              section={article.section}
              title={article.title}
              image={article.image_url ?? article.author_thumbnail!}
              tag={article.subsection}
              date={formatDate(article.date_published)}
              category="subpage"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
