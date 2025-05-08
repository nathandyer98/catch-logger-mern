# 🎣 CatchLogger MERN 🎣

## 🌟 Overview

CatchLogger is a full-stack social media web application built for anglers! 🐠 Users can share their latest catches, view catches from others in the community, like posts, follow other anglers, and send direct messages.

## ✨ Features

* 👤 **User Authentication**: Secure sign-up and login.
* 🎣 **Post Catches**: Share details and photos of your fishing catches.
* 👀 **View Catches**: Browse a feed of catches from other users.
* ❤️ **Likes**: Like or unlike catches.
* 👥 **Follow Users**: Follow other anglers to see their posts.
* 💬 **Direct Messaging**: Communicate with other users.
* 📱 **Responsive Design**: Works on desktop and mobile browsers.

## 🛠️ Tech Stack

This project is built with the MERN stack:

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

* **M**ongoDB: NoSQL database to store user data, catches, messages, etc.
* **E**xpress.js: Back-end web application framework running on Node.js.
* **R**eact: Front-end JavaScript library for building user interfaces.
* **N**ode.js: JavaScript runtime environment for the back-end.

Other technologies and libraries likely used (you can confirm and add/remove these):

* **Mongoose**: ODM for MongoDB.
* **JSON Web Tokens (JWT)**: For authentication.
* **Socket.IO**: For real-time features like messaging.
* **React Router**: For client-side routing.
* **Axios/Fetch API**: For making HTTP requests from the client.
* **Tailwind CSS / DaisyUI Components**: For styling.
* **Cloudinary**: For image uploads.

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed on your system:

* Node.js (which includes npm or yarn)
* MongoDB (either local or a cloud-hosted instance like MongoDB Atlas)

### ⚙️ Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/nathandyer98/catch-logger-mern.git](https://github.com/nathandyer98/catch-logger-mern.git)
    cd catch-logger-mern
    ```

2.  **Install Backend Dependencies:**
    Navigate to your backend directory (e.g., `server` or `backend`) and install dependencies.
    ```bash
    cd server # Or your backend folder name
    npm install
    # or
    # yarn install
    ```

3.  **Install Frontend Dependencies:**
    Navigate to your frontend directory (e.g., `client` or `frontend`) and install dependencies.
    ```bash
    cd ../client # Or your frontend folder name
    npm install
    # or
    # yarn install
    ```

4.  **Environment Variables:**
    Create a `.env` file in your backend directory (e.g., `server/.env`). You'll need to add variables such as:
    ```env
    PORT=your_backend_port # e.g., 5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    # Add any other necessary environment variables (e.g., Cloudinary keys)
    ```
    *(You might also need a `.env` file in the frontend for React environment variables, prefixed with `REACT_APP_`)*

5.  **Run the Development Servers:**
    * **Backend:** From your backend directory:
        ```bash
        npm run dev # Or your script to start the backend server (e.g., npm start)
        ```
    * **Frontend:** From your frontend directory:
        ```bash
        npm start # Or your script to start the React development server
        ```

    Your application should now be running, typically with the frontend on `http://localhost:3000` and the backend on a different port (e.g., `http://localhost:5000`).

## 📖 Usage

Once the application is running:

1.  Open your web browser and navigate to the frontend URL (usually `http://localhost:3000`).
2.  **Sign Up**: Create a new user account.
3.  **Log In**: Access your account.
4.  **Explore**:
    * View the main feed to see catches from other users.
    * Click on a catch to see more details.
    * Like catches you find interesting.
5.  **Post a Catch**:
    * Navigate to the "Post Catch" or similar section.
    * Fill in the details (species, weight, length, location, story, photo).
    * Submit your catch.
6.  **Interact**:
    * Visit user profiles.
    * Follow other anglers.
    * Send and receive direct messages.
