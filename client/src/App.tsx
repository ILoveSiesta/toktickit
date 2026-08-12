import { useState } from "react";
import { checkSystem, Category } from "./api.js";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  void categories;

  async function handleCheck() {
    setState("loading");
    try {
      const response = await checkSystem();
      if (response && response.online) {
        setCategories(response.categories);
        setState("success");
      } else {
        setState("error");
      }
    } catch (error) {
      setState("error");
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      <button className="btn btn-success mb-4" onClick={handleCheck} disabled={state === "loading"}>
        {state === "loading" ? "Loading…" : "Check System"}
      </button>

      {state === "success" && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">System Status: Online</h5>
            <h6 className="mt-4 mb-3">Supported Request Categories</h6>
            <ol className="mb-0">
              {categories.map((category) => (
                <li key={category.id}>{category.name}</li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="card text-white bg-danger">
          <div className="card-body">
            <h5 className="card-title">System Status: Offline</h5>
            <p className="card-text mb-0">Unable to connect to TokTickIT API</p>
          </div>
        </div>
      )}
    </div>
  );
}
