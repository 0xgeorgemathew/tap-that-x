"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { useTheme } from "next-themes";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Register Chip",
    href: "/register",
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link href={href} passHref className={`glass-nav-btn ${isActive ? "glass-nav-btn-active" : ""}`}>
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const { resolvedTheme } = useTheme();
  const { isConnected } = useAccount();
  const [mounted, setMounted] = React.useState(false);
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted
    ? resolvedTheme === "dark"
      ? "https://lucide.dev/logo.dark.svg"
      : "https://lucide.dev/logo.light.svg"
    : "https://lucide.dev/logo.light.svg";

  return (
    <div className="fixed top-0 left-0 right-0 flex justify-center pt-4 px-4 z-50 bg-transparent">
      <nav className="glass-navbar w-full max-w-6xl flex items-center justify-between px-6 py-3 rounded-full">
        {/* Left: Logo + Brand */}
        <Link href="/" passHref className="flex items-center gap-4 shrink-0">
          <div className="flex items-center justify-center w-16 h-16 relative">
            <Image src={logoSrc} alt="Lucide Logo" width={64} height={64} className="object-contain" />
          </div>
          <span className="font-bold text-2xl leading-tight bg-gradient-to-r from-[#F56566] to-black bg-clip-text text-transparent dark:from-[#F56566] dark:to-white">
            TapThat X
          </span>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {isConnected && (
            <Link
              href="/balances"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-base-content/10 hover:bg-base-content/20 text-base-content font-medium text-sm transition-all hover:scale-105 border border-base-content/20"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">View Unified Balance</span>
            </Link>
          )}
          <RainbowKitCustomConnectButton />
          {isLocalNetwork && <FaucetButton />}
        </div>
      </nav>
    </div>
  );
};
