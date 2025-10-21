"use client";

import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { NextPage } from "next";
import { NotificationManager } from "~~/components/NotificationManager";

const SettingsPage: NextPage = () => {
  return (
    <div className="flex items-start justify-center p-4 sm:p-6 pb-24">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/"
            className="round-icon w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-base-content">Settings</h1>
            <p className="text-sm text-base-content/70">Manage your app preferences</p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Notifications Section */}
          <div className="glass-card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="round-icon w-10 h-10 bg-blue-500">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-base-content">Notifications</h2>
                <p className="text-sm text-base-content/70">Configure push notifications</p>
              </div>
            </div>

            <NotificationManager />
          </div>

          {/* App Information */}
          <div className="glass-card p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-base-content mb-4">About TapThatX</h3>
            <div className="space-y-2 text-sm text-base-content/80">
              <p>Version: 1.0.0</p>
              <p>A decentralized NFC payment system built with Web3 technology</p>
              <p>
                <span className="font-medium">Features:</span>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Progressive Web App (PWA) support</li>
                <li>Push notifications</li>
                <li>Offline functionality</li>
                <li>Secure NFC chip registration</li>
                <li>Blockchain-based payments</li>
              </ul>
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="glass-card p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-base-content mb-4">Install App</h3>
            <div className="space-y-3 text-sm text-base-content/80">
              <p>Add TapThatX to your home screen for the best experience:</p>

              <div className="space-y-2">
                <div className="font-medium">On iOS Safari:</div>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>Tap the Share button</li>
                  <li>Select &quot;Add to Home Screen&quot;</li>
                  <li>Tap &quot;Add&quot;</li>
                </ol>
              </div>

              <div className="space-y-2">
                <div className="font-medium">On Android Chrome:</div>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>Tap the menu (three dots)</li>
                  <li>Select &quot;Add to Home screen&quot;</li>
                  <li>Tap &quot;Add&quot;</li>
                </ol>
              </div>

              <div className="space-y-2">
                <div className="font-medium">On Desktop:</div>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>Look for the install icon in the address bar</li>
                  <li>Click &quot;Install&quot; when prompted</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
