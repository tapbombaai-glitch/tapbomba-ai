import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://tapbomba-ai-pdou.vercel.app";

    const response = await fetch(`${baseUrl}/api/doctor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: "doctor-test.js",
        language: "javascript",
        userMessage:
          "Find all real problems in this test code. Do not repair it.",
        code: `
function calculateTotal(price, quantity {
  const total = price * quantity;
  console.log("Total:", total);
  return total;
}

const result = calculateTotal(5000, 2);
console.log(\`Result: \${result}\`);
        `,
      }),
    });

    const data = await response.json();

    return NextResponse.json({
      success: response.ok,
      test: "BOMBA AI Doctor diagnostic test",
      doctorResponse: data,
    });
  } catch (error) {
    console.error("Doctor test error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Doctor test failed.",
      },
      { status: 500 }
    );
  }
}