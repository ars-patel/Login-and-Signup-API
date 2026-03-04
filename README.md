# 🔐 Login & Signup Authentication API

A ready-to-use backend API for user registration, email verification, and login. Just connect your frontend and you're done.

🌐 **Live API:** [`https://login-and-signup-api-mmrz.onrender.com`](https://login-and-signup-api-mmrz.onrender.com)

**Base URL:** `https://login-and-signup-api-mmrz.onrender.com/api/auth`

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login and get a JWT token |
| `GET` | `/api/auth/verify/:token` | Verify email (from the link sent to email) |
| `GET` | `/health` | Check if server is running |

---

## � GET `/health`

**What it does:** Checks if the server is online and running. No login required.

**Open in browser:** [`https://login-and-signup-api-mmrz.onrender.com/health`](https://login-and-signup-api-mmrz.onrender.com/health)

**Response** `200`:
```json
{
  "status": "OK",
  "uptime": "42s",
  "timestamp": "2026-03-04T17:11:58.000Z"
}
```

---

## �🔵 POST `/api/auth/signup`

**What it does:** Creates a new user and sends a verification email.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Success Response** `201`:
```json
{
  "message": "User created. Please verify email."
}
```

**Error Responses:**
```json
{ "message": "User already exists" }       // 400 — duplicate email
{ "error": "password too short..." }        // 400 — validation failed
```

---

## 🔵 POST `/api/auth/login`

**What it does:** Logs in a user and returns a JWT token to use for authenticated requests.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Success Response** `200`:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64f3a2b1c9e77b001234abcd",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
```json
{ "message": "User does not exist" }              // 404
{ "message": "Please verify your email first" }   // 401
{ "message": "Incorrect password" }               // 401
```

---

## 🔵 GET `/api/auth/verify/:token`

**What it does:** Verifies the user's email. The user clicks the link in their inbox — no frontend action needed.

**Example:** `GET /api/auth/verify/a3f9b2c4d5e6f7...`

**Success Response** `200`:
```json
{ "message": "Email verified successfully" }
```

**Error Response:**
```json
{ "message": "Invalid token" }   // 400 — token not found or already used
```

---

## 🔒 Using Protected Routes

After login, send the token in every request header:

```
Authorization: Bearer <your_token_here>
```

The backend middleware will verify it automatically.

---

## ⚙️ What Each Controller Does

| Controller Function | Triggered By | What It Does |
|---------------------|--------------|--------------|
| `signup` | `POST /signup` | Validates input → hashes password → saves user → sends verification email |
| `login` | `POST /login` | Validates input → checks email → checks verification → compares password → returns JWT |
| `verifyEmail` | `GET /verify/:token` | Finds user by token → marks email as verified → clears token |

---

## 💻 Frontend Examples

### ✅ Signup (React)

```jsx
const handleSignup = async () => {
  const res = await fetch("https://login-and-signup-api-mmrz.onrender.com/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  alert(data.message); // "User created. Please verify email."
};
```

---

### ✅ Login (React)

```jsx
const handleLogin = async () => {
  const res = await fetch("https://login-and-signup-api-mmrz.onrender.com/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (data.token) {
    localStorage.setItem("token", data.token);   // save token
    console.log("Logged in as:", data.user.name);
  }
};
```

---

### ✅ Calling a Protected Route (React)

```jsx
const fetchProfile = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch("https://login-and-signup-api-mmrz.onrender.com/api/protected-route", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json();
  console.log(data);
};
```

---

### ✅ Login with Axios

```js
import axios from "axios";

const login = async (email, password) => {
  const { data } = await axios.post("https://login-and-signup-api-mmrz.onrender.com/api/auth/login", {
    email,
    password
  });
  localStorage.setItem("token", data.token);
};
```

---

---

## 🚀 After Login — Go to Next Page

### Using React Router (`useNavigate`)

Install React Router first if you haven't:
```bash
npm install react-router-dom
```

Then in your Login component:

```jsx
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await fetch("https://login-and-signup-api-mmrz.onrender.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);      // 1. Save token
      localStorage.setItem("user", JSON.stringify(data.user)); // 2. Save user info

      navigate("/dashboard");                          // 3. Go to dashboard page
    } else {
      alert(data.message);                             // Show error (e.g. wrong password)
    }
  };

  // ...
};
```

---

### Using Plain JavaScript (no React Router)

```js
if (data.token) {
  localStorage.setItem("token", data.token);
  window.location.href = "/dashboard";    // redirect to dashboard
}
```

---

### 🛡️ Protect the Dashboard Page (Only Allow Logged-In Users)

If a user is not logged in and tries to open `/dashboard` directly, send them back to login:

```jsx
// pages/Dashboard.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");    // not logged in → go back to login
    }
  }, []);

  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div>
      <h1>Welcome, {user?.name}! 👋</h1>
      <p>You are logged in as {user?.email}</p>
    </div>
  );
};

export default Dashboard;
```

---

### 🚪 Logout

```jsx
const handleLogout = () => {
  localStorage.removeItem("token");    // delete token
  localStorage.removeItem("user");     // delete user info
  navigate("/login");                  // go back to login page
};
```

---

> 💡 **Quick Tips for Beginners**
> - Always verify email before trying to login — otherwise you'll get a 401 error
> - Store the `token` from login response in `localStorage`
> - Send `Authorization: Bearer <token>` in every request to protected routes
> - The verification link is automatically sent to the user's email on signup
> - Always check for the token in `localStorage` on your dashboard page — if it's missing, redirect to `/login`
