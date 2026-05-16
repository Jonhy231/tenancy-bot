// API helpers — centralised fetch calls

const handle = async (res) => {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const api = {
  get:    (url)         => fetch(url).then(handle),
  post:   (url, body)   => fetch(url, { method: 'POST',   headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handle),
  patch:  (url, body)   => fetch(url, { method: 'PATCH',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handle),
  delete: (url)         => fetch(url, { method: 'DELETE' }).then(handle),

  // Specific helpers
  getServer:      (gid)         => api.get(`/api/server/${gid}`),
  getChannels:    (gid)         => api.get(`/api/server/${gid}/channels`),
  getRoles:       (gid)         => api.get(`/api/server/${gid}/roles`),
  getTickets:     (gid, params) => api.get(`/api/server/${gid}/tickets?${new URLSearchParams(params || {})}`),
  updateConfig:   (gid, body)   => api.patch(`/api/server/${gid}/config`, body),
  addCategory:    (gid, body)   => api.post(`/api/server/${gid}/categories`, body),
  deleteCategory: (gid, catId)  => api.delete(`/api/server/${gid}/categories/${catId}`),
  sendPanel:      (gid)         => api.post(`/api/server/${gid}/panel/send`, {}),
  getServers:     ()            => api.get('/api/servers'),
}
