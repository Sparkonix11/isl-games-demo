import { NextRequest, NextResponse } from 'next/server';

// Get the ISL prediction API URL from environment variable
// Default to local Python server on port 5000
const ISL_API_URL = process.env.NEXT_PUBLIC_ISL_API_URL || 'http://localhost:5000';

// GET handler for testing
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Predict API is running',
        isl_api_url: ISL_API_URL
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Forward the request to ISL prediction API
        const response = await fetch(`${ISL_API_URL}/api/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `ISL API error: ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Predict API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to connect to ISL recognition service. Run: python server.py',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
