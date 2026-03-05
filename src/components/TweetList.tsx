import React from "react";
import { Tweet } from "../types";
import TweetCard from "./TweetCard";

interface TweetListProps {
  tweets: Tweet[];
}

const TweetList: React.FC<TweetListProps> = ({ tweets }) => {
  if (tweets.length === 0) {
    return <div style={{ padding: "20px" }}>Tweets will appear here</div>;
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Tweets ({tweets.length})</h3>
      {tweets.map((tweet, index) => (
        <TweetCard key={tweet.id || index} tweet={tweet} />
      ))}
    </div>
  );
};

export default TweetList;



