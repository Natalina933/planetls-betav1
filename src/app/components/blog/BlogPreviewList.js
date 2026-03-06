export default function BlogPreviewList({ posts = [] }) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return (
      <div style={{ marginTop: "1rem", padding: "1rem", borderRadius: "8px", background: "#f8f8f8" }}>
        Aucun article public pour le moment. Le module blog sera alimente avec du contenu reel.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem", marginTop: "1rem" }}>
      {posts.map((post) => (
        <a
          key={post.id}
          href={post.link}
          style={{
            display: "block",
            background: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            padding: "1.25rem 1.5rem",
            textDecoration: "none",
            color: "#222",
            transition: "box-shadow 0.2s",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#0070f3" }}>{post.title}</h3>
          <p style={{ margin: 0, color: "#444" }}>{post.excerpt}</p>
          <div style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "#888" }}>
            {post.date ? new Date(post.date).toLocaleDateString("fr-FR") : "Date non disponible"}
          </div>
        </a>
      ))}
    </div>
  );
}
