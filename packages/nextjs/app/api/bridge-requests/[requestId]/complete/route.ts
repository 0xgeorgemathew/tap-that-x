import { NextRequest, NextResponse } from "next/server";
import { query } from "~~/utils/db";

/**
 * POST /api/bridge-requests/:requestId/complete
 * Mark bridge request as completed
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await params;
    const body = await req.json();
    const { txHash } = body;

    // Validate requestId
    if (!requestId || !requestId.match(/^0x[0-9a-fA-F]{64}$/)) {
      return NextResponse.json({ error: "Invalid request ID format" }, { status: 400 });
    }

    // Validate transaction hash
    if (!txHash || !txHash.match(/^0x[0-9a-fA-F]{64}$/)) {
      return NextResponse.json({ error: "Invalid transaction hash" }, { status: 400 });
    }

    // Update database
    const result = await query(
      `
      UPDATE bridge_requests
      SET status = 'completed', tx_hash = $1, completed_at = NOW()
      WHERE request_id = $2 AND status = 'pending'
      RETURNING *
    `,
      [txHash, requestId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Bridge request not found or already completed" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Bridge request marked as completed",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to complete bridge request" },
      { status: 500 },
    );
  }
}
