import "./Card.css";

export default function AuthorCard({
  name,
  slug,
  thumbnail,
}: {
  name: string;
  slug: string;
  thumbnail: string | null;
}) {
  const authorThumbnail = thumbnail ?? "https://images.cheesegratermagazine.org/author_thumbnails/cg_author.jpeg";

  return (
    <div className="card author-card">
      <a href={`/author/${slug}/#`} className="link">
        <div className="author">
          <img src={authorThumbnail} alt={name} loading="lazy" className="author-thumbnail" />
          <p className="author-name">{name}</p>
        </div>
      </a>
    </div>
  );  
}
