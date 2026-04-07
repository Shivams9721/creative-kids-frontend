"use client";
import { useState, useEffect } from "react";
import { safeFetch } from "../api";

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      const res = await safeFetch("/api/admin/contacts");
      setContacts(Array.isArray(res) ? res : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, newStatus) {
    try {
      await safeFetch(`/api/admin/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      loadContacts();
    } catch {
      alert("Failed to update status");
    }
  }

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Contact Requests</h1>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>Loading contacts…</div>
        ) : contacts.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>No contact requests found.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td><b>{c.name}</b></td>
                  <td>{c.email}</td>
                  <td>{c.subject || "—"}</td>
                  <td style={{ maxWidth: 300 }}>
                    <div style={{ whiteSpace: "pre-wrap", maxHeight: 60, overflowY: "auto", fontSize: 12, lineHeight: 1.4 }}>
                      {c.message}
                    </div>
                  </td>
                  <td>
                    <span className={`tag ${c.status === "New" ? "tag-blue" : c.status === "Replied" ? "tag-green" : "tag-gray"}`}>
                      <span className="tag-dot" />{c.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <select
                      className="input"
                      style={{ padding: "4px 8px", fontSize: 11, width: "auto", display: "inline-block" }}
                      value={c.status}
                      onChange={(e) => updateStatus(c.id, e.target.value)}
                    >
                      <option value="New">New</option>
                      <option value="Read">Read</option>
                      <option value="Replied">Replied</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
