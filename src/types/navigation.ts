/**
 * Типы для навигации и роутинга
 */

import React from 'react';

// Базовые типы навигации
export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ComponentType<any>;
  badge?: string | number;
  disabled?: boolean;
  external?: boolean;
  children?: NavigationItem[];
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ComponentType<any>;
  current?: boolean;
}

export interface MenuSection {
  id: string;
  title?: string;
  items: NavigationItem[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

// Типы для мобильной навигации
export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavigationItem[];
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

// Типы для табов
export interface TabItem {
  id: string;
  label: string;
  content?: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
  icon?: React.ComponentType<any>;
  closable?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'card';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  scrollable?: boolean;
}

// Типы для пагинации
export interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean | ((total: number, range: [number, number]) => string);
  pageSizeOptions?: string[];
  onChange: (page: number, pageSize: number) => void;
  onShowSizeChange?: (current: number, size: number) => void;
  disabled?: boolean;
  hideOnSinglePage?: boolean;
  simple?: boolean;
}

// Типы для роутинга
export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
  layout?: React.ComponentType<any>;
  guards?: RouteGuard[];
  meta?: RouteMeta;
  children?: RouteConfig[];
}

export interface RouteGuard {
  name: string;
  canActivate: (route: RouteConfig, params: any) => boolean | Promise<boolean>;
  redirectTo?: string;
}

export interface RouteMeta {
  title?: string;
  description?: string;
  keywords?: string[];
  requiresAuth?: boolean;
  permissions?: string[];
  layout?: string;
  breadcrumb?: BreadcrumbItem[];
  hideInMenu?: boolean;
  icon?: React.ComponentType<any>;
  order?: number;
}

// Типы для поиска в навигации
export interface NavigationSearchProps {
  items: NavigationItem[];
  placeholder?: string;
  onSelect: (item: NavigationItem) => void;
  maxResults?: number;
  showCategories?: boolean;
  recentItems?: NavigationItem[];
}

export interface SearchResult {
  item: NavigationItem;
  matches: {
    field: 'label' | 'href' | 'metadata';
    indices: [number, number][];
  }[];
  score: number;
}

// Типы для контекстного меню
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  children?: ContextMenuItem[];
  onClick?: () => void;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  trigger: 'click' | 'contextmenu' | 'hover';
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  children: React.ReactNode;
}

// Типы для сайдбара
export interface SidebarProps {
  items: MenuSection[];
  collapsed?: boolean;
  collapsible?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  width?: number;
  collapsedWidth?: number;
  theme?: 'light' | 'dark';
  position?: 'left' | 'right';
}

// Типы для навигационных хуков
export interface UseNavigationOptions {
  basePath?: string;
  preserveQuery?: boolean;
  shallow?: boolean;
  scroll?: boolean;
}

export interface NavigationState {
  currentPath: string;
  previousPath?: string;
  query: Record<string, string | string[]>;
  params: Record<string, string>;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface UseNavigationReturn {
  navigate: (path: string, options?: UseNavigationOptions) => void;
  goBack: () => void;
  goForward: () => void;
  replace: (path: string, options?: UseNavigationOptions) => void;
  reload: () => void;
  state: NavigationState;
}

// Типы для истории навигации
export interface NavigationHistoryItem {
  path: string;
  title?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface NavigationHistory {
  items: NavigationHistoryItem[];
  maxItems: number;
  add: (item: Omit<NavigationHistoryItem, 'timestamp'>) => void;
  remove: (path: string) => void;
  clear: () => void;
  getRecent: (count?: number) => NavigationHistoryItem[];
}

// Типы для навигационных событий
export type NavigationEventType =
  | 'beforeNavigate'
  | 'afterNavigate'
  | 'navigationError'
  | 'routeChange';

export interface NavigationEvent {
  type: NavigationEventType;
  from?: string;
  to: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface NavigationEventHandler {
  (event: NavigationEvent): void | Promise<void>;
}

// Типы для навигационных утилит
export interface NavigationUtils {
  isActive: (path: string, exact?: boolean) => boolean;
  buildPath: (path: string, params?: Record<string, any>) => string;
  parseQuery: (search: string) => Record<string, string | string[]>;
  buildQuery: (params: Record<string, any>) => string;
  matchPath: (
    pattern: string,
    path: string
  ) => { params: Record<string, string>; isExact: boolean } | null;
  getParentPath: (path: string) => string;
  getPathSegments: (path: string) => string[];
  normalizePath: (path: string) => string;
}
