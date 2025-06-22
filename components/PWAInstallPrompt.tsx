'use client';

import { Download, Smartphone, Wifi, WifiOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

/**
 * PWA Install Prompt Component
 * Handles PWA installation prompts and displays PWA status
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPromptProps {
  className?: string;
  showOnlyWhenInstallable?: boolean;
}

export default function PWAInstallPrompt({
  className = '',
  showOnlyWhenInstallable = false,
}: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installationResult, setInstallationResult] = useState<string | null>(null);

  useEffect(() => {
    // Check if app is already installed
    const checkInstallation = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInWebAppChrome = window.matchMedia('(display-mode: minimal-ui)').matches;

      setIsInstalled(isStandalone || isInWebAppiOS || isInWebAppChrome);
    };

    // Check online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      setInstallationResult('App installed successfully!');
      setTimeout(() => setInstallationResult(null), 5000);
    };

    checkInstallation();
    updateOnlineStatus();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setInstallationResult('Installation started...');
      } else {
        setInstallationResult('Installation cancelled');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
      setInstallationResult('Installation failed. Please try again.');
    } finally {
      setIsInstalling(false);
      setTimeout(() => setInstallationResult(null), 5000);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Show again after 24 hours
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Check if prompt was recently dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < twentyFourHours) {
        setShowPrompt(false);
      }
    }
  }, []);

  // Don't show if only installable and not installable
  if (showOnlyWhenInstallable && !deferredPrompt) {
    return null;
  }

  // Don't show if already installed and only showing when installable
  if (showOnlyWhenInstallable && isInstalled) {
    return null;
  }

  return (
    <div className={`pwa-install-prompt ${className}`}>
      {/* Installation Result Message */}
      {installationResult && (
        <div className="fixed top-4 right-4 z-50">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <p className="text-green-800 text-sm">{installationResult}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PWA Status Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              PWA Status
            </CardTitle>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <Badge variant={isInstalled ? 'default' : 'secondary'}>
                {isInstalled ? 'Installed' : 'Not Installed'}
              </Badge>
            </div>
          </div>
          <CardDescription>
            {isInstalled
              ? 'App is installed and ready to use offline'
              : 'Install this app for a better experience'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Installation Prompt */}
          {showPrompt && deferredPrompt && !isInstalled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-2">Install Trae AI Agency</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Get faster access and work offline with our Progressive Web App.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleInstallClick}
                      disabled={isInstalling}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isInstalling ? 'Installing...' : 'Install App'}
                    </Button>
                    <Button onClick={handleDismiss} variant="outline" size="sm">
                      Later
                    </Button>
                  </div>
                </div>
                <Button onClick={handleDismiss} variant="ghost" size="sm" className="p-1 h-auto">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* PWA Features */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-900">PWA Features:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${isInstalled ? 'bg-green-500' : 'bg-gray-300'}`}
                />
                <span className={isInstalled ? 'text-green-700' : 'text-gray-500'}>
                  Offline Access
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${isInstalled ? 'bg-green-500' : 'bg-gray-300'}`}
                />
                <span className={isInstalled ? 'text-green-700' : 'text-gray-500'}>
                  Fast Loading
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-green-700">Push Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-green-700">Background Sync</span>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Connection Status:</span>
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            {!isOnline && (
              <p className="text-xs text-gray-500 mt-1">
                You're offline, but the app continues to work!
              </p>
            )}
          </div>

          {/* Manual Installation Instructions */}
          {!deferredPrompt && !isInstalled && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="font-medium text-sm mb-2">Manual Installation:</h5>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <strong>Chrome/Edge:</strong> Menu → Install Trae AI Agency
                </p>
                <p>
                  <strong>Safari:</strong> Share → Add to Home Screen
                </p>
                <p>
                  <strong>Firefox:</strong> Menu → Install
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook for PWA installation status
 */
export function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const checkInstallation = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInWebAppChrome = window.matchMedia('(display-mode: minimal-ui)').matches;

      setIsInstalled(isStandalone || isInWebAppiOS || isInWebAppChrome);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    checkInstallation();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      return outcome === 'accepted';
    } catch (error) {
      console.error('Installation failed:', error);
      return false;
    }
  };

  return {
    isInstalled,
    isInstallable,
    install,
  };
}
