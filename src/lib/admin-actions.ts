export async function adminAction(action: string, params: Record<string, unknown> = {}) {
  const res = await fetch('/api/admin-actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro')
  return data
}
