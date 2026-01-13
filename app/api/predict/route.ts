import { NextRequest, NextResponse } from 'next/server';

// In development, proxy to local Python server
// In production (Vercel), the Python serverless function handles /api/predict directly
const ISL_API_URL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000'
    : '';

// GET handler for testing
export async function GET() {
    // In production, this route won't be hit (Python handles it)
    // In development, proxy to local Python server
    if (process.env.NODE_ENV === 'development') {
        try {
            const response = await fetch(`${ISL_API_URL}/api/predict`);
            const data = await response.json();
            return NextResponse.json(data);
        } catch {
            return NextResponse.json({
                status: 'error',
                message: 'Local Python server not running. Run: python server.py'
            }, { status: 503 });
        }
    }
    return NextResponse.json({ status: 'ok', message: 'Predict API is running' });
}

export async function POST(request: NextRequest) {
    // In production on Vercel, the Python serverless function at /api/predict.py
    // will handle this route directly, so this code won't run.
    // This proxy is only for local development.

    if (process.env.NODE_ENV !== 'development') {
        // This shouldn't happen in production as Python handles it
        return NextResponse.json({ error: 'Route misconfiguration' }, { status: 500 });
    }

    try {
        const body = await request.json();

        // Forward the request to local Python server
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
