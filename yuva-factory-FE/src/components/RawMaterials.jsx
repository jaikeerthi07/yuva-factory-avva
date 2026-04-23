import React, { useState, useEffect } from "react";
import { Edit, Trash2, Hash } from "lucide-react";
import axios from "axios";

const API = "http://localhost:5000/api";

const RawMaterials = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    buyPrice: "",
    sellPrice: ""
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/raw-materials`);
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openForm = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        quantity: item.quantity?.toString() || "",
        buyPrice: item.buyPrice?.toString() || "",
        sellPrice: item.sellPrice?.toString() || ""
      });
    } else {
      setEditingItem(null);
      setFormData({ name: "", quantity: "", buyPrice: "", sellPrice: "" });
    }
    setShowModal(true);
  };

  const closeForm = () => setShowModal(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      quantity: parseInt(formData.quantity, 10) || 0,
      buyPrice: parseFloat(formData.buyPrice) || 0,
      sellPrice: parseFloat(formData.sellPrice) || 0
    };
    try {
      if (editingItem) {
        await axios.put(`${API}/raw-materials/${editingItem.id}`, payload);
      } else {
        await axios.post(`${API}/raw-materials`, payload);
      }
      closeForm();
      fetchItems();
    } catch (err) {
      console.error(err);
      alert("Error saving raw material");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${API}/raw-materials/${id}`);
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const styles = {
    container: {
      padding: "20px",
      minHeight: "100vh",
      backgroundColor: "#0f172a",
      color: "#f9fafb",
      fontFamily: "'Inter', sans-serif"
    },
    header: {
      display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px"
    },
    title: { fontSize: "28px", fontWeight: "600", margin: 0 },
    btnPrimary: {
      padding: "10px 20px", backgroundColor: "#4da6ff", color: "white", 
      border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600",
      transition: "all 0.2s ease"
    },
    tableContainer: {
      backgroundColor: "#1e293b", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155"
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { backgroundColor: "#334155", color: "#e2e8f0", padding: "12px 16px", textAlign: "left", fontSize: "14px", fontWeight: "600" },
    td: { padding: "14px 16px", borderBottom: "1px solid #334155", color: "#f8fafc", fontSize: "14px" },
    actions: { display: "flex", gap: "10px" },
    actionBtn: { background: "none", border: "none", cursor: "pointer", color: "#9ca3af", transition: "all 0.2s ease" },
    
    // Modal
    modalOverlay: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    },
    modalContent: {
      backgroundColor: "#1e293b", padding: "30px", borderRadius: "12px", width: "450px",
      maxWidth: "90%", maxHeight: "90vh", overflowY: "auto",
      boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
    },
    modalTitle: { margin: "0 0 20px 0", fontSize: "20px", color: "white", fontWeight: "600" },
    formGroup: { marginBottom: "20px" },
    label: { display: "block", marginBottom: "8px", color: "#cbd5e1", fontSize: "14px", fontWeight: "500" },
    input: {
      width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #475569", 
      backgroundColor: "#0f172a", color: "white", boxSizing: "border-box", fontSize: "14px",
      transition: "all 0.2s ease"
    },
    modalFooter: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" },
    loadingState: { textAlign: "center", padding: "40px", color: "#94a3b8" }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Raw Materials</h1>
        <button style={styles.btnPrimary} onClick={() => openForm(null)}>+ Add New Item</button>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}><Hash size={14} style={{display:'inline'}}/> ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}>Buy Price (₹)</th>
              <th style={styles.th}>Sell Price (₹)</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={styles.loadingState}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign:"center", padding:"30px", color: "#94a3b8"}}>No items found. Click "Add New Item" to create one.</td></tr>
            ) : (
              items.map(item => (
                <tr key={item.id}>
                  <td style={styles.td}>#{item.id}</td>
                  <td style={styles.td}>{item.name}</td>
                  <td style={styles.td}>{item.quantity}</td>
                  <td style={styles.td}>₹{(item.buyPrice || 0).toFixed(2)}</td>
                  <td style={styles.td}>₹{(item.sellPrice || 0).toFixed(2)}</td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button 
                        style={{...styles.actionBtn, color: "#60a5fa"}} 
                        onClick={() => openForm(item)}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#3b82f6"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#60a5fa"}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        style={{...styles.actionBtn, color: "#f87171"}} 
                        onClick={() => handleDelete(item.id)}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#f87171"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={closeForm}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editingItem ? "Edit Raw Material" : "Add Raw Material"}</h2>
            <form onSubmit={handleSave}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Name *</label>
                <input 
                  required 
                  style={styles.input} 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Wood, Steel, Plastic, Copper"
                  onFocus={(e) => e.target.style.borderColor = "#4da6ff"}
                  onBlur={(e) => e.target.style.borderColor = "#475569"}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Quantity *</label>
                <input
                  required
                  type="text"
                  style={styles.input}
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: e.target.value})}
                  placeholder="e.g., 100, 50kg, 200 units"
                  onFocus={(e) => e.target.style.borderColor = "#4da6ff"}
                  onBlur={(e) => e.target.style.borderColor = "#475569"}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Buy Price (₹) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  style={styles.input}
                  value={formData.buyPrice}
                  onChange={e => setFormData({...formData, buyPrice: e.target.value})}
                  placeholder="e.g., 500.00"
                  onFocus={(e) => e.target.style.borderColor = "#4da6ff"}
                  onBlur={(e) => e.target.style.borderColor = "#475569"}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Sell Price (₹) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  style={styles.input}
                  value={formData.sellPrice}
                  onChange={e => setFormData({...formData, sellPrice: e.target.value})}
                  placeholder="e.g., 750.00"
                  onFocus={(e) => e.target.style.borderColor = "#4da6ff"}
                  onBlur={(e) => e.target.style.borderColor = "#475569"}
                />
              </div>
              
              <div style={styles.modalFooter}>
                <button 
                  type="button" 
                  onClick={closeForm} 
                  style={{...styles.btnPrimary, backgroundColor: "#64748b"}}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#475569"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#64748b"}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={styles.btnPrimary}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#3b82f6"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#4da6ff"}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RawMaterials;