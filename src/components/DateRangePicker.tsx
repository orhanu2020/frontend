import React from "react";

interface DateRangePickerProps {
  since: string;
  until: string;
  onSinceChange: (date: string) => void;
  onUntilChange: (date: string) => void;
  onLoadTweets: () => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  since,
  until,
  onSinceChange,
  onUntilChange,
  onLoadTweets,
}) => {
  return (
    <div
      style={{ padding: "20px", border: "1px solid #ccc", margin: "20px 0" }}
    >
      <h3>Load Tweets</h3>
      <div style={{ marginBottom: "10px" }}>
        <label>
          Since:{" "}
          <input
            type="date"
            value={since}
            onChange={(e) => onSinceChange(e.target.value)}
            style={{ marginLeft: "10px" }}
          />
        </label>
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>
          Until:{" "}
          <input
            type="date"
            value={until}
            onChange={(e) => onUntilChange(e.target.value)}
            min={since || undefined}
            style={{ marginLeft: "10px" }}
          />
        </label>
      </div>
      <button onClick={onLoadTweets}>Load Tweets</button>
    </div>
  );
};

export default DateRangePicker;

