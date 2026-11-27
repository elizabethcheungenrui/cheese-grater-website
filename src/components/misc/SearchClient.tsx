import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabaseClient";
import CCard from "../cards/CCard";
import AuthorCard from "../cards/AuthorCard";
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

type AuthorResult = {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  rank: number;
};

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]); 
  const [authors, setAuthors] = useState<AuthorResult[]>([]);
  const [loading, setLoading] = useState(false);  
  const [searchError, setSearchError] = useState(false);

  // Read ?q= from URL (client-only, reliable)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q")?.trim() ?? "";
    setQuery(q);
  }, []);

  // Fetch results and authors concurrently
  useEffect(() => {
    if (!query) return;

    let cancelled = false;

    async function runSearch() {
      setLoading(true);
      setSearchError(false);

      const supabase = getSupabaseClient();

      try {
        const [articleResponse, authorResponse] = await Promise.all([
          supabase.rpc("search_articles", { query }),
          supabase.rpc("search_authors", { query }),
        ]);

        if (cancelled) return;

        const {
          data: articleData,
          error: articleError,
        } = articleResponse;

        const {
          data: authorData,
          error: authorError,
        } = authorResponse;

        if (articleError) {
          console.error("Article search failed:", articleError);
        }

        if (authorError) {
          console.error("Author search failed:", authorError);
        }

        setResults(articleError ? [] : articleData ?? []);
        setAuthors(authorError ? [] : authorData ?? []);
        setSearchError(Boolean(articleError || authorError));

        // Log successful searches without blocking the UI
        if (
          !articleError &&
          !authorError &&
          query.length >= 3 &&
          query.length <= 200
        ) {
          void supabase
            .from("search_logs")
            .insert({
              query,
              result_count: articleData?.length ?? 0,
            })
            .then(({ error: logError }) => {
              if (logError) {
                console.warn("Search logging failed:", logError);
              }
            });
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Search failed:", error);
        setSearchError(true);
        setResults([]);
        setAuthors([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
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

      {!loading && searchError && (
        <p>Some search results could not be loaded.</p>
      )}

      {!loading && 
        query && 
        results.length === 0 && 
        authors.length === 0 && (
          <p>No results found.</p>
      )}
     
      {!loading && authors.length > 0 && (
        <div className="article-results">
          <h2>Authors</h2>
          <ul className="card-grid-author">
            {authors.map((author) => (
              <li>
                <AuthorCard
                  name={author.name}
                  slug={author.slug}
                  thumbnail={author.thumbnail}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
     
      {!loading && results.length > 0 && (
        <div className="article-results">
          <h2>Articles</h2>
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
        </div>
      )}
    </section>
  );
}
