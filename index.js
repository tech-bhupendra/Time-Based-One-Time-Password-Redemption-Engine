const http = require('http');
const crypto = require('crypto');

// Simulated secure account store containing dynamic TOTP secret seeds
const ACCOUNT_VAULT = new Map([
    ['USER_PREMIUM_01', { secret: 'BASE32SECRETSEEDFORUSER1NATIVEENGINE', payload: 150, claimed: false }]
]);

// Helper to manually compute standard 6-digit TOTP codes using HMAC-SHA1
const generateTOTP = (secret) => {
    const epochStep = Math.floor(Date.now() / 30000); // 30-second execution window step
    const buffer = Buffer.alloc(8);
    
    // Write the current 30-second step window interval as a 64-bit big-endian integer
    for (let i = 7; i >= 0; i--) {
        buffer[i] = epochStep & 0xff;
        epochStep >>= 8;
    }

    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'utf-8')).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    
    // Extract a 4-byte dynamic binary code chunk from the hash payload bytes
    const codeBinary = ((hmac[offset] & 0x7f) << 24) |
                       ((hmac[offset + 1] & 0xff) << 16) |
                       ((hmac[offset + 2] & 0xff) << 8) |
                       (hmac[offset + 3] & 0xff);

    return String(codeBinary % 1000000).padStart(6, '0');
};

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/totp/claim') {
        let streamPayload = '';
        req.on('data', chunk => { streamPayload += chunk; });
        req.on('end', () => {
            try {
                const { accountId, code } = JSON.parse(streamPayload);
                if (!ACCOUNT_VAULT.has(accountId)) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, error: 'Target account profile missing' }));
                }

                const userRecord = ACCOUNT_VAULT.get(accountId);
                if (userRecord.claimed) {
                    res.writeHead(410, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, error: 'Dynamic reward token already drained' }));
                }

                // Cryptographic validation step matching dynamic system keys
                const expectedCurrentToken = generateTOTP(userRecord.secret);
                const isMatch = crypto.timingSafeEqual(Buffer.from(code), Buffer.from(expectedCurrentToken));

                res.writeHead(isMatch ? 200 : 0, { 'Content-Type': 'application/json' });
                if (!isMatch) return res.end(JSON.stringify({ success: false, error: 'Invalid or expired single-use token' }));

                userRecord.claimed = true; // Atomically flip allocation state flags
                return res.end(JSON.stringify({ success: true, balanceCredited: userRecord.payload }));
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: 'Malformed stream request structural configuration' }));
            }
        });
    } else { res.writeHead(404).end(); }
});

server.listen(3000, () => console.log('🚀 totp-one-time-redeem engine active on port 3000'));


