import requests
import json
import time
import hmac
import hashlib
import sys
import random

# ==========================================
# AEGISX DEVICE SIMULATOR / REFERENCE CLIENT
# ==========================================

# CONFIGURATION
# In production, load these from multiple secure files or environment variables
CONFIG = {
    # Replace these with real values from the Admin Dashboard
    "SERIAL_NUMBER": "TEST-READER-001",
    "DEVICE_SECRET": "REPLACE_WITH_REAL_SECRET_FROM_DASHBOARD", 
    "API_URL": "http://localhost:3000/api/device/aegisx/v1/sync",
    "SYNC_INTERVAL": 5 # Seconds
}

class AegisXClient:
    def __init__(self, config):
        self.serial = config['SERIAL_NUMBER']
        self.secret = config['DEVICE_SECRET']
        self.url = config['API_URL']
        self.pending_logs = []
        
        # Local state matches server config until synced
        self.device_config = {}

    def sign_request(self, body_str):
        timestamp = str(int(time.time()))
        message = f"{timestamp}{body_str}"
        
        signature = hmac.new(
            bytes.fromhex(self.secret),
            msg=message.encode('utf-8'),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        return {
            'x-aegisx-signature': signature,
            'x-aegisx-timestamp': timestamp,
            'x-aegisx-serial': self.serial,
            'Content-Type': 'application/json'
        }

    def sync(self):
        """Send logs and heartbeat, receive commands and config"""
        payload = {
            "status": "online",
            "version": "1.0.0",
            "logs": self.pending_logs
        }
        
        body_str = json.dumps(payload)
        headers = self.sign_request(body_str)
        
        try:
            print(f"[*] Syncing with {self.url}...")
            response = requests.post(self.url, data=body_str, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"[+] Sync Success! Server TS: {data.get('ts')}")
                
                # Update Config
                if data.get('config'):
                    self.device_config = data['config']
                    print(f"    Config updated: {len(str(self.device_config))} bytes")
                
                # Handle Commands
                commands = data.get('commands', [])
                for cmd in commands:
                    self.handle_command(cmd)
                
                # Clear sent logs
                self.pending_logs = []
            else:
                print(f"[-] Sync Failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"[!] Network Error: {e}")

    def handle_command(self, cmd):
        print(f"[!] RECEIVED COMMAND: {cmd['command']}")
        # In real device: trigger GPIO, reboot, etc.

    def add_mock_log(self):
        """Simulate a card scan"""
        card_id = f"ABC{random.randint(1000,9999)}"
        granted = random.choice([True, True, False]) # Mostly granted
        
        log = {
            "cardId": card_id,
            "timestamp": time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
            "accessGranted": granted,
            "details": "Simulated Scan"
        }
        self.pending_logs.append(log)
        print(f"[+] Scanned Card: {card_id} ({'Granted' if granted else 'Denied'})")

    def run(self):
        print(f"=== AegisX Client Started ({self.serial}) ===")
        while True:
            # Simulate random scans
            if random.random() < 0.3:
                self.add_mock_log()
            
            self.sync()
            time.sleep(CONFIG['SYNC_INTERVAL'])

if __name__ == "__main__":
    if CONFIG['DEVICE_SECRET'] == "REPLACE_WITH_REAL_SECRET_FROM_DASHBOARD":
        print("[-] Please configure a valid DEVICE_SECRET in the script first.")
        sys.exit(1)
        
    client = AegisXClient(CONFIG)
    client.run()
