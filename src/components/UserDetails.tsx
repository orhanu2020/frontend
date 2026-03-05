import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Tweet } from '../types';
import { api } from '../services/api';
import DateRangePicker from './DateRangePicker';
import TweetList from './TweetList';
import LoadingSpinner from './LoadingSpinner';

const UserDetails: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingTweets, setLoadingTweets] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Set default dates: since = 30 days ago, until = today
  const getDefaultSinceDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };

  const getDefaultUntilDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [sinceDate, setSinceDate] = useState(getDefaultSinceDate());
  const [untilDate, setUntilDate] = useState(getDefaultUntilDate());

  useEffect(() => {
    const loadUser = async () => {
      if (!username) return;

      setLoadingUser(true);
      try {
        // Stub: API call returns null for now
        const userData = await api.getUserByUsername(username);
        setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, [username]);

  const handleLoadTweets = async () => {
    if (!username) return;

    setLoadingTweets(true);
    try {
      const loadedTweets = await api.getTweets(username, sinceDate, untilDate);
      setTweets(loadedTweets);
    } catch (error) {
      console.error('Error loading tweets:', error);
    } finally {
      setLoadingTweets(false);
    }
  };

  const handleSave = async () => {
    if (!username) return;

    setSavedMessage(null);
    setSavingUser(true);
    try {
      const saved = await api.saveUserToDatabase(username);
      if (saved) {
        setUser(saved);
        setSavedMessage('User saved to database.');
      } else {
        setSavedMessage('Could not save user.');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setSavedMessage('Error saving user. Please try again.');
    } finally {
      setSavingUser(false);
    }
  };

  if (loadingUser) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div style={{ padding: '20px' }}>
        <p>User not found</p>
        <button onClick={() => navigate('/keyword-search')}>Back to Search</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={() => navigate('/keyword-search')} style={{ marginBottom: '20px' }}>
        Back to Search
      </button>

      <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
        <h2>User Details</h2>
        <p>
          <strong>Username:</strong> {user.userName || 'N/A'}
        </p>
        <p>
          <strong>Name:</strong> {user.name || 'N/A'}
        </p>
        <p>
          <strong>Platform:</strong> {user.platformName || 'N/A'}
        </p>
        {user.description && (
          <p>
            <strong>Description:</strong> {user.description}
          </p>
        )}
        {user.followers !== undefined && (
          <p>
            <strong>Followers:</strong> {user.followers}
          </p>
        )}
        {user.following !== undefined && (
          <p>
            <strong>Following:</strong> {user.following}
          </p>
        )}

        {user.aboutProfile && Object.keys(user.aboutProfile).length > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
            <h3 style={{ marginBottom: '12px' }}>About Profile</h3>
            {Object.entries(user.aboutProfile as Record<string, unknown>).map(([key, val]) => {
              if (val === undefined || val === null) return null;
              const label = key.replace(/_/g, ' ');
              const display =
                typeof val === 'object' && val !== null && !Array.isArray(val)
                  ? (val as Record<string, unknown>).count != null
                    ? String((val as Record<string, unknown>).count)
                    : JSON.stringify(val)
                  : typeof val === 'boolean'
                    ? String(val)
                    : String(val);
              return (
                <p key={key}>
                  <strong>{label}:</strong> {display}
                </p>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <button
            onClick={handleSave}
            disabled={savingUser}
            style={{ marginRight: '12px' }}
          >
            {savingUser ? 'Saving...' : 'Save to database'}
          </button>
          {savedMessage && (
            <span style={{ color: savedMessage.startsWith('Error') || savedMessage.includes('Could not') ? '#c00' : '#080' }}>
              {savedMessage}
            </span>
          )}
        </div>
      </div>

      <DateRangePicker
        since={sinceDate}
        until={untilDate}
        onSinceChange={setSinceDate}
        onUntilChange={setUntilDate}
        onLoadTweets={handleLoadTweets}
      />

      {loadingTweets && <LoadingSpinner />}

      <TweetList tweets={tweets} />
    </div>
  );
};

export default UserDetails;

