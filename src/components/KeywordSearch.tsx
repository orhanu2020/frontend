import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Tweet, UserSearchResult } from "../types";
import LoadingSpinner from "./LoadingSpinner";
import UserSearchResultComponent from "./UserSearchResult";

const KEYWORD_SEARCH_STORAGE_KEY = "keywordSearchState";
const USER_PAGE_SIZE = 10;

const getDefaultSince = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
};

function loadKeywordSearchState(): {
  searchKeyword: string;
  sinceDate: string;
  untilDate: string;
  tweetPages: Tweet[][];
  tweetCursors: (string | null)[];
  tweetHasNextPage: boolean;
  currentTweetPageIndex: number;
  allUserResults: UserSearchResult[];
  currentUserPageIndex: number;
} | null {
  try {
    const raw = sessionStorage.getItem(KEYWORD_SEARCH_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object") return null;
    return {
      searchKeyword: typeof p.searchKeyword === "string" ? p.searchKeyword : "",
      sinceDate: typeof p.sinceDate === "string" ? p.sinceDate : getDefaultSince(),
      untilDate: typeof p.untilDate === "string" ? p.untilDate : new Date().toISOString().split("T")[0],
      tweetPages: Array.isArray(p.tweetPages) ? p.tweetPages : [],
      tweetCursors: Array.isArray(p.tweetCursors) ? p.tweetCursors : [],
      tweetHasNextPage: Boolean(p.tweetHasNextPage),
      currentTweetPageIndex: typeof p.currentTweetPageIndex === "number" ? p.currentTweetPageIndex : -1,
      allUserResults: Array.isArray(p.allUserResults) ? p.allUserResults : [],
      currentUserPageIndex: typeof p.currentUserPageIndex === "number" ? p.currentUserPageIndex : -1,
    };
  } catch {
    return null;
  }
}

const KeywordSearch: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUserSelect = (user: UserSearchResult) => {
    if (user.userName) {
      if (user.platform?.toLowerCase() === "twitter") {
        navigate(`/twitter/${user.userName}`);
      } else {
        navigate(`/users/${user.userName}`);
      }
    }
  };

  const saved = loadKeywordSearchState();
  const hasSaved = saved && (saved.searchKeyword !== "" || saved.tweetPages.length > 0 || saved.allUserResults.length > 0);

  // Search state – restore from sessionStorage when returning to the page
  const [searchKeyword, setSearchKeyword] = useState(() => (hasSaved && saved ? saved.searchKeyword : ""));
  const [searchLoading, setSearchLoading] = useState(false);

  const [sinceDate, setSinceDate] = useState(() => (hasSaved && saved ? saved.sinceDate : getDefaultSince()));
  const [untilDate, setUntilDate] = useState(() => (hasSaved && saved ? saved.untilDate : new Date().toISOString().split("T")[0]));
  const [tweetResults, setTweetResults] = useState<Tweet[]>(() => {
    if (!hasSaved || !saved) return [];
    const idx = saved.currentTweetPageIndex;
    const page = saved.tweetPages[idx];
    return Array.isArray(page) ? page.slice(0, 10) : [];
  });
  const [userResults, setUserResults] = useState<UserSearchResult[]>(() => {
    if (!hasSaved || !saved) return [];
    const start = saved.currentUserPageIndex * USER_PAGE_SIZE;
    return saved.allUserResults.slice(start, start + USER_PAGE_SIZE);
  });

  const [tweetPages, setTweetPages] = useState<Tweet[][]>(() => (hasSaved && saved ? saved.tweetPages : []));
  const [currentTweetPageIndex, setCurrentTweetPageIndex] = useState<number>(() => (hasSaved && saved ? saved.currentTweetPageIndex : -1));
  const [tweetCursors, setTweetCursors] = useState<(string | null)[]>(() => (hasSaved && saved ? saved.tweetCursors : []));
  const [tweetHasNextPage, setTweetHasNextPage] = useState<boolean>(() => (hasSaved && saved ? saved.tweetHasNextPage : false));
  const [loadingMoreTweets, setLoadingMoreTweets] = useState(false);

  const [allUserResults, setAllUserResults] = useState<UserSearchResult[]>(() => (hasSaved && saved ? saved.allUserResults : []));
  const [currentUserPageIndex, setCurrentUserPageIndex] = useState<number>(() => (hasSaved && saved ? saved.currentUserPageIndex : -1));

  // Persist search state so results survive navigation (e.g. go to account page and back)
  useEffect(() => {
    if (searchKeyword.trim() !== "" || tweetPages.length > 0 || allUserResults.length > 0) {
      sessionStorage.setItem(
        KEYWORD_SEARCH_STORAGE_KEY,
        JSON.stringify({
          searchKeyword,
          sinceDate,
          untilDate,
          tweetPages,
          tweetCursors,
          tweetHasNextPage,
          currentTweetPageIndex,
          allUserResults,
          currentUserPageIndex,
        })
      );
    }
  }, [
    searchKeyword,
    sinceDate,
    untilDate,
    tweetPages,
    tweetCursors,
    tweetHasNextPage,
    currentTweetPageIndex,
    allUserResults,
    currentUserPageIndex,
  ]);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      setError("Please enter a keyword to search");
      return;
    }
    if (sinceDate && untilDate && new Date(untilDate) < new Date(sinceDate)) {
      setError("Until date cannot be before since date");
      return;
    }

    setSearchLoading(true);
    setError(null);
    setTweetResults([]);
    setUserResults([]);
    setTweetPages([]);
    setCurrentTweetPageIndex(-1);
    setTweetCursors([]);
    setTweetHasNextPage(false);
    setAllUserResults([]);
    setCurrentUserPageIndex(-1);

    try {
      // Perform both searches in parallel; tweet search uses time range when provided
      const [tweetResult, userResult] = await Promise.allSettled([
        api.searchByKeyword(searchKeyword, "tweet", "Latest", undefined, sinceDate, untilDate),
        api.searchByKeyword(searchKeyword, "user", undefined),
      ]);

      let tweetCount = 0;
      let userCount = 0;
      const errors: string[] = [];

      if (tweetResult.status === "fulfilled") {
        const tweets = tweetResult.value.results as Tweet[];
        const nextCursor = tweetResult.value.nextCursor || null;
        const hasNext = tweetResult.value.hasNextPage || false;
        
        // Initialize first page
        setTweetPages([tweets]);
        setCurrentTweetPageIndex(0);
        setTweetCursors([nextCursor]);
        setTweetResults(tweets.slice(0, 10));
        setTweetHasNextPage(hasNext);
        tweetCount = tweetResult.value.count;
        console.log("Tweet search successful:", tweets.length, "tweets", "hasNextPage:", hasNext);
      } else {
        const errorMsg = tweetResult.reason?.response?.data?.message || 
                         tweetResult.reason?.message || 
                         "Tweet search failed";
        console.error("Tweet search failed:", tweetResult.reason);
        errors.push(`Tweet search: ${errorMsg}`);
      }

      if (userResult.status === "fulfilled") {
        const users = userResult.value.results as UserSearchResult[];
        setAllUserResults(users);
        setCurrentUserPageIndex(0);
        setUserResults(users.slice(0, USER_PAGE_SIZE));
        userCount = userResult.value.count;
        console.log("User search successful:", users.length, "users");
      } else {
        const errorMsg = userResult.reason?.response?.data?.message || 
                         userResult.reason?.message || 
                         "User search failed";
        console.error("User search failed:", userResult.reason);
        errors.push(`User search: ${errorMsg}`);
      }

      const totalCount = tweetCount + userCount;
      if (totalCount > 0) {
        setSuccess("Search completed successfully");
        if (errors.length > 0) {
          // Show partial success with errors
          setError(errors.join("; "));
        }
      } else {
        if (errors.length > 0) {
          setError(errors.join("; "));
        } else {
          setError("No results found");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Search failed");
    } finally {
      setSearchLoading(false);
    }
  };


  const handleNextTweetPage = async () => {
    if (loadingMoreTweets) {
      return;
    }

    const nextIndex = currentTweetPageIndex + 1;
    
    // Check if we already have this page in memory
    if (nextIndex < tweetPages.length) {
      // Use cached page
      setCurrentTweetPageIndex(nextIndex);
      setTweetResults(tweetPages[nextIndex].slice(0, 10));
      // Update hasNextPage: true if there are more cached pages OR if current page has a cursor
      const hasMoreCachedPages = nextIndex + 1 < tweetPages.length;
      const currentCursor = tweetCursors[nextIndex];
      setTweetHasNextPage(hasMoreCachedPages || (currentCursor !== null && currentCursor !== ""));
      return;
    }

    // Need to fetch new page
    const currentCursor = tweetCursors[currentTweetPageIndex];
    if (!currentCursor) {
      return; // No more pages
    }

    setLoadingMoreTweets(true);
    setError(null);

    try {
      const result = await api.searchByKeyword(
        searchKeyword,
        "tweet",
        "Latest",
        currentCursor,
        sinceDate,
        untilDate
      );

      if (result.status === "success") {
        const newTweets = (result.results as Tweet[]) ?? [];
        const nextCursor = result.nextCursor || null;
        const hasNext = result.hasNextPage || false;

        if (newTweets.length === 0) {
          // No more results from API - don't add empty page or advance; disable Next
          setTweetHasNextPage(false);
          setSuccess("No more tweets");
          return;
        }

        // Add new page to memory
        setTweetPages((prev) => [...prev, newTweets]);
        setTweetCursors((prev) => [...prev, nextCursor]);
        setCurrentTweetPageIndex(nextIndex);
        setTweetResults(newTweets.slice(0, 10));
        setTweetHasNextPage(hasNext);
        setSuccess(`Loaded ${newTweets.length} tweets`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load next page");
    } finally {
      setLoadingMoreTweets(false);
    }
  };

  const handlePreviousTweetPage = () => {
    if (currentTweetPageIndex <= 0) {
      return; // Already on first page
    }

    const prevIndex = currentTweetPageIndex - 1;
    setCurrentTweetPageIndex(prevIndex);
    setTweetResults(tweetPages[prevIndex].slice(0, 10));
    // Update hasNextPage: true if there are more cached pages OR if current page has a cursor
    const hasMoreCachedPages = prevIndex + 1 < tweetPages.length;
    const currentCursor = tweetCursors[prevIndex];
    setTweetHasNextPage(hasMoreCachedPages || (currentCursor !== null && currentCursor !== ""));
  };

  const handleNextUserPage = () => {
    const nextIndex = currentUserPageIndex + 1;
    const startIndex = nextIndex * USER_PAGE_SIZE;
    const endIndex = startIndex + USER_PAGE_SIZE;
    
    if (startIndex >= allUserResults.length) {
      return; // No more pages
    }

    setCurrentUserPageIndex(nextIndex);
    setUserResults(allUserResults.slice(startIndex, endIndex));
  };

  const handlePreviousUserPage = () => {
    if (currentUserPageIndex <= 0) {
      return; // Already on first page
    }

    const prevIndex = currentUserPageIndex - 1;
    const startIndex = prevIndex * USER_PAGE_SIZE;
    const endIndex = startIndex + USER_PAGE_SIZE;
    
    setCurrentUserPageIndex(prevIndex);
    setUserResults(allUserResults.slice(startIndex, endIndex));
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "24px", fontSize: "28px", fontWeight: "700", color: "#333" }}>
        Keyword Search
      </h1>

      {error && (
        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px",
            color: "#856404",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: "#d4edda",
            border: "1px solid #28a745",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px",
            color: "#155724",
          }}
        >
          ✓ {success}
        </div>
      )}

      {/* Search Section */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h2 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: "600", color: "#333" }}>
          Search Now
        </h2>
        <p style={{ marginBottom: "16px", color: "#666", fontSize: "14px" }}>
          Searches both tweets and users simultaneously. Results will be displayed with icons to distinguish between them.
        </p>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
            Keyword
          </label>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Enter keyword to search..."
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "16px", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333", fontSize: "13px" }}>
              From (since)
            </label>
            <input
              type="date"
              value={sinceDate}
              onChange={(e) => setSinceDate(e.target.value)}
              style={{
                padding: "8px 10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333", fontSize: "13px" }}>
              To (until)
            </label>
            <input
              type="date"
              value={untilDate}
              onChange={(e) => setUntilDate(e.target.value)}
              min={sinceDate || undefined}
              style={{
                padding: "8px 10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleSearch}
            disabled={searchLoading}
            style={{
              padding: "10px 24px",
              backgroundColor: searchLoading ? "#6c757d" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: searchLoading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {searchLoading ? "Searching..." : "Search All"}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {(tweetResults.length > 0 || userResults.length > 0) && (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e0e0e0",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
          }}
        >
          <h2 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: "600", color: "#333" }}>
            Search Results
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* User Results (first) – same Load button as User Search */}
            {userResults.map((user, index) => (
              <UserSearchResultComponent
                key={`user-${index}`}
                user={user}
                onSelect={handleUserSelect}
              />
            ))}
            
            {/* User Pagination Controls */}
            {userResults.length > 0 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "16px" }}>
                <button
                  onClick={handlePreviousUserPage}
                  disabled={currentUserPageIndex <= 0}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: currentUserPageIndex <= 0 ? "#e0e0e0" : "#28a745",
                    color: currentUserPageIndex <= 0 ? "#999" : "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: currentUserPageIndex <= 0 ? "not-allowed" : "pointer",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "40px",
                    minHeight: "40px",
                    opacity: currentUserPageIndex <= 0 ? 0.5 : 1,
                  }}
                  title="Previous page"
                >
                  ◀
                </button>
                <button
                  onClick={handleNextUserPage}
                  disabled={(currentUserPageIndex + 1) * USER_PAGE_SIZE >= allUserResults.length}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: (currentUserPageIndex + 1) * USER_PAGE_SIZE >= allUserResults.length ? "#e0e0e0" : "#28a745",
                    color: (currentUserPageIndex + 1) * USER_PAGE_SIZE >= allUserResults.length ? "#999" : "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: (currentUserPageIndex + 1) * USER_PAGE_SIZE >= allUserResults.length ? "not-allowed" : "pointer",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "40px",
                    minHeight: "40px",
                    opacity: (currentUserPageIndex + 1) * USER_PAGE_SIZE >= allUserResults.length ? 0.5 : 1,
                  }}
                  title="Next page"
                >
                  ▶
                </button>
              </div>
            )}
            
            {/* Tweet Results (second) */}
            {tweetResults.map((tweet, index) => (
              <div
                key={`tweet-${index}`}
                style={{
                  padding: "16px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  backgroundColor: "#f8f9fa",
                  borderLeft: "4px solid #1DA1F2",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "20px" }}>🐦</span>
                  <span style={{ fontWeight: "600", color: "#1DA1F2" }}>Tweet</span>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Author:</strong> {tweet.authorUsername}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Text:</strong> {tweet.text}
                </div>
                <div style={{ display: "flex", gap: "16px", fontSize: "14px", color: "#666" }}>
                  <span>❤️ {tweet.likeCount || 0}</span>
                  <span>🔄 {tweet.retweetCount || 0}</span>
                  <span>📅 {tweet.createdAt}</span>
                </div>
              </div>
            ))}
            
            {/* Tweet Pagination Controls */}
            {tweetResults.length > 0 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "16px" }}>
                <button
                  onClick={handlePreviousTweetPage}
                  disabled={currentTweetPageIndex <= 0 || loadingMoreTweets}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: currentTweetPageIndex <= 0 ? "#e0e0e0" : "#007bff",
                    color: currentTweetPageIndex <= 0 ? "#999" : "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: currentTweetPageIndex <= 0 ? "not-allowed" : "pointer",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "40px",
                    minHeight: "40px",
                    opacity: currentTweetPageIndex <= 0 ? 0.5 : 1,
                  }}
                  title="Previous page"
                >
                  ◀
                </button>
                {loadingMoreTweets && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <LoadingSpinner />
                    <span style={{ color: "#666", fontSize: "14px" }}>Loading...</span>
                  </div>
                )}
                <button
                  onClick={handleNextTweetPage}
                  disabled={(currentTweetPageIndex + 1 >= tweetPages.length && !tweetHasNextPage) || loadingMoreTweets}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: (currentTweetPageIndex + 1 >= tweetPages.length && !tweetHasNextPage) ? "#e0e0e0" : "#007bff",
                    color: (currentTweetPageIndex + 1 >= tweetPages.length && !tweetHasNextPage) ? "#999" : "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: (currentTweetPageIndex + 1 >= tweetPages.length && !tweetHasNextPage) ? "not-allowed" : "pointer",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "40px",
                    minHeight: "40px",
                    opacity: (currentTweetPageIndex + 1 >= tweetPages.length && !tweetHasNextPage) ? 0.5 : 1,
                  }}
                  title="Next page"
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div
        style={{
          backgroundColor: "#e7f3ff",
          border: "1px solid #b3d9ff",
          borderRadius: "8px",
          padding: "16px",
          marginTop: "24px",
        }}
      >
        <p style={{ margin: 0, color: "#004085", fontSize: "14px" }}>
          <strong>ℹ️ Keyword Search:</strong> Use Twitter advanced search syntax for tweet searches.
          Examples: "AI" OR "Twitter", from:elonmusk, since:2024-01-01_00:00:00_UTC.
          See{" "}
          <a
            href="https://github.com/igorbrigadir/twitter-advanced-search"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#007bff" }}
          >
            Twitter Advanced Search Guide
          </a>{" "}
          for more examples.
        </p>
      </div>

    </div>
  );
};

export default KeywordSearch;
