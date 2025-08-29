import React, { useEffect, useState } from "react";
import API from "../api/api";
import "./NotesPage.css";

interface UserData {
  name: string;
  email: string;
  dob: string;
  userId: string;
}

interface NotesPageProps {
  userData: UserData;
  onLogout: () => void;
}

interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotesPage({ userData, onLogout }: NotesPageProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [notesLoading, setNotesLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  async function loadNotes() {
    try {
      setNotesLoading(true);
      const res = await API.get("/notes");
      setNotes(res.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        onLogout();
      }
      setMsg(err?.response?.data?.message || "Failed to load notes");
    } finally {
      setNotesLoading(false);
    }
  }

  useEffect(() => { 
    loadNotes(); 
  }, []);

  const startCreating = () => {
    setIsCreating(true);
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setTitle("");
    setContent("");
    setMsg("");
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return setMsg("Title required");
    setLoading(true);
    try {
      const res = await API.post("/notes", { title, content });
      setNotes(prev => [res.data, ...prev]);
      setTitle(""); 
      setContent(""); 
      setIsCreating(false);
      setMsg("Note created successfully!");
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Create failed");
    } finally { 
      setLoading(false); 
    }
  }

  async function handleDelete(id: string) {
    try {
      await API.delete(`/notes/${id}`);
      setNotes(prev => prev.filter(n => n._id !== id));
      setMsg("Note deleted successfully!");
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Delete failed");
    }
  }

  return (
    <div className="dashboard-container">
      

      <div className="dashboard-content">
        {/* Welcome Section */}
        <section className="welcome-section">
          <h2>Welcome, {userData.name} !</h2>
          <p>Email: {userData.email}</p>
        </section>

      

        {/* Create Note Section */}
        <section className="create-note-section">
          <div className="section-header">
            {!isCreating ? (
              <button onClick={startCreating} className="create-btn">
                 Create Note
              </button>
            ) : (
              <button onClick={cancelCreating} className="cancel-btn">
                Cancel
              </button>
            )}
          </div>
          
          {isCreating && (
            <form onSubmit={handleCreate} className="note-form">
              <div className="form-group">
                <input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="Note title" 
                  className="note-input"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  placeholder="Note content (optional)" 
                  className="note-textarea"
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={cancelCreating}
                  className="clear-btn"
                  title="Clear form"
                >
                  <span className="clear-icon">×</span>
                  Clear
                </button>
                <button disabled={loading} type="submit" className="save-btn">
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Creating...
                    </>
                  ) : (
                    "Save Note"
                  )}
                </button>
              </div>
            </form>
          )}
        </section>

        {msg && (
          <div className={`message ${msg.includes("failed") ? "error" : "success"}`}>
            {msg}
          </div>
        )}

        {/* Notes List Section */}
        <section className="notes-section">
          <div className="section-header">
            <h3>Notes</h3>
            <span className="notes-count">{notes.length} notes</span>
          </div>
          
          {notesLoading ? (
            <div className="loading-state">
              <p>Loading notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <p>No notes yet. Create your first note above!</p>
            </div>
          ) : (
            <div className="notes-list">
              {notes.map(note => (
                <div key={note._id} className="note-item">
                  <div className="note-content">
                    <h4 className="note-title">{note.title}</h4>
                    
                    
                  </div>
                  <button 
                    onClick={() => handleDelete(note._id)} 
                    className="delete-btn"
                    title="Delete note"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}