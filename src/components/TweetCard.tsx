import React from "react";
import { Tweet } from "../types";

interface TweetCardProps {
  tweet: Tweet;
}

const TweetCard: React.FC<TweetCardProps> = ({ tweet }) => {
  return (
    <div
      style={{
        padding: "15px",
        border: "1px solid #ddd",
        margin: "10px 0",
        borderRadius: "5px",
      }}
    >
      <p>{tweet.text || "No text"}</p>
      <div style={{ fontSize: "0.9em", color: "#666", marginTop: "10px" }}>
        <span>Author: {tweet.authorUsername || "Unknown"}</span>
        {tweet.createdAt && (
          <span style={{ marginLeft: "15px" }}>Date: {tweet.createdAt}</span>
        )}
        {tweet.likeCount !== undefined && (
          <span style={{ marginLeft: "15px" }}>Likes: {tweet.likeCount}</span>
        )}
        {tweet.retweetCount !== undefined && (
          <span style={{ marginLeft: "15px" }}>
            Retweets: {tweet.retweetCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default TweetCard;



