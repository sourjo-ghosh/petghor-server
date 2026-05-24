# PetGhor Server

## Purpose
**PetGhor Server** is the robust and secure backend service powering the PetGhor pet adoption web application. Designed to bridge pet owners, listing creators, and hopeful adopters, the server manages all core business logic, safe-guards data integrity, and processes operations relating to pet listings and adoptions. It connects seamlessly to a MongoDB database, offers JWT-based endpoint protection via remote JWKS verification, and provides rich querying capabilities for the client application.

## Live URL
* **Live API Server:** [https://petghor-server.vercel.app/](https://petghor-server.vercel.app/)
* **Client Web App:** [https://petghor.vercel.app/](https://petghor.vercel.app/)

## Features
* **🔐 Secure Authentication (JWT)**: Features custom `verifyToken` middleware powered by `jose-cjs` that verifies JSON Web Tokens using remote JWKS, ensuring all sensitive listing, request, and dashboard endpoints are strictly protected.
* **🐕 Advanced Pet Search & Filtering**: Provides robust endpoints for fetching pet records with dynamic filtering by species and search matching by pet name, optimized using MongoDB regex queries.
* **📁 Full CRUD Operations for Listings**: Empower users to post new pets, update existing pet details, and delete listings. The API includes solid backend validation to prevent editing adopted pets or deleting records owned by other users.
* **💌 Intelligent Adoption Request System**: Enables potential adopters to send requests while actively preventing self-adoption requests (owners requesting their own pets) or double-adoptions of already adopted pets.
* **⚡ Automated Transaction Approvals**: Contains complex approval handlers where approving a specific adoption request automatically rejects all other concurrent requests for that same pet, and transitions the pet's status to "adopted".
* **📊 Comprehensive Dashboard Analytics**: Offers custom routes tracking specific listing metrics (total, adopted, available pets) and adoption request states (pending, approved, rejected) to populate elegant user dashboards.

## NPM Packages Used
* **[express (v5.2.1)](https://www.npmjs.com/package/express)**: The fast, minimalist, and standard web framework for Node.js to route HTTP requests.
* **[mongodb (v7.2.0)](https://www.npmjs.com/package/mongodb)**: Official driver connecting the server to MongoDB Atlas for performant CRUD and aggregation operations.
* **[jose-cjs (v6.2.3)](https://www.npmjs.com/package/jose-cjs)**: A versatile JSON Web Signatures (JWS) and JSON Web Tokens (JWT) library tailored for CommonJS environments, used to verify client-signed requests via remote JWKS.
* **[cors (v2.8.6)](https://www.npmjs.com/package/cors)**: Essential middleware enabling Cross-Origin Resource Sharing with the PetGhor frontend client.
* **[dotenv (v17.4.2)](https://www.npmjs.com/package/dotenv)**: A zero-dependency module that loads environment variables from a `.env` file to ensure secure storage of connection URIs and API endpoints.

---

### 🚀 Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sourjo-ghosh/petghor-server.git
   cd petghor-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and specify the following variables:
   ```env
   PORT=8000
   MONGODB_URI=your_mongodb_connection_string
   CLIENT_URL=https://petghor.vercel.app
   ```

4. **Run the Server:**
   ```bash
   npm start
   ```
