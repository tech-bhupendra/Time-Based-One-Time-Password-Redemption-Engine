# 🕒 totp-one-time-redeem

A zero-dependency Node.js backend microservice engineered to validate promotion codes using a time-synchronized algorithm (TOTP).

## 🛡️ Systems Engineering Highlights
- **No Static Code Vectors**: Replaces traditional brittle text vouchers with rotating 6-digit values that expire automatically every 30 seconds.
- **Pure Node.js Cryptography**: Uses the core system `crypto` module to perform HMAC-SHA1 byte manipulation without heavy open-source packages.
- **Timing Safe Verifications**: Employs `crypto.timingSafeEqual` to fully eliminate side-channel server latency analytics leaks.

## 🚀 Execution & Real-Time Test Simulation
1. **Initialize the Server Instance**:
   ```bash
   node server.js
   ```

2. **Generate Your Current 30-Second Token**:
   Run this helper calculation script in a separate terminal window to inspect the live valid token for your profile instance:
   ```bash
   node -e "
   const crypto = require('crypto');
   const step = Math.floor(Date.now() / 30000);
   const buf = Buffer.alloc(8);
   let s = step;
   for (let i = 7; i >= 0; i--) { buf[i] = s & 0xff; s >>= 8; }
   const hmac = crypto.createHmac('sha1', Buffer.from('BASE32SECRETSEEDFORUSER1NATIVEENGINE', 'utf-8')).update(buf).digest();
   const off = hmac[hmac.length - 1] & 0xf;
   const bin = ((hmac[off] & 0x7f) << 24) | ((hmac[off+1] & 0xff) << 16) | ((hmac[off+2] & 0xff) << 8) | (hmac[off+3] & 0xff);
   console.log('Your Live Code:', String(bin % 1000000).padStart(6, '0'));
   "
   ```

3. **Submit the Code to the Verification Route**:
   *Execute this code quickly before the 30-second window ticks over:*
   ```bash
   curl -X POST http://localhost:3000/api/totp/claim \
     -H "Content-Type: application/json" \
     -d '{"accountId": "USER_PREMIUM_01", "code": "PASTE_THE_6_DIGIT_CODE_HERE"}'
   ```

