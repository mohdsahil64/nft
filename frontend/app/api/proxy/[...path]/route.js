/**
 * API Proxy — forwards requests from frontend to backend.
 * This solves wallet dApp browser restrictions on cross-origin requests.
 * Wallet browsers allow same-origin requests (futuremintnft.live/api/proxy/...)
 * but block cross-origin requests to Railway backend directly.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const baseUrl = BACKEND_URL.startsWith('http') ? BACKEND_URL : `https://${BACKEND_URL}`;

async function handler(request, { params }) {
  const path = params.path.join('/');
  const url = `${baseUrl}/${path}`;

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Forward authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const fetchOptions = {
      method: request.method,
      headers,
    };

    // Forward body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = await request.json();
        fetchOptions.body = JSON.stringify(body);
      } catch (_) {}
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch (error) {
    return Response.json(
      { success: false, message: 'Server connection failed. Please try again.' },
      { status: 502 }
    );
  }
}

export async function GET(request, context) {
  return handler(request, context);
}

export async function POST(request, context) {
  return handler(request, context);
}

export async function PUT(request, context) {
  return handler(request, context);
}

export async function DELETE(request, context) {
  return handler(request, context);
}

export async function PATCH(request, context) {
  return handler(request, context);
}
