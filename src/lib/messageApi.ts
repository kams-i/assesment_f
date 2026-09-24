const BASE_URL = 'https://assesment-b.onrender.com/api/v4/message';

export async function fetchConversation(otherUserId: number, token: string) {
    const res = await fetch(`${BASE_URL}/conversation/${otherUserId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) throw new Error('Failed to fetch conversation');
    return res.json();
}

export async function sendHttpMessage(receiverId: number, content: string, token: string) {
    const res = await fetch(`${BASE_URL}/send`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receiverId, content })
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
}

export async function fetchContacts(token: string) {
    const res = await fetch(`${BASE_URL}/contacts`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) throw new Error('Failed to fetch contacts');
    return res.json();
}

export async function fetchAllUsers(token: string) {
    const res = await fetch(`${BASE_URL}/all-users`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) throw new Error('Failed to fetch all users');
    return res.json();
}

export async function deleteMessageApi(messageId: number, token: string) {
    const res = await fetch(`${BASE_URL}/${messageId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) throw new Error('Failed to delete message');
    return res.json();
}