// Utility to handle page initialization and navigation reliability

export const initializePage = async (pageType: 'register' | 'admin-login' | 'admin-dashboard' | 'admin-events') => {
  try {
    // Ensure DOM is ready
    if (typeof window !== 'undefined') {
      // Clear any stale state
      if (pageType === 'register') {
        // Clear any registration related localStorage if too old
        const registrationData = localStorage.getItem('registrationData');
        if (registrationData) {
          const data = JSON.parse(registrationData);
          const timestamp = new Date(data.timestamp);
          const now = new Date();
          const diff = now.getTime() - timestamp.getTime();
          // Clear if older than 1 hour
          if (diff > 3600000) {
            localStorage.removeItem('registrationData');
          }
        }
      }
      
      // Force a small delay to ensure proper state initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error initializing ${pageType} page:`, error);
    return false;
  }
};

export const navigateReliably = (url: string, fallbackToWindowLocation = true) => {
  try {
    // Try Next.js router first
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', url);
      window.location.reload();
    } else if (fallbackToWindowLocation) {
      window.location.href = url;
    }
  } catch (error) {
    console.error('Navigation error:', error);
    if (fallbackToWindowLocation && typeof window !== 'undefined') {
      window.location.href = url;
    }
  }
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError!;
};
