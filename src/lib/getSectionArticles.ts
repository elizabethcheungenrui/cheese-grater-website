import { getSupabaseClient } from "../lib/supabaseClient";
const supabase = getSupabaseClient();

export interface HomepageArticle {
  slug: string;
  title: string;
  summary: string | null;
  author: string;
  author_thumbnail: string;
  image_url: string | null;
  image_width: number;
  image_height: number;
  subsection: string;
  date_published: string;
}

export interface HomepageSection {
  section: string;
  articles: HomepageArticle[];
}

export async function getSectionArticles(
  section: string,
  limit?: number,
): Promise<HomepageSection> {
  let query = supabase
    .from("articles")
    .select("slug, title, summary, author, author_thumbnail, image_url, image_width, image_height, subsection, date_published")
    .eq("section", section)
    .order("date_published", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    section,
    articles: data as HomepageArticle[],
  };
}

export async function getSubsectionArticles(
  section: string,
  subsection: string,
  limit?: number,
): Promise<HomepageSection> {
  let query = supabase
    .from("articles")
    .select(`
      slug,
      title,
      summary,
      author,
      author_thumbnail,
      image_url,
      image_width,
      image_height,
      subsection,
      date_published
    `)
    .eq("subsection", subsection)
    .order("date_published", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    section,
    articles: data as HomepageArticle[],
  };
}
