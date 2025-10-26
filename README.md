# Tap That X

> Hardware-grade 2FA security for blockchain transactions using NFC chips

**Tap That X** transforms NFC chips into physical two-factor authentication devices for blockchain transactions. The chip doesn't just initiate actions—it **approves them in real-time** through cryptographic signature verification. Combined with **Avail Nexus SDK**, this enables hardware-secured cross-chain operations with unified balance management across multiple networks.

**Built for ETHOnline 2025 Hackathon**

## 🚀 Live Demo

- **Main App**: [tapthatx.xyz](https://tapthatx.xyz)
- **Avail Nexus Integration**: [tap-that-x-wipbridge.up.railway.app](https://tap-that-x-wipbridge.up.railway.app/) - Chip-authorized cross-chain bridging demo

**🌐 Powered by Avail Nexus SDK** (`@avail-project/nexus-core`)
- Cross-chain balance aggregation via `getUnifiedBalances()`
- Secure cross-chain bridging via `bridge()`
- Physical chip verification for high-value transfers

## 🔑 Key Innovation

**Physical 2FA Authentication**: Your NFC chip becomes a hardware security key that must physically approve every transaction through cryptographic signature verification.

**Cross-Chain Security**: Chip-authorized transactions combined with Avail Nexus SDK enable secure bridging, unified balance queries, and multi-chain operations—all protected by physical device verification.

**Demo Use Case**: Configure your chip to top up gas on Base Sepolia. Tap to initiate → chip signature verifies authorization → Nexus SDK executes cross-chain bridge from Sepolia → unified balances confirm successful top-up. High-value transactions now require physical presence.

---

## 🎯 The Problem

**Security Vulnerabilities:**
- Software wallets vulnerable to phishing and malware
- No physical verification for high-value transactions
- Unauthorized access if private keys are compromised

**Cross-Chain Complexity:**
- Manual network switching and bridge interfaces
- Fragmented balance views across multiple chains
- Complex multi-step processes for cross-chain transfers

## 💡 The Solution

**Hardware-Grade 2FA with Cross-Chain Capabilities:**

1. **Configure**: Set chip action (e.g., bridge ETH from Sepolia → Base)
2. **Tap to Initiate**: Physical chip tap creates authorization request
3. **Verify & Approve**: System validates chip signature (EIP-712)—transaction won't execute without verified chip approval
4. **Execute**: Avail Nexus SDK handles cross-chain bridging automatically
5. **Confirm**: Unified Balances API shows updated balances across all chains

**Result**: Hardware-secured, cross-chain operations with physical approval requirement

## 🏗 Architecture

### Chip-Authorized Cross-Chain Flow with Push Notifications

```
┌─────────────────┐
│  Mobile Device  │ ──── 1. User taps NFC chip
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   NFC Chip      │ ──── 2. Signs EIP-712 authorization
└────────┬────────┘       (bridge request with parameters)
         │
         │ HTTP POST
         ▼
┌─────────────────────────┐
│  Backend Relay Server   │ ──── 3. Verifies chip signature
└────────┬────────────────┘       Validates chip ownership
         │
         │ Push Notification (VAPID)
         ▼
┌─────────────────────────┐
│  Desktop Interface      │ ──── 4. User receives notification
└────────┬────────────────┘       "Approve bridge request?"
         │
         │ User clicks notification
         ▼
┌─────────────────────────────────────────────────────────┐
│  /bridge/execute/[requestId] page                       │
│  • Verifies authorized wallet                           │
│  • Reads chip address from signature                    │
│  • Confirms chip ownership                              │
└────────┬────────────────────────────────────────────────┘
         │
         │ User connects wallet
         ▼
┌─────────────────────────────────────────────────────────┐
│  Avail Nexus SDK Initialization                         │
│  • sdk.initialize(window.ethereum)                      │
│  • Validates wallet owns chip                           │
└────────┬────────────────────────────────────────────────┘
         │
         │ Execute bridge
         ▼
┌─────────────────────────────────────────────────────────┐
│  sdk.bridge({ token, amount, chainId, sourceChains })   │
│  • Routes ETH from Sepolia → Base Sepolia               │
│  • Handles chain switching automatically                │
└────────┬────────────────────────────────────────────────┘
         │
         │ Confirm success
         ▼
┌─────────────────────────────────────────────────────────┐
│  sdk.getUnifiedBalances()                               │
│  • Shows updated balances across all chains             │
│  • Confirms Base Sepolia received ETH                   │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Security Model

### Physical 2FA Verification

The NFC chip functions as a hardware authentication device—transactions cannot execute without physical chip presence and signature verification.

**Authorization Flow:**

1. **Chip Registration**: NFC chip registers to wallet address via EIP-712 signature proving chip ownership
2. **Action Configuration**: User pre-configures permitted actions (transfers, bridges, swaps)
3. **Tap Initiation**: User taps chip to create authorization request
4. **Signature Verification**: System validates chip's cryptographic signature
5. **Ownership Check**: Smart contract confirms chip is registered to wallet address
6. **Execution**: Only after verification does transaction execute

**Security Features:**

- **EIP-712 Typed Signatures**: Structured data signing prevents blind signature attacks
- **Nonce-Based Replay Protection**: Each signature uses unique nonce, preventing reuse
- **Timestamp Expiration**: 5-minute authorization window limits stolen signature lifespan
- **Chip Ownership Registry**: On-chain verification that chip belongs to authorized wallet
- **Physical Presence Requirement**: Transaction fails without physical chip tap and valid signature

### Cross-Chain Security with Avail Nexus

Combining chip-based 2FA with Avail Nexus SDK creates hardware-secured cross-chain operations:

- **Unified Balance Queries**: View assets across all chains via `sdk.getUnifiedBalances()` before executing transfers
- **Chip-Authorized Bridging**: Cross-chain transfers require physical chip approval via `sdk.bridge()`
- **Push Notification Layer**: Desktop receives real-time notification when chip tap initiates action
- **Multi-Device Verification**: Mobile tap + Desktop approval creates two-factor security
- **Real-Time Verification**: Chip signature validated before Nexus executes bridge transaction
- **Post-Transaction Confirmation**: Unified balances confirm successful cross-chain transfer

---

## 📜 Smart Contracts

Deployed on **Base Sepolia** (Chain ID: 84532)

- **TapThatXRegistry** (`0x91D05d5B8913BCdA59f1923dC6831B108154Df22`) - Manages chip-to-owner registration
- **TapThatXProtocol** (`0x0F917750db157D65c6c14e5Ce5828a250569afE1`) - Executes chip-authorized contract calls



## 🛠 Technology Stack

- **Smart Contracts:** Foundry, Solidity, OpenZeppelin
- **Frontend:** Next.js 15, React 19, TailwindCSS, Wagmi, Viem
- **NFC Integration:** @arx-research/libhalo
- **Cross-Chain:** @avail-project/nexus-core
- **Deployment:** Railway, Base Sepolia testnet

## 🚀 Getting Started

### Requirements

- Node.js >= 22.14.0
- npm or yarn
- MetaMask or compatible Web3 wallet
- NFC-capable mobile device with Arx HaLo chip

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/tap-that-x.git
cd tap-that-x

# Install dependencies
yarn install
```

### Environment Setup

Create `.env.local` file in `packages/nextjs/`:

```env
# Enable experimental Corepack (for Yarn)
# Relayer account (must be funded with testnet ETH)
RELAYER_PRIVATE_KEY="0x..."

# WalletConnect Project ID (required for RainbowKit)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="your_project_id"

# Alchemy API key (optional, improves RPC reliability)
NEXT_PUBLIC_ALCHEMY_API_KEY="your_alchemy_api_key"

# VAPID keys for web push notifications 
VAPID_PUBLIC_KEY="your_vapid_public_key"
VAPID_PRIVATE_KEY="your_vapid_private_key"
VAPID_SUBJECT="mailto:your_email@example.com"

# Database (PostgreSQL) -  for bridge request storage
DATABASE_URL="postgresql://localhost:5432/tapthatx_dev"
```

### Run Locally

```bash
# Start Next.js development server
yarn start

# Visit http://localhost:3000
```

### Deploy Contracts

```bash
# Start local Foundry chain (optional for local testing)
yarn chain

# Deploy contracts to Base Sepolia
yarn deploy

# Deploy to other networks (update foundry.toml)
yarn deploy -- --network <network-name>
```

## 📊 Current Status

### ✅ What Works

**Physical 2FA Security:**

1. ✅ NFC chip registration with EIP-712 signature verification
2. ✅ Hardware-grade transaction approval via physical chip tap
3. ✅ Push notification layer for desktop approval (VAPID)
4. ✅ Multi-device verification (mobile tap + desktop approval)
5. ✅ Chip ownership validation on-chain (TapThatXRegistry)
6. ✅ Nonce-based replay protection prevents signature reuse
7. ✅ Timestamp expiration (5-minute window) for authorization freshness
8. ✅ Physical presence requirement—no execution without verified chip

**Avail Nexus SDK Integration:**

- ✅ **Unified Balances**: `sdk.getUnifiedBalances()` aggregates ETH/tokens across Sepolia & Base Sepolia
- ✅ **Cross-Chain Bridging**: `sdk.bridge()` executes chip-authorized cross-chain ETH transfers
- ✅ **SDK Initialization**: Global SDK instance with MetaMask provider integration
- ✅ **Balance Utilities**: Parse and format Nexus responses for UI display
- ✅ **Security Integration**: Chip signature verification before Nexus bridge execution

**End-to-End Workflows:**

1. ✅ Register NFC chip to wallet address
2. ✅ Configure chip action (token transfer, cross-chain bridge, etc.)
3. ✅ Tap phone to authorize execution (generates EIP-712 signature)
4. ✅ System verifies chip signature and ownership
5. ✅ Gasless execution via backend relayer or Nexus SDK
6. ✅ Unified balances confirm transaction success across chains

**Smart Contract Security:**

- ✅ EIP-712 typed signature verification (TapThatXAuth)
- ✅ Replay attack protection (nonce tracking)
- ✅ Chip ownership registry (TapThatXRegistry)
- ✅ Generic `executeAuthorizedCall` for arbitrary contract interactions
- ✅ ReentrancyGuard protection on critical functions



## 🌐 Avail Nexus SDK Integration

Tap That X integrates **Avail Nexus SDK** (`@avail-project/nexus-core`) to enable hardware-secured cross-chain operations. The integration combines physical chip verification with Nexus's unified balance queries and cross-chain bridging capabilities.

### SDK Implementation Overview

**Key Files:**
- [`packages/nextjs/utils/nexus.ts`](packages/nextjs/utils/nexus.ts) - SDK initialization and wrapper functions
- [`packages/nextjs/app/balances/page.tsx`](packages/nextjs/app/balances/page.tsx) - Unified balance UI implementation
- [`packages/nextjs/app/bridge/execute/[requestId]/page.tsx`](packages/nextjs/app/bridge/execute/[requestId]/page.tsx) - Chip-authorized bridge execution
- [`packages/nextjs/utils/balance-utils.ts`](packages/nextjs/utils/balance-utils.ts) - Balance parsing and formatting utilities
- [`packages/nextjs/types/nexus.ts`](packages/nextjs/types/nexus.ts) - TypeScript type definitions


### Core SDK Usage

#### 1. SDK Initialization (`utils/nexus.ts`)

**Global SDK Instance:**
```typescript
import { NexusSDK } from "@avail-project/nexus-core";
import { Buffer } from "buffer";
import process from "process";

// Browser polyfills required for Nexus SDK
if (typeof window !== "undefined") {
  window.Buffer = Buffer;
  window.process = process;
}

// Initialize SDK in testnet mode
export const sdk = new NexusSDK({ network: "testnet" });

// Initialize with MetaMask provider
export async function initializeWithProvider(provider: any) {
  if (!sdk.isInitialized()) {
    await sdk.initialize(provider);
  }
}
```

---

#### 2. Unified Balance Aggregation (`app/balances/page.tsx`)

**Purpose:** Query and display token balances across multiple chains in a single view.

**SDK Method:** `sdk.getUnifiedBalances()`

**Implementation:**
```typescript
// Fetch cross-chain balances
const unifiedBalances = await sdk.getUnifiedBalances();

// Example response structure:
[
  {
    symbol: "ETH",
    balance: "0.5",
    balanceInFiat: 1250.00,
    decimals: 18,
    breakdown: [
      {
        balance: "0.3",
        balanceInFiat: 750.00,
        chain: { id: 11155111, name: "Sepolia", logo: "..." },
        contractAddress: "0x...",
        decimals: 18
      },
      {
        balance: "0.2",
        balanceInFiat: 500.00,
        chain: { id: 84532, name: "Base Sepolia", logo: "..." },
        contractAddress: "0x...",
        decimals: 18
      }
    ]
  }
]
```

**UI Features:**
- Displays total USD value across all chains
- Token-grouped accordion view with per-chain breakdowns
- Real-time refresh capability
- Auto-initialization on wallet connection

**Code Reference:** [`packages/nextjs/app/balances/page.tsx:72-79`](packages/nextjs/app/balances/page.tsx#L72-L79)


---

#### 3. Chip-Authorized Cross-Chain Bridging (`app/bridge/execute/[requestId]/page.tsx`)

**Purpose:** Execute hardware-secured cross-chain ETH transfers using NFC chip verification + Avail Nexus SDK.

**SDK Method:** `sdk.bridge(params)`

**Implementation:**
```typescript
// Execute cross-chain bridge with chip authorization
const result = await sdk.bridge({
  token: "ETH",              // Token to bridge
  amount: 0.01,              // Amount in ETH (not wei)
  chainId: 84532,            // Destination chain (Base Sepolia)
  sourceChains: [11155111]   // Source chain (Sepolia)
});

// Returns transaction hash and status
{
  success: true,
  transactionHash: "0x...",
  sourceChain: 11155111,
  destinationChain: 84532
}
```

**Security Flow:**

1. **Chip Authorization**: User taps NFC chip → generates EIP-712 signature with bridge parameters
2. **Backend Verification**: Server recovers chip address from signature, validates ownership
3. **Push Notification**: Desktop receives real-time notification with bridge request details
4. **Desktop Approval**: User clicks notification → opens bridge execution page
5. **Wallet Connection**: User connects MetaMask → Nexus SDK initializes
6. **Ownership Check**: System confirms connected wallet owns the chip
7. **Bridge Execution**: `sdk.bridge()` executes cross-chain transfer
8. **Confirmation**: Unified balances refresh to show updated balances on destination chain

**Security Features:**
- **EIP-712 Chip Signature**: Bridge request signed by physical chip, verified on backend
- **Push Notification 2FA**: Desktop receives notification requiring explicit approval
- **Multi-Device Verification**: Mobile chip tap + desktop approval creates two-factor security
- **Wallet Ownership Validation**: Connected wallet must be registered chip owner
- **Physical Presence Requirement**: Transaction fails without valid chip tap
- **Post-Execution Verification**: Unified balances confirm successful cross-chain transfer

**Code References:**
- Bridge execution: [`packages/nextjs/app/bridge/execute/[requestId]/page.tsx:205-213`](packages/nextjs/app/bridge/execute/[requestId]/page.tsx#L205-L213)
- Signature verification: [`packages/nextjs/app/bridge/execute/[requestId]/page.tsx:105-154`](packages/nextjs/app/bridge/execute/[requestId]/page.tsx#L105-L154)

---

#### 4. Balance Processing Utilities (`utils/balance-utils.ts`)

**Purpose:** Transform Nexus SDK responses into UI-friendly data structures.

**Implementation:**

```typescript
// Key utility functions
export function parseUnifiedBalances(unifiedBalances: UnifiedBalance[]): ParsedBalance[] {
  // Flattens nested SDK response into per-chain token entries
}

export function groupByToken(balances: ParsedBalance[]): Map<string, ParsedBalance[]> {
  // Groups balances by token symbol for accordion UI
}

export function getTotalValueUSD(balances: ParsedBalance[]): number {
  // Calculates total USD value across all chains
}

export function formatBalance(balance: string, decimals: number): string {
  // Formats token amounts with proper decimal precision
}
```

**Code Reference:** [`packages/nextjs/utils/balance-utils.ts:8-93`](packages/nextjs/utils/balance-utils.ts#L8-L93)

---

### Demo Use Case: Secure Cross-Chain Gas Top-Up

**Scenario:** User needs to top up gas on Base Sepolia but has ETH on Sepolia testnet.

**Traditional Approach:**
1. Visit bridge website
2. Connect wallet and approve spending
3. Switch to source network manually
4. Initiate bridge transaction
5. Wait for confirmations
6. Switch to destination network
7. Verify balance manually

**With Tap That X + Avail Nexus:**

1. **Configure Chip** (one-time):
   ```typescript
   // Set chip action: Bridge 0.01 ETH Sepolia → Base Sepolia
   await configuration.setConfiguration(chip, bridgeConfig);
   ```

2. **Tap to Initiate**:
   - User taps NFC chip on mobile device
   - Chip generates EIP-712 signature authorizing bridge
   - Backend receives request and validates chip signature

3. **Push Notification**:
   ```typescript
   // Backend sends VAPID push notification to desktop
   await sendPushNotification({
     title: "Bridge Request Detected",
     body: "Approve 0.01 ETH bridge from Sepolia to Base?",
     url: `/bridge/execute/${requestId}`
   });
   ```

4. **Desktop Verification**:
   ```typescript
   // User clicks notification → opens bridge execution page
   // System verifies chip signature and ownership
   const chipAddress = recoverChipAddress(signature);
   const isOwner = await registry.hasChip(wallet, chipAddress);
   // Only proceeds if chip is registered to connected wallet
   ```

5. **Execute Bridge**:
   ```typescript
   // Nexus SDK handles cross-chain transfer
   const result = await sdk.bridge({
     token: "ETH",
     amount: 0.01,
     chainId: 84532,        // Base Sepolia
     sourceChains: [11155111]  // Sepolia
   });
   ```

6. **Confirm Success**:
   ```typescript
   // Unified balances show updated amounts
   const balances = await sdk.getUnifiedBalances();
   // Base Sepolia balance increased by 0.01 ETH
   ```

---

**Built with ❤️ using Avail Nexus SDK**

