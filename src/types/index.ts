// TypeScript interface stubs matching backend DTOs

export interface UserSearchResult {
  userName?: string;
  platform?: string;
  location?: string;
  createdAt?: string;
}

/** About profile from Twitter get_user_about API */
export interface AboutProfile {
  account_based_in?: string;
  location_accurate?: boolean;
  learn_more_url?: string;
  affiliate_username?: string;
  source?: string;
  username_changes?: { count?: string };
}

export interface User {
  id?: string;
  platformId?: string;
  platformName?: string;
  userName?: string;
  name?: string;
  url?: string;
  twitterUrl?: string;
  isVerified?: boolean;
  isBlueVerified?: boolean;
  verifiedType?: string;
  profilePicture?: string;
  coverPicture?: string;
  description?: string;
  location?: string;
  followers?: number;
  following?: number;
  status?: string;
  canDm?: boolean;
  canMediaTag?: boolean;
  createdAt?: string;
  fastFollowersCount?: number;
  favouritesCount?: number;
  hasCustomTimelines?: boolean;
  isTranslator?: boolean;
  mediaCount?: number;
  statusesCount?: number;
  possiblySensitive?: boolean;
  isAutomated?: boolean;
  automatedBy?: string;
  profileBio?: any;
  entities?: any;
  withheldInCountries?: string[];
  affiliatesHighlightedLabel?: any;
  pinnedTweetIds?: number[];
  firstSeenAt?: string;
  updatedAt?: string;
  /** About profile from Twitter get_user_about (account_based_in, location_accurate, etc.) */
  aboutProfile?: AboutProfile | Record<string, unknown>;
}

export interface Tweet {
  id?: string;
  text?: string;
  authorUsername?: string;
  createdAt?: string;
  likeCount?: number;
  retweetCount?: number;
}

export interface LoadTweetResponse {
  status?: string;
  message?: string;
  dateRange?: string;
}

export interface AccountMonitoringEntry {
  /** Keyword: account name when keywordType=account, or word in tweet when keywordType=tweet. */
  keyword?: string;
  /** @deprecated Use keyword. Kept for backward compatibility when reading old API responses. */
  accountName?: string;
  platform: string;
  /** "account" or "tweet" (case insensitive). Default "account". */
  keywordType?: string;
  startTime: string; // yyyy-MM-dd
  endTime: string; // yyyy-MM-dd
}

export interface KeywordSearchEntry {
  keyword: string;
  searchType: string; // "tweet" or "user"
  queryType?: string; // "Latest" or "Top" (only for tweet search)
  platform: string; // "twitter"
}
