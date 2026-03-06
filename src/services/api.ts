// API service stub with placeholder methods
import axios from "axios";
import { User, UserSearchResult, Tweet, LoadTweetResponse, AccountMonitoringEntry, KeywordSearchEntry } from "../types";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8080/api/v1";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  /**
   * Search users by keyword
   * Calls GET /api/v1/users/search?keyword={keyword}
   * Returns simplified format: { userName, platform }
   */
  searchUsers: async (keyword: string): Promise<UserSearchResult[]> => {
    try {
      const response = await apiClient.get<UserSearchResult[]>(
        "/users/search",
        {
          params: { keyword },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },

  /**
   * Load Twitter account by account name
   * Calls POST /api/v1/loadTwitterAccount?accountName={accountName}
   */
  loadTwitterAccount: async (accountName: string): Promise<User | null> => {
    try {
      const response = await apiClient.post<User>(
        "/loadTwitterAccount",
        {},
        {
          params: { accountName },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error loading Twitter account:", error);
      if (error.response?.status === 204) {
        return null; // No content
      }
      throw error;
    }
  },

  /**
   * Get user details by username (includes about_profile when available).
   * Fetches from DB or from API without saving; use saveUserToDatabase to persist.
   */
  getUserByUsername: async (username: string): Promise<User | null> => {
    try {
      const response = await apiClient.get<User>(`/users/${encodeURIComponent(username)}`);
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      console.error("Error fetching user by username:", error);
      throw error;
    }
  },

  /**
   * Save user to database (fetch from API and persist). Call when user clicks Save on user details page.
   */
  saveUserToDatabase: async (username: string): Promise<User | null> => {
    try {
      const response = await apiClient.post<User>(
        `/users/${encodeURIComponent(username)}/save`
      );
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      console.error("Error saving user to database:", error);
      throw error;
    }
  },

  /**
   * Get tweets for a user within date range.
   * Calls GET /api/v1/users/{username}/tweets?since={since}&until={until}
   * since/until in yyyy-MM-dd.
   */
  getTweets: async (
    username: string,
    since: string,
    until: string
  ): Promise<Tweet[]> => {
    try {
      const response = await apiClient.get<Tweet[]>(
        `/users/${encodeURIComponent(username)}/tweets`,
        { params: { since, until } }
      );
      return response.data ?? [];
    } catch (error) {
      console.error("Error fetching tweets:", error);
      throw error;
    }
  },

  /**
   * Load tweets asynchronously for a user
   * Stub: returns placeholder response
   */
  loadTweets: async (
    username: string,
    since: string,
    until: string
  ): Promise<LoadTweetResponse> => {
    // TODO: Implement actual API call to POST /api/v1/load-tweet?username={username}&since={since}&until={until}
    return Promise.resolve({
      status: "stub",
      message: "Stub implementation",
      dateRange: `${since} to ${until}`,
    });
  },

  /**
   * Get all monitoring entries
   */
  getMonitoringEntries: async (): Promise<AccountMonitoringEntry[]> => {
    try {
      const response = await apiClient.get<AccountMonitoringEntry[]>(
        "/monitoring/entries"
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching monitoring entries:", error);
      throw error;
    }
  },

  /**
   * Add a single monitoring entry (keyword-based: account or tweet).
   */
  addMonitoringEntry: async (
    keyword: string,
    platform: string,
    keywordType: "account" | "tweet",
    startTime: string,
    endTime: string
  ): Promise<{ status: string; message: string }> => {
    try {
      const response = await apiClient.post<{ status: string; message: string }>(
        "/monitoring/entries",
        {},
        {
          params: { keyword, platform, keywordType, startTime, endTime },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding monitoring entry:", error);
      throw error;
    }
  },

  /**
   * Add multiple monitoring entries from multiline text
   */
  addMonitoringEntriesFromMultiline: async (
    multilineText: string
  ): Promise<{ status: string; message: string; count: number }> => {
    try {
      const response = await apiClient.post<{
        status: string;
        message: string;
        count: number;
      }>(
        "/monitoring/entries/multiline",
        {},
        {
          params: { multilineText },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding monitoring entries:", error);
      throw error;
    }
  },

  /**
   * Remove a monitoring entry by index
   */
  removeMonitoringEntry: async (
    index: number
  ): Promise<{ status: string; message: string }> => {
    try {
      const response = await apiClient.delete<{ status: string; message: string }>(
        `/monitoring/entries/${index}`
      );
      return response.data;
    } catch (error) {
      console.error("Error removing monitoring entry:", error);
      throw error;
    }
  },

  /**
   * Get all keyword search entries
   */
  getKeywordSearchEntries: async (): Promise<KeywordSearchEntry[]> => {
    try {
      const response = await apiClient.get<KeywordSearchEntry[]>(
        "/keyword-search/entries"
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching keyword search entries:", error);
      throw error;
    }
  },

  /**
   * Add a single keyword search entry
   */
  addKeywordSearchEntry: async (
    keyword: string,
    searchType: string,
    queryType?: string,
    platform: string = "twitter"
  ): Promise<{ status: string; message: string }> => {
    try {
      const params: any = { keyword, searchType, platform };
      if (queryType) {
        params.queryType = queryType;
      }
      const response = await apiClient.post<{ status: string; message: string }>(
        "/keyword-search/entries",
        {},
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding keyword search entry:", error);
      throw error;
    }
  },

  /**
   * Add multiple keyword search entries from multiline text
   */
  addKeywordSearchEntriesFromMultiline: async (
    multilineText: string
  ): Promise<{ status: string; message: string; count: number }> => {
    try {
      const response = await apiClient.post<{
        status: string;
        message: string;
        count: number;
      }>(
        "/keyword-search/entries/multiline",
        {},
        {
          params: { multilineText },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding keyword search entries:", error);
      throw error;
    }
  },

  /**
   * Remove a keyword search entry by index
   */
  removeKeywordSearchEntry: async (
    index: number
  ): Promise<{ status: string; message: string }> => {
    try {
      const response = await apiClient.delete<{ status: string; message: string }>(
        `/keyword-search/entries/${index}`
      );
      return response.data;
    } catch (error) {
      console.error("Error removing keyword search entry:", error);
      throw error;
    }
  },

  /**
   * Execute keyword search (synchronous).
   * For tweet search, optional since/until (yyyy-MM-dd) narrow the time range.
   */
  searchByKeyword: async (
    keyword: string,
    searchType: string,
    queryType?: string,
    cursor?: string,
    since?: string,
    until?: string
  ): Promise<{
    status: string;
    searchType: string;
    keyword: string;
    queryType?: string;
    count: number;
    results: Tweet[] | UserSearchResult[];
    hasNextPage: boolean;
    nextCursor: string;
  }> => {
    try {
      const params: Record<string, string> = { keyword, searchType };
      if (queryType) params.queryType = queryType;
      if (cursor) params.cursor = cursor;
      if (since) params.since = since;
      if (until) params.until = until;
      const response = await apiClient.post<{
        status: string;
        searchType: string;
        keyword: string;
        queryType?: string;
        count: number;
        results: Tweet[] | UserSearchResult[];
        hasNextPage: boolean;
        nextCursor: string;
      }>("/keyword-search/search", {}, { params });
      return response.data;
    } catch (error) {
      console.error("Error searching by keyword:", error);
      throw error;
    }
  },

  /**
   * Execute keyword search asynchronously (for tweet search)
   */
  searchByKeywordAsync: async (
    keyword: string,
    searchType: string,
    queryType?: string
  ): Promise<{ status: string; message: string; keyword: string; queryType?: string }> => {
    try {
      const params: any = { keyword, searchType };
      if (queryType) {
        params.queryType = queryType;
      }
      const response = await apiClient.post<{
        status: string;
        message: string;
        keyword: string;
        queryType?: string;
      }>("/keyword-search/search/async", {}, { params });
      return response.data;
    } catch (error) {
      console.error("Error starting async keyword search:", error);
      throw error;
    }
  },
};
