import { NextRequest, NextResponse } from "next/server";
import { query } from "~~/utils/db";

/**
 * GET /api/bridge-requests/:requestId
 * Get bridge request details
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await params;

    // Validate requestId format (should be 0x + 64 hex chars)
    if (!requestId || !requestId.match(/^0x[0-9a-fA-F]{64}$/)) {
      return NextResponse.json({ error: "Invalid request ID format" }, { status: 400 });
    }

    // Fetch from database
    const result = await query(
      `
      SELECT
        request_id, user_address, chip_address, source_chain, dest_chain,
        token_address, amount, call_data, chip_signature, timestamp, nonce, created_at, expires_at
      FROM bridge_requests
      WHERE request_id = $1
    `,
      [requestId],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Bridge request not found" }, { status: 404 });
    }

    const request = result.rows[0];

    return NextResponse.json({
      requestId: request.request_id,
      userAddress: request.user_address,
      chipAddress: request.chip_address,
      sourceChain: request.source_chain,
      destChain: request.dest_chain,
      tokenAddress: request.token_address,
      amount: request.amount,
      callData: request.call_data,
      chipSignature: request.chip_signature,
      timestamp: request.timestamp,
      nonce: request.nonce,
      createdAt: request.created_at.toISOString(),
      expiresAt: request.expires_at.toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch bridge request" },
      { status: 500 },
    );
  }
}
