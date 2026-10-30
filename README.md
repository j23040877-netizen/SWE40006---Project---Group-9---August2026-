# ☕ Coffee Paradise - DevOps CI/CD Web Application

> **Swinburne University of Technology**  
> **Unit:** SWE40006 — Software Deployment and Evolution  
> **Group:** Group 9  
> **Project:** Coffee Paradise E-Commerce Platform  

---

## 📖 Project Overview
**Coffee Paradise** is a full-stack, containerized e-commerce web platform engineered to demonstrate a production-grade, automated DevOps CI/CD server pipeline. 

The application architecture features:
* **Frontend:** Responsive client interface built with HTML5, CSS3 (Tailwind CSS), and vanilla JavaScript.
* **Backend:** Node.js & Express RESTful API.
* **Database:** PostgreSQL relational database with persistent volume storage for customer accounts and orders.
* **Payments:** Stripe API (Test Mode Sandbox) handling dynamic checkout sessions.
* **Testing:** Headless Cypress End-to-End (E2E) integration testing and HTMLHint static code linting.
* **Orchestration:** Multi-container Docker & Docker Compose setup ensuring 100% environment parity.
* **Cloud & CI/CD:** Automated Jenkins Pipeline deploying across Azure Linux VMs (Dev, Test, Prod) inside an isolated Azure Virtual Network (VNet).

---

## 👥 Group 9 Team Members
* **Tan Whye Lun (105735828)** — Team Leader & Software Engineer
* **NanthaKumara A/L Ganesan (106214014)** — Pipeline Architect & Lead Author
* **Adrian Chew Hon Bing (105556362)** — Full-Stack Developer
* **Tan Kai Xuan (105735381)** — QA & Automated Testing Specialist
* **Teh Kat Sin (105733314)** — DevOps & Infrastructure Engineer

---

## 🔍 How to Verify Each Tool (DevOps Verification Guide)

Use this reference table and verification commands during grading, demonstrations, or team testing:

| # | DevOps Tool | What It Does in Project | Verification Command / Action | Expected Result |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **GitHub** | Source Code Management & Webhook Triggers | `git status`<br>`git log -n 5` | Clean working tree; latest commits synchronized with GitHub remote. |
| **2** | **HTMLHint** | Static Analysis & Code Linting | `npm run lint` | `Scanned 6 files, no errors found (0 errors)`. |
| **3** | **Docker & Compose** | Containerization & Multi-Service Parity | `docker compose ps` | Both `web` (Port 3000) and `postgres-db` (Port 5432) in `Up` (healthy) status. |
| **4** | **PostgreSQL** | Relational Data Persistence (Users & Orders) | `docker compose exec postgres-db psql -U admin -d coffeeparadise -c "SELECT * FROM users;"` | Connects without password prompt and outputs registered member rows. |
| **5** | **Cypress** | Headless E2E Integration Testing | `npm run test:e2e` | Terminal executes headless browser; all assertions pass (`All specs passed!`). |
| **6** | **Stripe API** | Secure Sandbox Payment Processing | Complete checkout using test card `4242 4242 4242 4242` | Stripe authorizes transaction ($0 real money) and redirects to `orders.html`. |
| **7** | **Jenkins** | Automated CI/CD Pipeline Automation | Open Jenkins dashboard (`:8080`) → trigger build | All 7 pipeline stages turn **GREEN** (Checkout → Lint → Build → Dev → Staging → Prod → Health). |
| **8** | **Azure Monitor** | Production Server Telemetry | Azure Portal → `prod-vm` → **Monitoring** → **Metrics** | Live real-time graphs displaying CPU %, RAM usage, Disk I/O, and Network Bandwidth. |

---

## 🚀 Quick Start Guide (How to Run Locally)

### Prerequisites
* [Visual Studio Code](https://code.visualstudio.com/)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) *(Recommended for 100% full functionality)*  
  **OR** [Node.js (v18+)](https://nodejs.org/)

---

### ⭐ Option A: Run with Docker Compose (Recommended — Zero Errors, Full Functionality)
Docker automatically packages and starts **both** the Node.js API and the PostgreSQL database. **No local database installation is needed!**

1. **Open Docker Desktop** and ensure it is running in the background.
2. Open the project folder in **VS Code**.
3. Open the terminal (Press `Ctrl` + `~` or click `Terminal` → `New Terminal`).
4. Run the following command:
   ```bash
   docker compose up -d --build
   ```
5. Open your web browser and visit:
   👉 **`http://localhost:3000`**

To stop the containers when finished:
```bash
docker compose down
```

---

### 💻 Option B: Run with Node.js Directly (Without Docker)
If you only have Node.js installed:

1. Open the terminal in VS Code:
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open your web browser and visit:
   👉 **`http://localhost:3000`**

*(Note: Without Docker, user registration/login requires a locally running PostgreSQL instance).*

---

## 💳 How to Test Full User Journey & Stripe Payment

1. **Register:** Go to `register.html` and create a new account (persists directly into PostgreSQL).
2. **Login:** Log in with your email and password (session handled by `auth-guard.js`).
3. **Browse Catalog:** Go to `catalog.html` and add any coffee blend to your cart.
4. **Checkout:** Click **"Go to Checkout"** → review your cart items and total.
5. **Pay with Stripe Sandbox:**
   * Click **"Pay Now via Real Stripe"** (connects securely to Stripe Checkout).
   * On Stripe's hosted checkout page, use the official test card credentials:
     * **Card Number:** `4242 4242 4242 4242`
     * **Expiration:** Any future date (e.g., `12/28`)
     * **CVC:** `123`
     * **Name on Card:** Any name (e.g., `Test User`)
     * **Billing Address / ZIP:** Any valid postal code (e.g., `50000`)
   * Click **Pay** ($0.00 real money charged).
6. **Order Receipt:** Stripe redirects back to `orders.html`. The order is written to PostgreSQL and displayed in your order history!

---

## 🗄️ How to View the PostgreSQL Database

Because PostgreSQL runs inside Docker, you do **not** need pgAdmin or external tools. You can inspect tables directly from your terminal:

### 1. View Registered Users and Orders in Terminal:
Run this single command in your VS Code terminal:
```bash
docker compose exec postgres-db psql -U admin -d coffeeparadise -c "SELECT * FROM users;" -c "SELECT * FROM orders;"
```

### 2. Run the `users.sql` Script:
```bash
docker compose exec -T postgres-db psql -U admin -d coffeeparadise < public/users.sql
```

---

## 🧪 Automated Testing

### 1. Static HTML Linting (HTMLHint):
Validates HTML syntax, unclosed tags, and DOM structures:
```bash
npm run lint
```

### 2. Headless End-to-End Integration Testing (Cypress):
Executes the full automated user journey (`register.html` → `login.html` → `catalog.html` → `checkout.html` → `orders.html`) validating database writes and Stripe handling:
```bash
npm run test:e2e
```
*(Ensure `npm start` or `docker compose up -d` is running on port 3000 before executing tests).*

---

## 🔄 Jenkins CI/CD Pipeline Workflow

The repository includes a declarative `Jenkinsfile` executing 7 automated stages:

1. **1. Checkout Code:** Pulls latest commits from the GitHub repository via Webhooks.
2. **2. Static Analysis & Linting:** Runs HTMLHint on all markup templates (`npx htmlhint "**/*.html"`).
3. **3. Build Docker Containers:** Builds fresh container images for Node.js and PostgreSQL.
4. **4. Deploy to Dev VM:** Deploys containerized app to `dev.coffeeparadise.internal`.
5. **5. Deploy to Staging & Run Cypress:** Deploys to `test.coffeeparadise.internal` and triggers headless Cypress E2E tests.
6. **6. Promote & Deploy to Prod VM:** Upon 100% test pass rate, automatically promotes release to `prod.coffeeparadise.internal`.
7. **7. Production Health Check:** Verifies HTTP 200 response on live production endpoint.

---

## ☁️ Azure Cloud Infrastructure

* **Host Provider:** Microsoft Azure (Azure for Students).
* **Network Topology:** 3 isolated Linux VMs (`dev-vm`, `test-vm`, `prod-vm`) and 1 dedicated Jenkins build host inside a single Azure Virtual Network (VNet).
* **Production Telemetry:** Azure Monitor actively tracking hypervisor metrics (CPU %, RAM, Disk I/O, Network Throughput) on `prod-vm` with near-zero overhead.
