import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as chains from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";
import { isBridgeAction, parseBridgeCallData } from "~~/utils/actionTemplates";
import { query } from "~~/utils/db";
import { getChainName, sendBridgeNotification } from "~~/utils/pushNotifications";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth/networks";

export const maxDuration = 30;

// IMPORTANT: Store this in environment variables
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { owner, chip, chipSignature, timestamp, nonce, chainId } = body;

    // Validate inputs
    if (!owner || !chip || !chipSignature || !timestamp || !nonce || !chainId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    if (!RELAYER_PRIVATE_KEY) {
      return NextResponse.json({ error: "Relayer not configured" }, { status: 500 });
    }

    // Get contracts for the specified chain
    const contracts = deployedContracts[chainId as keyof typeof deployedContracts] as any;
    if (!contracts?.TapThatXExecutor) {
      return NextResponse.json({ error: "Contracts not deployed on this network" }, { status: 400 });
    }

    // Get chain config from viem
    const chainConfig = Object.values(chains).find((c: any) => c.id === chainId);
    if (!chainConfig) {
      return NextResponse.json({ error: "Unsupported chain" }, { status: 400 });
    }

    // Setup wallet client
    const account = privateKeyToAccount(RELAYER_PRIVATE_KEY as `0x${string}`);
    const rpcUrl = getAlchemyHttpUrl(chainId) || chainConfig.rpcUrls.default.http[0];

    const client = createWalletClient({
      account,
      chain: chainConfig,
      transport: http(rpcUrl),
    }).extend(publicActions);

    // Check configuration to see if this is a bridge action
    const publicClient = createPublicClient({
      chain: chainConfig,
      transport: http(rpcUrl),
    });

    const configuration = (await publicClient.readContract({
      address: contracts.TapThatXConfiguration.address,
      abi: contracts.TapThatXConfiguration.abi,
      functionName: "getConfiguration",
      args: [owner as `0x${string}`, chip as `0x${string}`],
    })) as any;

    // Check if target is 0x0 (bridge action marker)
    if (isBridgeAction(configuration.targetContract)) {
      // Parse bridge parameters from callData
      const bridgeParams = parseBridgeCallData(configuration.staticCallData as `0x${string}`);
      if (!bridgeParams) {
        return NextResponse.json({ error: "Invalid bridge callData" }, { status: 400 });
      }

      // Generate unique request ID using crypto random
      const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      const requestId = `0x${randomBytes}`;

      // Store bridge request in database
      await query(
        `
        INSERT INTO bridge_requests (
          request_id, user_address, chip_address, chip_signature, source_chain, dest_chain,
          token_address, amount, timestamp, nonce
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
        [
          requestId,
          owner.toLowerCase(),
          chip.toLowerCase(),
          chipSignature,
          bridgeParams.sourceChainId,
          bridgeParams.destChainId,
          "0x0000000000000000000000000000000000000000", // ETH
          bridgeParams.amount.toString(),
          timestamp,
          nonce,
        ],
      );

      // Send push notification to user's desktop
      await sendBridgeNotification(owner, {
        requestId,
        amount: bridgeParams.amount.toString(),
        token: "ETH",
        sourceChainId: bridgeParams.sourceChainId,
        destChainId: bridgeParams.destChainId,
        sourceChainName: getChainName(bridgeParams.sourceChainId),
        destChainName: getChainName(bridgeParams.destChainId),
        url: `/bridge/execute/${requestId}`,
      });

      return NextResponse.json({
        success: true,
        requiresApproval: true,
        requestId,
        message: "Bridge request created. Check your desktop browser for approval notification.",
      });
    }

    // Normal execution path (non-bridge actions)
    // Call executeTap on TapThatXExecutor
    const hash = await client.writeContract({
      address: contracts.TapThatXExecutor.address,
      abi: contracts.TapThatXExecutor.abi,
      functionName: "executeTap",
      args: [
        owner as `0x${string}`,
        chip as `0x${string}`,
        chipSignature as `0x${string}`,
        BigInt(timestamp),
        nonce as `0x${string}`, // bytes32
      ],
    });

    // Wait for transaction receipt
    const receipt = await client.waitForTransactionReceipt({ hash });

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Execution relay failed" },
      { status: 500 },
    );
  }
}
