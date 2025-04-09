import serial
import pymongo
from datetime import datetime
from flask import Flask, request, jsonify
import threading
from dotenv import load_dotenv
import os
from flask_cors import CORS

# Global status for real-time registration feedback
current_register_status = "Idle"

# Load environment variables
load_dotenv()
mongo_uri = os.getenv("MONGO_URI")

# Flask setup
app = Flask(__name__)
CORS(app)

# Serial connection (update COM port if needed)
ser = serial.Serial("COM6", 9600)

# MongoDB setup
client = pymongo.MongoClient(mongo_uri or "mongodb://localhost:27017/")
db = client["biometric_attendance"]
collection = db["attendances"]

print("Connected to MongoDB:", client.list_database_names())

# Thread lock for serial operations
serial_lock = threading.Lock()


# ========== Serial Listener ========== #
def listen_serial():
    global current_register_status
    print("Listening for fingerprint events...")

    while True:
        if ser.in_waiting > 0:
            with serial_lock:
                try:
                    data = ser.readline().decode("utf-8").strip()
                except Exception as e:
                    print("Error reading serial:", e)
                    continue

            print("Received:", data)

            # Attendance detection
            if "Fingerprint Matched! ID:" in data:
                parts = data.split("ID: ")
                if len(parts) > 1:
                    finger_id = parts[1].strip()
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    record = {
                        "fingerprint_id": finger_id,
                        "timestamp": timestamp,
                        "status": "Present",
                    }
                    collection.insert_one(record)
                    print("Attendance recorded:", record)

            # Registration status mapping
            elif "Enrolled with ID:" in data:
                current_register_status = data
            elif "Starting registration" in data:
                current_register_status = "Starting registration..."
            elif "Place finger..." in data:
                current_register_status = "Place your finger on the sensor"
            elif "Remove finger..." in data:
                current_register_status = "Remove your finger"
            elif "Place same finger again" in data:
                current_register_status = "Place the same finger again"
            elif "New fingerprint enrolled with ID:" in data:
                current_register_status = "User added successfully"
            elif "Failed" in data:
                current_register_status = "Registration failed. Try again"
            elif "Fingerprint added successfully" in data:
                current_register_status = "Fingerprint added successfully"


# ========== API: Trigger Registration ========== #
@app.route("/register", methods=["POST"])
def register():
    global current_register_status
    if ser.is_open:
        ser.write(b"REGISTER\n")
        current_register_status = "Waiting for fingerprint..."
        print("Sent REGISTER to Arduino")
        return jsonify({"status": "success"})
    else:
        return jsonify({"status": "error", "message": "Serial port not open"}), 500


# ========== API: Get Real-Time Status ========== #
@app.route("/register-status", methods=["GET"])
def register_status():
    return jsonify({"status": current_register_status})


# ========== Start Server & Serial Thread ========== #
if __name__ == "__main__":
    serial_thread = threading.Thread(target=listen_serial)
    serial_thread.daemon = True
    serial_thread.start()

    print("Starting Flask server on http://127.0.0.1:5001")
    app.run(port=5001, debug=False, use_reloader=False)
