"use client";

import type { Bookmark } from "./BookmarkDashboard";

interface Props {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  onCopy: (url: string) => void;
  index: number;
}

export default function BookmarkCard({ bookmark, onDelete, onCopy, index }: Props) {
  const createdAt = new Date(bookmark.created_at);
  const timeAgo = getTimeAgo(createdAt);

  // Extract domain for display
  let domain = "";
  try {
    domain = new URL(bookmark.url).hostname.replace("www.", "");
  } catch {
    domain = bookmark.url;
  }

  return (
    <div
      className={`glass-card animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
      style={{
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        opacity: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Favicon */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          width={20}
          height={20}
          style={{
            borderRadius: "4px",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              textDecoration: "none",
              display: "block",
              marginBottom: "6px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--accent-purple)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-primary)")
            }
          >
            {bookmark.title}
          </a>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
            }}
          >
            <span>{domain}</span>
            <span>·</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button
          className="btn-danger"
          onClick={() => onCopy(bookmark.url)}
          title="Copy URL"
          style={{ color: "var(--text-muted)" }}
        >
          Copy
        </button>
        <button
          className="btn-danger"
          onClick={() => onDelete(bookmark.id)}
          title="Delete bookmark"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
