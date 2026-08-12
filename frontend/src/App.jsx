import { useEffect, useState } from "react";

const API_URL = "https://taskmanagementsystem-akbn.onrender.com/api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");

  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState("");
  const getUserIdFromToken = () => {
  if (!token) return null;

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    return payload.userId;
  } catch (error) {
    console.error("Token error:", error);
    return null;
  }
};

  // ---------------- LOGIN / REGISTER ----------------

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Authentication failed");
        return;
      }

      if (isLogin) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setMessage("Login successful!");
      } else {
        setMessage("Registration successful! Please login.");
        setIsLogin(true);
      }

      setEmail("");
      setPassword("");
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend.");
    }
  };

  // ---------------- LOGOUT ----------------

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setTasks([]);
    setMessage("");
  };

  // ---------------- GET TASKS ----------------

  const getTasks = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Cannot load tasks");
        return;
      }

      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend.");
    }
  };

  // Load tasks after login
  useEffect(() => {
    if (token) {
      getTasks();
    }
  }, [token]);

  // ---------------- CREATE TASK ----------------

const createTask = async (e) => {
  e.preventDefault();
  setMessage("");

  if (!title.trim()) {
    setMessage("Please enter a task title.");
    return;
  }

  const userId = getUserIdFromToken();

  if (!userId) {
    setMessage("User ID not found. Please login again.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description,
        status,
        userId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Task creation failed.");
      return;
    }

    setMessage("Task created successfully!");

    setTitle("");
    setDescription("");
    setStatus("pending");

    getTasks();

  } catch (error) {
    console.error(error);
    setMessage("Cannot connect to backend.");
  }
};


  // ---------------- DELETE TASK ----------------

  const deleteTask = async (id) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Delete failed.");
        return;
      }

      setMessage("Task deleted successfully!");
      getTasks();
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend.");
    }
  };

  // ---------------- AUTH SCREEN ----------------

  if (!token) {
    return (
      <div className="container">
        <h1>Task Management System</h1>

        <form onSubmit={handleAuth}>
          <h2>{isLogin ? "Login" : "Register"}</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage("");
          }}
        >
          {isLogin
            ? "Create a new account"
            : "Already have an account? Login"}
        </button>

        {message && <p>{message}</p>}
      </div>
    );
  }

  // ---------------- TASK SCREEN ----------------

  return (
    <div className="container">
      <h1>Task Management System</h1>

      <button onClick={logout}>Logout</button>

      {message && <p>{message}</p>}

      <h2>Create New Task</h2>

      <form onSubmit={createTask}>
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <button type="submit">Create Task</button>
      </form>

      <h2>My Tasks</h2>

      <button onClick={getTasks}>Refresh</button>

      {tasks.length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        tasks.map((task) => (
          <div className="task-card" key={task._id || task.id}>
            <h3>{task.title}</h3>

            <p>{task.description}</p>

            <p>
              <strong>Status:</strong> {task.status}
            </p>

            <button
              onClick={() => deleteTask(task._id || task.id)}
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default App;