/* ============================================================
   Zone14 — Cloudflare R2 media API (Vercel serverless, pure Node, no deps)

   Product photos + hero-band reels live on R2 (FREE egress). This endpoint is
   the ONLY thing that holds the R2 write credentials — they live in Vercel env
   vars, never in the browser. The public site reads media through here too, so
   admin uploads show up live and there is no cross-origin/CORS problem.

     GET  /api/r2?action=media   → media.json      (per-jersey photos/videos)
     GET  /api/r2?action=hero    → hero-videos.json (hero band reels)
     POST /api/r2?action=upload  → auth; PUT an (already-compressed) file to R2
                                   and append it to the right manifest
     POST /api/r2?action=delete  → auth; drop an asset from a manifest (+ object)
     POST /api/r2?action=sort    → auth; persist a new image order for a jersey

   Writes require the `x-admin-token` header to equal MEDIA_ADMIN_TOKEN.

   SETUP (Vercel → Project → Settings → Environment Variables, Production):
     R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
     R2_BUCKET, R2_PUBLIC_URL, MEDIA_ADMIN_TOKEN
   ============================================================ */
import crypto from 'crypto';

const ACCOUNT = process.env.R2_ACCOUNT_ID;
const AKID    = process.env.R2_ACCESS_KEY_ID;
const SECRET  = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET  = process.env.R2_BUCKET;
const PUBLIC  = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
const TOKEN   = process.env.MEDIA_ADMIN_TOKEN;
const HOST    = ACCOUNT ? `${ACCOUNT}.r2.cloudflarestorage.com` : '';
const REGION  = 'auto';
const SERVICE = 's3';

const sha256hex = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const hmac = (key, str) => crypto.createHmac('sha256', key).update(str).digest();

/* SigV4-sign and send an S3 (path-style) request to R2. body is a Buffer. */
async function r2Request(method, key, body, contentType) {
  const payload = body || Buffer.alloc(0);
  const payloadHash = sha256hex(payload);
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  const canonicalUri = `/${BUCKET}/${encodedKey}`;

  const headers = { host: HOST, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate };
  if (contentType) headers['content-type'] = contentType;
  const sortedKeys = Object.keys(headers).sort();
  const signedHeaders = sortedKeys.join(';');
  const canonicalHeaders = sortedKeys.map((h) => `${h}:${headers[h]}\n`).join('');
  const canonicalRequest = [method, canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');

  const scope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(Buffer.from(canonicalRequest))].join('\n');
  const kSigning = hmac(hmac(hmac(hmac('AWS4' + SECRET, dateStamp), REGION), SERVICE), 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${AKID}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const resp = await fetch(`https://${HOST}${canonicalUri}`, {
    method,
    headers: { ...headers, Authorization: authorization },
    body: method === 'GET' || method === 'HEAD' ? undefined : payload,
  });
  return { status: resp.status, text: await resp.text() };
}

/* Manifests are small JSON files on R2 read via the public URL (no signing). */
async function loadManifest(name, fallback) {
  try {
    const r = await fetch(`${PUBLIC}/${name}?t=${Date.now()}`, { cache: 'no-store' });
    if (r.ok) return await r.json();
  } catch (_) { /* fall through */ }
  return fallback;
}
const saveManifest = (name, obj) =>
  r2Request('PUT', name, Buffer.from(JSON.stringify(obj, null, 2)), 'application/json');

/* Read the raw request body as a Buffer, whether Vercel handed us a parsed
   Buffer/string on req.body or left the stream for us to drain. */
async function readRawBody(req) {
  if (req.body) {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return Buffer.from(req.body, 'binary');
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const clean = (s, fallback) =>
  (s == null ? fallback : String(s)).replace(/[^\w.\-]/g, '_').slice(0, 80) || fallback;

export default async function handler(req, res) {
  const action = String((req.query && req.query.action) || '');
  res.setHeader('Cache-Control', 'no-store');

  // ---- Public reads (no auth) ----
  if (req.method === 'GET' && (action === 'media' || action === 'hero')) {
    const name = action === 'media' ? 'media.json' : 'hero-videos.json';
    const data = await loadManifest(name, action === 'media' ? {} : []);
    return res.status(200).json(data);
  }

  // ---- Writes (admin token required) ----
  if (req.method === 'POST') {
    if (!TOKEN || req.headers['x-admin-token'] !== TOKEN) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    if (!ACCOUNT || !AKID || !SECRET || !BUCKET || !PUBLIC) {
      return res.status(500).json({ error: 'R2 not configured' });
    }
    const q = req.query || {};

    if (action === 'upload') {
      const kind = q.kind === 'video' ? 'video' : q.kind === 'hero' ? 'hero' : 'image';
      const jerseyId = clean(q.jerseyId, '');
      const filename = clean(q.filename, `${Date.now()}.bin`);
      const contentType = req.headers['content-type'] || 'application/octet-stream';
      const body = await readRawBody(req);
      if (!body || !body.length) return res.status(400).json({ error: 'empty body' });
      if (kind !== 'hero' && !jerseyId) return res.status(400).json({ error: 'jerseyId required' });

      const key = (kind === 'hero' ? 'showcase' : jerseyId) +
        `/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${filename}`;
      const put = await r2Request('PUT', key, body, contentType);
      if (put.status >= 300) return res.status(502).json({ error: 'r2 put failed', detail: put.text.slice(0, 300) });
      const url = `${PUBLIC}/${key}`;

      if (kind === 'hero') {
        const hero = await loadManifest('hero-videos.json', []);
        hero.unshift({ id: key, videoUrl: url, videoPath: key, posterUrl: '', posterPath: '', sortOrder: 0, createdAt: Date.now() });
        await saveManifest('hero-videos.json', hero);
        return res.status(200).json({ url, key, entry: hero[0] });
      }
      const media = await loadManifest('media.json', {});
      if (!media[jerseyId]) media[jerseyId] = { images: [], videos: [] };
      const bucket = kind === 'video' ? 'videos' : 'images';
      const asset = { id: key, url, name: filename, type: kind === 'video' ? 'video' : 'image', storagePath: key, sortOrder: media[jerseyId][bucket].length };
      media[jerseyId][bucket].push(asset);
      await saveManifest('media.json', media);
      return res.status(200).json({ url, key, entry: asset });
    }

    if (action === 'delete') {
      let payload = {};
      try { payload = JSON.parse((await readRawBody(req)).toString('utf8') || '{}'); } catch (_) {}
      const { jerseyId, key, storagePath, hero } = payload;
      const objKey = storagePath || key;
      if (objKey) { try { await r2Request('DELETE', objKey, Buffer.alloc(0)); } catch (_) {} }
      if (hero) {
        const list = await loadManifest('hero-videos.json', []);
        await saveManifest('hero-videos.json', list.filter((v) => v.id !== key && v.videoPath !== objKey));
      } else if (jerseyId) {
        const media = await loadManifest('media.json', {});
        const b = media[jerseyId];
        if (b) {
          b.images = (b.images || []).filter((a) => a.id !== key && a.storagePath !== objKey);
          b.videos = (b.videos || []).filter((a) => a.id !== key && a.storagePath !== objKey);
          await saveManifest('media.json', media);
        }
      }
      return res.status(200).json({ ok: true });
    }

    if (action === 'sort') {
      let payload = {};
      try { payload = JSON.parse((await readRawBody(req)).toString('utf8') || '{}'); } catch (_) {}
      const { jerseyId, orderIds } = payload;   // orderIds: asset ids, first = primary
      if (!jerseyId || !Array.isArray(orderIds)) return res.status(400).json({ error: 'jerseyId + orderIds required' });
      const media = await loadManifest('media.json', {});
      const b = media[jerseyId];
      if (b && Array.isArray(b.images)) {
        b.images.sort((a, z) => orderIds.indexOf(a.id) - orderIds.indexOf(z.id));
        b.images.forEach((a, i) => { a.sortOrder = i; });
        await saveManifest('media.json', media);
      }
      return res.status(200).json({ ok: true });
    }
  }

  return res.status(400).json({ error: 'bad request' });
}
