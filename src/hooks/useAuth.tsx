import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useMutation } from './useApi';
import { useLocalStorage } from './useLocalStorage';
// import { useMounted } from './useMounted'; // Commented out due to duplicate export issue

// Local useMounted implementation
function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  permissions?: string[];
  [key: string]: any;
};

type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
};

type LoginCredentials = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

type RegisterData = {
  email: string;
  password: string;
  name: string;
  [key: string]: any;
};

type AuthConfig = {
  apiBaseUrl?: string;
  tokenStorageKey?: string;
  userStorageKey?: string;
  autoRefresh?: boolean;
  refreshThreshold?: number; // Minutes before expiry to refresh
  redirectOnExpiry?: boolean;
  loginPath?: string;
  homePath?: string;
  publicPaths?: string[];
  rolePaths?: Record<string, string>;
};

type AuthState = {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

type AuthContextType = AuthState & {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  isTokenExpired: () => boolean;
  getAuthHeader: () => string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Default auth configuration
 */
const defaultAuthConfig: AuthConfig = {
  apiBaseUrl: '/api/auth',
  tokenStorageKey: 'auth_tokens',
  userStorageKey: 'auth_user',
  autoRefresh: true,
  refreshThreshold: 5, // 5 minutes
  redirectOnExpiry: true,
  loginPath: '/login',
  homePath: '/',
  publicPaths: ['/login', '/register', '/forgot-password'],
  rolePaths: {},
};

/**
 * Hook for authentication management
 * @param config - Authentication configuration
 * @returns Authentication state and utilities
 */
export function useAuth(config: AuthConfig = {}): AuthContextType {
  const authConfig = { ...defaultAuthConfig, ...config };
  const mounted = useMounted();

  const [storedTokens, setStoredTokens] = useLocalStorage<AuthTokens | null>(
    authConfig.tokenStorageKey!,
    null
  );
  const [storedUser, setStoredUser] = useLocalStorage<User | null>(
    authConfig.userStorageKey!,
    null
  );

  const [state, setState] = useState<AuthState>({
    user: storedUser,
    tokens: storedTokens,
    isAuthenticated: !!(storedTokens && storedUser),
    isLoading: false,
    error: null,
  });

  // API hooks for auth operations
  const loginMutation = useMutation<{ user: User; tokens: AuthTokens }>(
    `${authConfig.apiBaseUrl}/login`,
    { method: 'POST' }
  );

  const registerMutation = useMutation<{ user: User; tokens: AuthTokens }>(
    `${authConfig.apiBaseUrl}/register`,
    { method: 'POST' }
  );

  const refreshMutation = useMutation<{ tokens: AuthTokens }>(
    `${authConfig.apiBaseUrl}/refresh`,
    { method: 'POST' }
  );

  const logoutMutation = useMutation(
    `${authConfig.apiBaseUrl}/logout`,
    { method: 'POST' }
  );

  // Check if token is expired
  const isTokenExpired = useCallback((): boolean => {
    if (!state.tokens?.expiresAt) return false;
    return Date.now() >= state.tokens.expiresAt;
  }, [state.tokens]);

  // Check if token needs refresh
  const needsRefresh = useCallback((): boolean => {
    if (!state.tokens?.expiresAt || !authConfig.autoRefresh) return false;
    const thresholdMs = authConfig.refreshThreshold! * 60 * 1000;
    return Date.now() >= (state.tokens.expiresAt - thresholdMs);
  }, [state.tokens, authConfig.autoRefresh, authConfig.refreshThreshold]);

  // Get authorization header
  const getAuthHeader = useCallback((): string | null => {
    if (!state.tokens?.accessToken) return null;
    const tokenType = state.tokens.tokenType || 'Bearer';
    return `${tokenType} ${state.tokens.accessToken}`;
  }, [state.tokens]);

  // Update auth state
  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Clear auth data
  const clearAuthData = useCallback(() => {
    setStoredTokens(null);
    setStoredUser(null);
    updateAuthState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      error: null,
    });
  }, [setStoredTokens, setStoredUser, updateAuthState]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      updateAuthState({ isLoading: true, error: null });

      const result = await loginMutation.mutate(credentials);

      if (result) {
        const { user, tokens } = result;

        setStoredUser(user);
        setStoredTokens(tokens);

        updateAuthState({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Redirect to appropriate page
        if (typeof window !== 'undefined') {
          const redirectPath = user.role && authConfig.rolePaths?.[user.role]
            ? authConfig.rolePaths[user.role]
            : authConfig.homePath;
          window.location.href = redirectPath!;
        }
      }
    } catch (error) {
      updateAuthState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  }, [loginMutation, setStoredUser, setStoredTokens, updateAuthState, authConfig]);

  // Register function
  const register = useCallback(async (data: RegisterData) => {
    try {
      updateAuthState({ isLoading: true, error: null });

      const result = await registerMutation.mutate(data);

      if (result) {
        const { user, tokens } = result;

        setStoredUser(user);
        setStoredTokens(tokens);

        updateAuthState({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Redirect to home
        if (typeof window !== 'undefined') {
          window.location.href = authConfig.homePath!;
        }
      }
    } catch (error) {
      updateAuthState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      });
      throw error;
    }
  }, [registerMutation, setStoredUser, setStoredTokens, updateAuthState, authConfig]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    if (!state.tokens?.refreshToken) {
      clearAuthData();
      return;
    }

    try {
      const result = await refreshMutation.mutate({
        refreshToken: state.tokens.refreshToken,
      });

      if (result) {
        const { tokens } = result;

        setStoredTokens(tokens);
        updateAuthState({ tokens });
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthData();

      if (authConfig.redirectOnExpiry && typeof window !== 'undefined') {
        window.location.href = authConfig.loginPath!;
      }
    }
  }, [state.tokens, refreshMutation, setStoredTokens, updateAuthState, clearAuthData, authConfig]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      if (state.tokens?.accessToken) {
        await logoutMutation.mutate({
          token: state.tokens.accessToken,
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearAuthData();

      if (typeof window !== 'undefined') {
        window.location.href = authConfig.loginPath!;
      }
    }
  }, [state.tokens, logoutMutation, clearAuthData, authConfig]);

  // Update user data
  const updateUser = useCallback((userData: Partial<User>) => {
    if (state.user) {
      const updatedUser = { ...state.user, ...userData };
      setStoredUser(updatedUser);
      updateAuthState({ user: updatedUser });
    }
  }, [state.user, setStoredUser, updateAuthState]);

  // Clear error
  const clearError = useCallback(() => {
    updateAuthState({ error: null });
  }, [updateAuthState]);

  // Permission checks
  const hasPermission = useCallback((permission: string): boolean => {
    return state.user?.permissions?.includes(permission) ?? false;
  }, [state.user]);

  const hasRole = useCallback((role: string): boolean => {
    return state.user?.role === role;
  }, [state.user]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  }, [hasRole]);

  const hasAllRoles = useCallback((roles: string[]): boolean => {
    return roles.every(role => hasRole(role));
  }, [hasRole]);

  // Auto-refresh token
  useEffect(() => {
    if (!mounted || !authConfig.autoRefresh) return;

    const checkAndRefresh = () => {
      if (state.isAuthenticated && needsRefresh()) {
        refreshToken();
      }
    };

    // Check immediately
    checkAndRefresh();

    // Set up interval to check periodically
    const interval = setInterval(checkAndRefresh, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [mounted, state.isAuthenticated, needsRefresh, refreshToken, authConfig.autoRefresh]);

  // Handle token expiry
  useEffect(() => {
    if (mounted && state.isAuthenticated && isTokenExpired()) {
      if (state.tokens?.refreshToken) {
        refreshToken();
      } else {
        clearAuthData();
        if (authConfig.redirectOnExpiry && typeof window !== 'undefined') {
          window.location.href = authConfig.loginPath!;
        }
      }
    }
  }, [mounted, state.isAuthenticated, isTokenExpired, state.tokens, refreshToken, clearAuthData, authConfig]);

  return {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    clearError,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isTokenExpired,
    getAuthHeader,
  };
}

/**
 * Hook to access auth context
 * @returns Auth context
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

/**
 * Simple auth hook without context
 * @returns Basic auth state and utilities
 */
export function useSimpleAuth() {
  const [user, setUser] = useLocalStorage<User | null>('user', null);
  const [token, setToken] = useLocalStorage<string | null>('token', null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!(user && token);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setToken]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
  }, [setUser, setToken]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };
}

/**
 * Hook for role-based access control
 * @param allowedRoles - Array of allowed roles
 * @param requireAll - Whether all roles are required (default: false)
 * @returns Access control state
 */
export function useRoleAccess(allowedRoles: string[], requireAll: boolean = false) {
  const { user, hasRole, hasAnyRole, hasAllRoles } = useAuthContext();

  const hasAccess = requireAll
    ? hasAllRoles(allowedRoles)
    : hasAnyRole(allowedRoles);

  return {
    hasAccess,
    userRole: user?.role,
    allowedRoles,
    requireAll,
  };
}

/**
 * Hook for permission-based access control
 * @param requiredPermissions - Array of required permissions
 * @param requireAll - Whether all permissions are required (default: true)
 * @returns Access control state
 */
export function usePermissionAccess(requiredPermissions: string[], requireAll: boolean = true) {
  const { user, hasPermission } = useAuthContext();

  const hasAccess = requireAll
    ? requiredPermissions.every(permission => hasPermission(permission))
    : requiredPermissions.some(permission => hasPermission(permission));

  return {
    hasAccess,
    userPermissions: user?.permissions || [],
    requiredPermissions,
    requireAll,
  };
}

/**
 * Hook for protected routes
 * @param config - Route protection configuration
 * @returns Route protection state
 */
export function useProtectedRoute(config: {
  requireAuth?: boolean;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  redirectTo?: string;
} = {}) {
  const {
    requireAuth = true,
    allowedRoles = [],
    requiredPermissions = [],
    redirectTo = '/login',
  } = config;

  const { isAuthenticated, isLoading } = useAuthContext();
  const roleAccess = allowedRoles.length > 0 ? useRoleAccess(allowedRoles) : { hasAccess: true };
  const permissionAccess = requiredPermissions.length > 0
    ? usePermissionAccess(requiredPermissions)
    : { hasAccess: true };

  const hasAccess = (!requireAuth || isAuthenticated) &&
                   roleAccess.hasAccess &&
                   permissionAccess.hasAccess;

  const shouldRedirect = !isLoading && !hasAccess;

  useEffect(() => {
    if (shouldRedirect && typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  }, [shouldRedirect, redirectTo]);

  return {
    hasAccess,
    isLoading,
    shouldRedirect,
    isAuthenticated,
  };
}

/**
 * Auth Provider Component Props
 */
export type AuthProviderProps = {
  children: React.ReactNode;
  config?: AuthConfig;
};

/**
 * Auth Provider Component
 */
export function AuthProvider({ children, config = {} }: AuthProviderProps) {
  const authValue = useAuth(config);

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Higher-order component for route protection
 * @param Component - Component to protect
 * @param config - Protection configuration
 * @returns Protected component
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  config: Parameters<typeof useProtectedRoute>[0] = {}
) {
  return function ProtectedComponent(props: P) {
    const { hasAccess, isLoading } = useProtectedRoute(config);

    if (isLoading) {
      return <div>Loading...</div>; // Replace with your loading component
    }

    if (!hasAccess) {
      return null; // Component will redirect
    }

    return <Component {...props} />;
  };
}

/**
 * Utility function to get auth data from cookies (for SSR)
 * @param cookies - Cookie string
 * @returns Auth data
 */
export function getAuthFromCookies(cookies: string): {
  user: User | null;
  token: string | null;
} {
  const userMatch = cookies.match(/auth_user=([^;]+)/);
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);

  let user: User | null = null;
  let token: string | null = null;

  if (userMatch) {
    try {
      user = JSON.parse(decodeURIComponent(userMatch[1]));
    } catch (error) {
      console.error('Failed to parse user from cookies:', error);
    }
  }

  if (tokenMatch) {
    token = decodeURIComponent(tokenMatch[1]);
  }

  return { user, token };
}
