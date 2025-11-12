import { useCallback, useEffect } from 'react';
import useLocalStorage from './useLocalStorage';
import type { User } from '../types';

// Hashing function for demonstration.
const simpleHash = (password: string, salt: string) => `hashed_${password}_with_${salt}`;

/**
 * A robust authentication hook.
 * @param users - The single source of truth for the list of users.
 * @returns An object with the current user session and login/logout functions.
 */
const useAuth = (users: User[]) => {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);

  /**
   * This effect adds a crucial layer of security and stability.
   * It runs whenever the master user list changes (e.g., from a data import)
   * or on initial app load. It ensures the session data stored in localStorage
   * is not stale.
   */
  useEffect(() => {
    if (currentUser) {
      // Find the corresponding user in the definitive list from the main app state.
      const freshUser = users.find(u => u.id === currentUser.id);
      
      // If the user is not found in the master list (e.g., deleted), the session is invalid.
      // Force a logout to ensure security.
      if (!freshUser) {
        setCurrentUser(null);
      } 
      // If the stored user data is different from the master list (e.g., role change),
      // update the session with the fresh data to keep it in sync without logging out.
      else if (JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(freshUser);
      }
    }
  }, [users, currentUser, setCurrentUser]);


  /**
   * Attempts to log in a user with the given credentials.
   * It always validates against the up-to-date 'users' list provided from the main app state.
   */
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
        const passwordHash = simpleHash(password, user.salt);
        if (passwordHash === user.passwordHash) {
            setCurrentUser(user);
            return true;
        }
    }
    return false;
  }, [users, setCurrentUser]);

  /**
   * Logs out the current user by clearing the session.
   */
  const logout = useCallback(() => {
    setCurrentUser(null);
  }, [setCurrentUser]);

  return { 
    currentUser, 
    login, 
    logout,
  };
};

export default useAuth;