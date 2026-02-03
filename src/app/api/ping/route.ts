import { NextResponse } from "next/server";

export async function GET() {
  const startTime = Date.now();

  try {
    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return NextResponse.json(
      {
        status: "ok",
        message: "Ping successful",
        responseTime,
        timestamp: new Date().toISOString(),
        server: "PERUSAHAAN API",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Ping failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET(); // Support both GET and POST for flexibility
}
