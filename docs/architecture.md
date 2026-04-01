# System Architecture

GigShield AI follows a multi-layer architecture:

Frontend → Backend → ML Model → Database

- Frontend (React): User interface
- Backend (Node.js): Handles API requests
- ML Model (Python): Predicts premium
- Database (MongoDB): Stores workers, policies, claims

Communication:
- Frontend → Backend via REST APIs
- Backend → ML via Python script execution
- Backend → DB via Mongoose