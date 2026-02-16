import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT || 8000);
const ROOT = process.cwd();

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function safePath(urlPath) {
  const cleaned = normalize(urlPath.replace(/^\/+/, ''));
  const fullPath = join(ROOT, cleaned);
  if (!fullPath.startsWith(ROOT)) {
    return null;
  }
  return fullPath;
}

createServer((req, res) => {
  const requestPath = req.url === '/' ? '/index.html' : decodeURIComponent(req.url || '/index.html');
  const fullPath = safePath(requestPath);

  if (!fullPath || !existsSync(fullPath) || statSync(fullPath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  const extension = extname(fullPath).toLowerCase();
  const contentType = CONTENT_TYPES[extension] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store'
  });

  createReadStream(fullPath).pipe(res);
}).listen(PORT, HOST, () => {
  console.log(`Static server running at http://${HOST}:${PORT}`);
});
