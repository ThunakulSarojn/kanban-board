
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

type Status = "todo" | "doing" | "done";

type Card = {
  id: number;
  title: string;
  status: Status;
};

const API_URL = "https://kanban-board-umjh.onrender.com";

const COLUMNS: { id: Status; title: string }[] = [
  { id: "todo", title: "To do" },
  { id: "doing", title: "Doing" },
  { id: "done", title: "Done" },
];

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchCards() {
    try {
      const response = await fetch(`${API_URL}/cards`);

      if (!response.ok) {
        throw new Error("Failed to load tasks.");
      }

      setCards(await response.json());
      setError("");
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchCards();
  }, []);

  async function handleAddCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = newTitle.trim();
    if (!title) return;

    try {
      const response = await fetch(`${API_URL}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status: "todo" }),
      });

      if (!response.ok) throw new Error();

      setNewTitle("");
      await fetchCards();
    } catch {
      setError("Failed to add task. Please try again.");
    }
  }

  async function handleMoveCard(card: Card, status: Status) {
    try {
      const response = await fetch(`${API_URL}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error();

      await fetchCards();
    } catch {
      setError("Failed to update task status. Please try again.");
    }
  }

  async function handleDeleteCard(id: number) {
    try {
      const response = await fetch(`${API_URL}/cards/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error();

      await fetchCards();
    } catch {
      setError("Failed to delete task. Please try again.");
    }
  }

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Kanban Board</h1>
          <p className="subtitle">Plan your work. Track your progress.</p>
        </div>

        <div className="total">
          {cards.length} {cards.length === 1 ? "task" : "tasks"}
        </div>
      </header>

      <form className="add-form" onSubmit={handleAddCard}>
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="What needs to be done?"
          aria-label="Task title"
          required
        />
        <button type="submit">+ Add Task</button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <p>Loading tasks...</p>}

      <section className="board">
        {COLUMNS.map((column) => {
          const columnCards = cards.filter(
            (card) => card.status === column.id
          );

          return (
            <section className={`column ${column.id}`} key={column.id}>
              <div className="column-heading">
                <h2>{column.title}</h2>
                <span className="count">{columnCards.length}</span>
              </div>

              <div className="card-list">
                {columnCards.map((card) => (
                  <article className="task-card" key={card.id}>
                    <p>{card.title}</p>

                    <div className="card-actions">
                      <select
                        aria-label={`Move ${card.title}`}
                        value={card.status}
                        onChange={(event) =>
                          void handleMoveCard(
                            card,
                            event.target.value as Status
                          )
                        }
                      >
                        {COLUMNS.map((option) => (
                          <option key={option.id} value={option.id}>
                            Move to {option.title}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => void handleDeleteCard(card.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}

                {columnCards.length === 0 && (
                  <p className="empty">No tasks yet</p>
                )}
              </div>
            </section>
          );
        })}
      </section>
    </main>
  );
}
