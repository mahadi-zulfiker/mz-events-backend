# Events & Activities Platform (Backend)

The robust backend API for the Events & Activities Platform, built with Node.js, Express, and Prisma. It handles authentication, data management, and business logic to power the frontend application.

**Live URL:** [https://mz-events-backend.vercel.app/](https://mz-events-backend.vercel.app/)

## 🚀 Features

- **Authentication & Authorization:** Secure JWT-based authentication with role-based access control (User, Host, Admin).
- **User Management:** Profile updates, role management, and social connections (Friends).
- **Event Management:** CRUD operations for events, including categories, locations, and scheduling.
- **Booking System:** Handle event bookings, participant limits, and status updates.
- **Payment Integration:** Secure payment processing via Stripe.
- **Reviews & Ratings:** System for users to review events and hosts.
- **Notifications:** Real-time or persistent notifications for user actions.
- **Admin Dashboard:** Comprehensive endpoints for platform administration.
- **File Uploads:** Image handling using Multer and Cloudinary.
- **FAQ Management:** Manage frequently asked questions.

## 🛠️ Technology Stack

- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** PostgreSQL
- **ORM:** [Prisma](https://www.prisma.io/)
- **Validation:** Zod
- **Authentication:** JSON Web Token (JWT), Bcrypt
- **File Storage:** Cloudinary, Multer
- **Payments:** Stripe API
- **Utilities:** Dotenv, Cors, Cookie-parser, Http-status

## 📦 Setup & Installation

Follow these steps to run the server locally:

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and configure the following:
    ```env
    NODE_ENV=development
    PORT=5000
    DATABASE_URL=postgresql://user:password@localhost:5432/dbname
    JWT_SECRET=your_jwt_secret
    STRIPE_SECRET_KEY=your_stripe_secret_key
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```

4.  **Database Setup:**
    Run Prisma migrations to set up the database schema.
    ```bash
    npx prisma migrate dev
    ```
    (Optional) Seed the database:
    ```bash
    npm run seed
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

6.  **Access the API:**
    The server will start at `http://localhost:5000`.

## 📜 Scripts

- `npm run dev`: Starts the server in development mode with Nodemon.
- `npm run build`: Compiles TypeScript to JavaScript.
- `npm run start`: Starts the production server.
- `npm run seed`: Seeds the database with initial data.
- `npm run postinstall`: Generates Prisma client.

## 📂 Project Structure

- `src/modules`: Feature-based modules (Controller, Service, Route, Interface).
- `src/middlewares`: Express middlewares (Auth, Validation, Error handling).
- `src/config`: Configuration files.
- `src/shared`: Shared utilities and constants.
- `src/utils`: Helper functions.
