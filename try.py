import serial
import pymongo
from datetime import datetime

# Set up serial connection
ser = serial.Serial("COM6", 9600, timeout=2)  # Added timeout for stability
ser.flushInput()  # Clears the buffer to prevent old data issues

# Set up MongoDB connection
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["fingerprint_db"]
collection = db["attendance"]

print("🔄 Waiting for fingerprint data...")

while True:
    if ser.in_waiting > 0:
        data = ser.readline().decode("utf-8", errors="ignore").strip()
        print(f"📥 Received Data: {data}")  # Debugging: Print raw serial data

        if "✅ Fingerprint Matched!" in data:  # Check if match message is present
            parts = data.split()
            if len(parts) >= 3:  # Ensure enough words are present
                finger_id = parts[-1]  # Extract last word as fingerprint ID
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                # Store data in MongoDB
                attendance_data = {
                    "fingerprint_id": finger_id,
                    "timestamp": timestamp,
                    "status": "Present",
                }

                result = collection.insert_one(attendance_data)  # Insert into MongoDB
                if result.inserted_id:  # Check if insertion was successful
                    print(f"✅ Data saved to MongoDB (ID: {result.inserted_id})")
                else:
                    print("⚠️ Failed to insert data into MongoDB.")

            else:
                print("⚠️ Invalid fingerprint data format received.")
        else:
            print("❌ No valid fingerprint match.")
