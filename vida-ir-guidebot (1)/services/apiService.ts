
// FIX: Use a relative URL. The browser will automatically resolve this to the
// correct domain. For this to work in production, you would typically use a
// Load Balancer to route requests starting with `/api` to the backend service.
// For a simpler setup, you can replace this with the full deployed backend URL.
export const API_URL = '/api';

function getAuthHeaders() {
  const adminJwt = localStorage.getItem('admin_jwt');
  const headers = new Headers({ 'Content-Type': 'application/json' });
  // In a real app with Firebase, you'd also get and attach the Firebase ID token
  // const firebaseToken = await auth.currentUser?.getIdToken();
  // if (firebaseToken) headers.set('Authorization', `Bearer ${firebaseToken}`);
  if (adminJwt) {
    headers.set('X-Admin-Authorization', `Bearer ${adminJwt}`);
  }
  return headers;
}

export async function activateAdmin(passkey: string): Promise<void> {
  const headers = getAuthHeaders();
  const res = await fetch(`${API_URL}/admin/activate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ passkey }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Admin activation failed: ${errorBody}`);
  }
  
  const { adminToken } = await res.json();
  localStorage.setItem('admin_jwt', adminToken);
}

export async function deactivateAdmin(): Promise<void> {
  const headers = getAuthHeaders();
  const res = await fetch(`${API_URL}/admin/deactivate`, {
    method: 'POST',
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Admin deactivation failed: ${errorBody}`);
  }

  localStorage.removeItem('admin_jwt');
}

export async function getSignedUploadUrl(fileName: string, contentType: string): Promise<{ signedUrl: string, publicUrl: string }> {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/uploads/signed-url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fileName, contentType }),
    });
    if (!res.ok) throw new Error('Failed to get signed URL');
    return res.json();
}

export async function uploadFile(signedUrl: string, file: File) {
    const res = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
    });
    if (!res.ok) throw new Error('File upload to GCS failed');
}

export async function streamChatResponse(prompt: string, imageUrl?: string): Promise<AsyncGenerator<string>> {
  const headers = getAuthHeaders();
  const res = await fetch(`${API_URL}/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, imageUrl }),
  });

  if (!res.ok) {
    throw new Error('Chat API request failed');
  }

  if (!res.body) {
    throw new Error('Response body is missing');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  async function* generator(): AsyncGenerator<string> {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      yield decoder.decode(value, { stream: true });
    }
  }

  return generator();
}