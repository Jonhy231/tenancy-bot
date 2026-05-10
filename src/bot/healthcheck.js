// ═══════════════════════════════════════════
// healthcheck.js
// Servidor HTTP mínimo para Railway.
// Responde 200 en /health para que el
// healthcheck de Railway no mate el proceso.
// ═══════════════════════════════════════════

import http from "http";

const PORT = process.env.PORT || 3000;

export function startHealthServer(client) {
    const server = http.createServer((req, res) => {
        if (req.url === "/health" && req.method === "GET") {
            const isReady = client?.isReady() ?? false;
            const status  = isReady ? 200 : 503;
            res.writeHead(status, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                status: isReady ? "ok" : "starting",
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
            }));
        } else {
            res.writeHead(404);
            res.end();
        }
    });

    server.listen(PORT, () => {
        console.log(`[Healthcheck] Servidor HTTP escuchando en puerto ${PORT}`);
    });

    return server;
}
