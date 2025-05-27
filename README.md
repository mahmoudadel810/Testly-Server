<!-- @format -->

# Testly: Your Online Exam System

Welcome to Testly, a robust and user-friendly online platform designed for creating, administering, and taking exams. Whether you're an educator looking to assess student knowledge or a student preparing for tests, Testly provides the tools you need for a seamless examination experience.

This project is built with a focus on performance, security, and maintainability, using modern Node.js technologies.

## Features

Testly aims to provide a comprehensive exam system with features including:

- **Secure Authentication:** Separate registration and login flows for students and teachers.
- **Email Confirmation:** Ensures valid user accounts through email verification.
- **Password Reset:** Allows users to securely reset forgotten passwords.
- **Teacher Management:** Functionality for registering and managing teacher accounts (including admin approval workflows).
- **Student Teacher Selection:** Students can select preferred teachers.
- **User/Teacher Profiles:** Ability to retrieve user and teacher information.
- **Token Validation:** API endpoint to validate user authentication tokens.
- **Robust Error Handling:** Centralized error handling for API endpoints.
- **Logging:** Comprehensive logging for monitoring and debugging.
- **Caching:** Utilizing Redis for caching frequently accessed data to improve performance.
- **API Documentation:** Automatically generated API documentation using Swagger.

## Technologies Used

This project leverages the following key technologies and libraries:

- **Node.js:** The JavaScript runtime environment.
- **Express.js:** A fast, unopinionated, minimalist web framework for Node.js.
- **MongoDB:** A NoSQL document database used for data storage.
- **Mongoose:** An Object Data Modeling (ODM) library for MongoDB and Node.js.
- **Redis:** An in-memory data structure store, used here as a cache and message broker (potential future use).
- **JSON Web Token (JWT):** A standard for creating tokens that assert claims, used for authentication.
- **bcrypt:** For securely hashing user passwords.
- **Nodemailer:** For sending emails (e.g., confirmation, password reset).
- **nanoid:** A tiny, secure, URL-friendly, unique string ID generator.
- **Winston:** For structured and flexible logging.
- **Swagger-UI-Express & Swagger-Jsdoc:** For generating and serving API documentation.
- **Dotenv:** For loading environment variables from a `.env` file.
- **express-async-handler:** A simple middleware for handling exceptions inside of async express routes.

## Installation

To get a local copy of Testly up and running, follow these steps.

**Prerequisites:**

- Node.js (v14 or higher recommended)
- npm or Yarn package manager
- MongoDB server instance (local or hosted)
- Redis server instance (local or hosted)

**Steps:**

1.  **Clone the repository:**
    ```bash
    git clone <https://github.com/mahmoudadel810/Testly-Server.git>
    cd testly-project
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or using yarn
    # yarn install
    ```
3.  **Create a `.env` file:**

    **Note:** Replace placeholder values with your actual credentials and configurations.

4.  **Start MongoDB and Redis servers:**
    Ensure your MongoDB and Redis server instances are running and accessible via the URLs provided in your `.env` file.

## Usage

To start the Testly server, run the following command in your terminal from the project root:

```bash
npm start
# or using yarn
# yarn start
```

The server should start and listen on the port

- Access the API at `http://localhost:PORT`.
- Access the API documentation at `http://localhost:PORT/api-docs`.

## Deployment Notes (Vercel)

Deploying to platforms like Vercel requires careful handling of environment variables and build commands.

1.  **Environment Variables:** On Vercel, you must configure your environment variables (like `MONGODB_URI`, `REDIS_URL`, `SIGNATURE`, email credentials, etc.) directly in the project settings via the Vercel dashboard. Do not rely on the `.env` file in your deployed code.
2.  **Build Command:** Vercel typically auto-detects Node.js projects and uses `npm build` or `yarn build` if a build script is defined in `package.json`. Ensure your `package.json` includes a `build` script if your project requires one (e.g., for frontend assets if this were a full-stack app, though this project seems API-only). For an API-only project, often no specific build command is needed, and Vercel will just run the `start` command.
3.  **Start Command:** Ensure your `start` script in `package.json` (`node index.js` or similar) correctly starts your application. Vercel will use this command to run your server.
4.  **Port:** Your application should listen on `process.env.PORT` provided by the hosting environment (Vercel). Your current code already does this (`process.env.PORT || 3000`), which is correct.
5.  **Database/Cache:** Ensure your deployed environment can access your MongoDB and Redis instances. This might require configuring network access or using managed database/cache services compatible with Vercel.

## Contributing

We welcome contributions to Testly! If you'd like to contribute, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes and commit them (`git commit -m 'feat: add some feature'`).
4.  Push to the branch (`git push origin feature/your-feature-name`).
5.  Create a new Pull Request.

Please ensure your code adheres to the project's coding style and includes relevant tests if applicable.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
