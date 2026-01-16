# AegisX Device Setup & Security Guide

## Overview
AegisX Readers connect to the Catalyst platform using a high-security, HMAC-authenticated API. This ensures that only authorized devices can post access logs or retrieve building configuration.

### Architecture
1. **Device**: Raspberry Pi, ESP32, or similar running the AegisX Client.
2. **Security**: 
   - **Device Secret**: Unique 32-byte hex key per device (never transmitted over wire).
   - **HMAC-SHA256**: All requests are signed.
   - **Replay Protection**: Timestamps are validated (5-minute window).
3. **API**: `POST /api/device/aegisx/v1/sync`

## 1. Database Setup
Ensure the following migrations are run:
1. `database/aegisx_reader_config_migration.sql` (Config JSON schema)
2. `database/aegisx_device_security.sql` (Security columns & command queue)

## 2. Provisioning a New Reader
1. Go to **Admin Dashboard > AegisX**.
2. Click **Add Reader**.
3. Enter Name, Location, and Serial Number.
4. **IMPORTANT**: Copy the `Device Secret` shown in the success response. This will *never* be shown again.
5. Securely store this secret on the device (e.g., in `.env` or encrypted storage).

## 3. Device Implementation (Python Example)

We provide a reference implementation in `scripts/aegisx_device_simulator.py`.

### Prerequisites
- Python 3.x
- `requests` library

```bash
pip install requests
```

### Configuration
Create a `device_config.json` on the device:
```json
{
    "serial_number": "AEGIS-001-TEST",
    "secret_key": "YOUR_32_BYTE_HEX_SECRET_HERE",
    "api_url": "https://catalystwells.in/api/device/aegisx/v1/sync"
}
```

### Running the Client
```bash
python3 aegisx_client.py
```

## 4. Security Measures

### Authentication
Every request must include:
- `x-aegisx-serial`: Device Serial Number
- `x-aegisx-timestamp`: Unix timestamp (seconds)
- `x-aegisx-signature`: HMAC-SHA256(secret, timestamp + body)

### Replay Attacks
The server rejects any request with a timestamp older than 5 minutes or in the future.

### Encryption
All traffic must be effectively encrypted using HTTPS (TLS 1.2+). The `Device Secret` is never sent over the network, only used to sign requests.

## 5. Remote Commands
The server can send commands to the device in the response:
- `open_door`: Trigger solenoid
- `restart`: Reboot device
- `update_firmware`: Trigger OTA update

Commands are queued in the database and delivered on the next sync heartbeat.
