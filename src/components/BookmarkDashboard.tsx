"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import BookmarkCard from "./BookmarkCard";
import type { User } from "@supabase/supabase-js";

export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string;
  created_at: string;
}

interface Props {
  user: User;
  initialBookmarks: Bookmark[];
}

export default function BookmarkDashboard({ user, initialBookmarks }: Props) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const supabase = createClient();

  // Auto-fetch page title when URL is pasted/entered
  const fetchPageTitle = useCallback(async (inputUrl: string) => {
    if (!inputUrl.trim() || !inputUrl.startsWith("http")) return;
    setIsFetchingTitle(true);
    try {
      const res = await fetch(`/api/fetch-title?url=${encodeURIComponent(inputUrl)}`);
      const data = await res.json();
      if (data.title) {
        setTitle(data.title);
      }
    } catch {
      // Silently fail — user can still type title manually
    } finally {
      setIsFetchingTitle(false);
    }
  }, []);

  // Handle URL input change with auto-title
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    // Auto-fetch title if it looks like a pasted URL and title is empty
    if (newUrl.startsWith("http") && !title.trim()) {
      fetchPageTitle(newUrl);
    }
  };

  // Show toast notification
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Copy URL to clipboard
  const handleCopyUrl = useCallback((urlToCopy: string) => {
    navigator.clipboard.writeText(urlToCopy).then(() => {
      showToast("URL copied to clipboard");
    }).catch(() => {
      showToast("Failed to copy URL");
    });
  }, [showToast]);

  // AI-powered search
  const handleAiSearch = useCallback(async () => {
    if (!aiQuery.trim() || bookmarks.length === 0) return;
    setIsAiSearching(true);
    setAiMatchedIds(null);
    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: aiQuery,
          bookmarks: bookmarks.map((b) => ({ id: b.id, title: b.title, url: b.url })),
        }),
      });
      const data = await res.json();
      if (data.matchedIds) {
        setAiMatchedIds(data.matchedIds);
        showToast(`AI found ${data.matchedIds.length} matching bookmark${data.matchedIds.length !== 1 ? "s" : ""}`);
      } else {
        showToast(data.error || "AI search failed");
      }
    } catch {
      showToast("AI search failed. Try again.");
    } finally {
      setIsAiSearching(false);
    }
  }, [aiQuery, bookmarks, showToast]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("bookmarks-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newBookmark = payload.new as Bookmark;
          setBookmarks((prev) => {
            // Avoid duplicates (from optimistic update)
            if (prev.some((b) => b.id === newBookmark.id)) return prev;
            return [newBookmark, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedId = payload.old.id as string;
          setBookmarks((prev) => prev.filter((b) => b.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user.id]);

  // Add bookmark
  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !title.trim()) return;

    setIsAdding(true);

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({ url: url.trim(), title: title.trim(), user_id: user.id })
      .select()
      .single();

    if (error) {
      showToast("Failed to add bookmark. Please try again.");
    } else if (data) {
      // Optimistic: add immediately (realtime will skip duplicate)
      setBookmarks((prev) => {
        if (prev.some((b) => b.id === data.id)) return prev;
        return [data, ...prev];
      });
      setUrl("");
      setTitle("");
      showToast("Bookmark added");
    }

    setIsAdding(false);
  };

  // Delete bookmark
  const handleDeleteBookmark = async (id: string) => {
    // Optimistic removal
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (error) {
      showToast("Failed to delete. Refreshing...");
      // Re-fetch on error
      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setBookmarks(data);
    } else {
      showToast("Bookmark deleted");
    }
  };

  // Sign out
  const handleSignOut = async () => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/auth/signout";
    document.body.appendChild(form);
    form.submit();
  };

  const userDisplayName =
    user.user_metadata?.full_name || user.email || "User";
  const userAvatar = user.user_metadata?.avatar_url;

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh" }}>
      {/* Ambient glows */}
      <div className="ambient-glow ambient-glow-1" />
      <div className="ambient-glow ambient-glow-2" />

      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          borderBottom: "1px solid var(--border-color)",
          position: "relative",
          zIndex: 10,
          backdropFilter: "blur(20px)",
          background: "rgba(10, 10, 15, 0.8)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Smart Bookmark
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {userAvatar && (
              <img
                src={userAvatar}
                alt="Avatar"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "2px solid var(--border-color)",
                }}
                referrerPolicy="no-referrer"
              />
            )}
            <span
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              {userDisplayName}
            </span>
          </div>
          <button className="btn-ghost" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "40px 24px",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Add Bookmark Form */}
        <div
          className="glass-card animate-fade-in-up"
          style={{ padding: "28px", marginBottom: "32px" }}
        >
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>Add a Bookmark</span>
          </h2>
          <form
            onSubmit={handleAddBookmark}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <input
              type="text"
              className="input-field"
              placeholder="Title — e.g. My Favorite Article"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input
              type="url"
              className="input-field"
              placeholder="URL — e.g. https://example.com"
              value={url}
              onChange={handleUrlChange}
              required
            />
            {isFetchingTitle && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Fetching page title...
              </span>
            )}
            <button
              type="submit"
              className="btn-glow"
              disabled={isAdding}
              style={{
                opacity: isAdding ? 0.7 : 1,
                cursor: isAdding ? "not-allowed" : "pointer",
                alignSelf: "flex-start",
                marginTop: "4px",
              }}
            >
              {isAdding ? "Adding..." : "Save Bookmark"}
            </button>
          </form>
        </div>

        {/* Stats section */}
        {bookmarks.length > 0 && (
          <div
            className="glass-card"
            style={{
              padding: "16px 24px",
              marginBottom: "32px",
              display: "flex",
              justifyContent: "space-around",
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {bookmarks.length}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Bookmarks
              </div>
            </div>
            <div style={{ width: "1px", background: "var(--border-color)" }} />
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {new Set(bookmarks.map((b) => {
                  try { return new URL(b.url).hostname; } catch { return b.url; }
                })).size}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Domains
              </div>
            </div>
            <div style={{ width: "1px", background: "var(--border-color)" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {bookmarks.length > 0
                  ? getRelativeTime(new Date(bookmarks[0].created_at))
                  : "—"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Last Added
              </div>
            </div>
          </div>
        )}

        {/* Bookmarks heading */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Your Bookmarks
          </h2>
          <span
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              background: "var(--bg-card)",
              padding: "4px 12px",
              borderRadius: "999px",
              border: "1px solid var(--border-color)",
            }}
          >
            {bookmarks.length} saved
          </span>
        </div>

        {/* Search section */}
        {bookmarks.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            {/* Search mode toggle */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <button
                className={isAiMode ? "btn-ghost" : "btn-glow"}
                onClick={() => {
                  setIsAiMode(false);
                  setAiMatchedIds(null);
                  setAiQuery("");
                }}
                style={{ padding: "8px 16px", fontSize: "0.8rem" }}
              >
                Search
              </button>
              <button
                className={isAiMode ? "btn-glow" : "btn-ghost"}
                onClick={() => {
                  setIsAiMode(true);
                  setSearchQuery("");
                }}
                style={{ padding: "8px 16px", fontSize: "0.8rem" }}
              >
                AI Search
              </button>
            </div>

            {isAiMode ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder='Ask AI — e.g. "find my React tutorials" or "cooking videos I saved"'
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
                  style={{ fontSize: "0.85rem" }}
                  disabled={isAiSearching}
                />
                <button
                  className="btn-glow"
                  onClick={handleAiSearch}
                  disabled={isAiSearching || !aiQuery.trim()}
                  style={{
                    padding: "10px 20px",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap",
                    opacity: isAiSearching ? 0.7 : 1,
                  }}
                >
                  {isAiSearching ? "Searching..." : "Ask AI"}
                </button>
              </div>
            ) : (
              <input
                type="text"
                className="input-field"
                placeholder="Search bookmarks by title or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: "0.85rem" }}
              />
            )}

            {/* AI results indicator */}
            {isAiMode && aiMatchedIds !== null && !isAiSearching && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "8px 14px",
                  background: "rgba(139, 92, 246, 0.1)",
                  border: "1px solid rgba(139, 92, 246, 0.2)",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  color: "var(--accent-purple)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  AI found {aiMatchedIds.length} result{aiMatchedIds.length !== 1 ? "s" : ""}
                  {aiMatchedIds.length > 0 ? " matching your query" : ""}
                </span>
                <button
                  onClick={() => {
                    setAiMatchedIds(null);
                    setAiQuery("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {(() => {
          let displayBookmarks = bookmarks;

          // AI mode filtering
          if (isAiMode && aiMatchedIds !== null) {
            displayBookmarks = bookmarks.filter((b) => aiMatchedIds.includes(b.id));
          }
          // Normal search filtering
          else if (!isAiMode && searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            displayBookmarks = bookmarks.filter(
              (b) =>
                b.title.toLowerCase().includes(q) ||
                b.url.toLowerCase().includes(q)
            );
          }

          if (bookmarks.length === 0) {
            return (
              <div className="empty-state animate-fade-in">
                <p
                  style={{
                    fontSize: "1rem",
                    color: "var(--text-secondary)",
                    marginBottom: "4px",
                  }}
                >
                  No bookmarks yet
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Add your first bookmark above to get started!
                </p>
              </div>
            );
          }

          if (displayBookmarks.length === 0) {
            return (
              <div className="empty-state animate-fade-in">
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {isAiMode
                    ? "AI couldn\u2019t find any matching bookmarks. Try a different query."
                    : <>No bookmarks match &ldquo;{searchQuery}&rdquo;</>}
                </p>
              </div>
            );
          }

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {displayBookmarks.map((bookmark, index) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onDelete={handleDeleteBookmark}
                  onCopy={handleCopyUrl}
                  index={index}
                />
              ))}
            </div>
          );
        })()}
      </main>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function getRelativeTime(date: Date): string {
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
