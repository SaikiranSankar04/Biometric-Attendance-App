# **A BIOMETRIC FINGERPRINT-BASED ATTENDANCE SYSTEM WITH REAL-TIME WEB DASHBOARD**

Traditional attendance systems suffer from critical drawbacks:
1. High latency due to cloud-only processing
2. Manual proxy risks (RFID, ID cards)
3. No real-time monitoring or access integration

To overcome these issues, we present a system with:
1. Biometric authentication and Servo lock for secure entry
2. No internet dependency for local operations
3. Cloud sync for backup and global access
4. React dashboard for real-time attendance visualization
5. Timestamped logs with present/absent status and daily summary, can be downloaded in an excel sheet

3 LAYER ARCHITECTURE OF THE SYSTEM
![image](https://github.com/user-attachments/assets/d947fe01-27c6-4792-ad81-e96176764f70)

### Software Stack

| **Software** | **Tech Stack** |
|--------------|-------------|
| **Frontend** | React.js |
| **Backend**  | Node.js & Express.js |
| **Middleware** | Python & Flask |

### Role-Based Access

| **Role** | **Permissions** |
|----------|-----------------|
| **Admin** | Can enroll new users and mark attendance when the PC is connected to the hardware components (Arduino). |
| **User**  | Can view attendance records and access the dashboard for attendance details. |


