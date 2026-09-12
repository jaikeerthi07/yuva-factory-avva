import React, { useState, useEffect } from "react";
import { Hash, Trash2, Plus, PlusSquare } from "lucide-react";
import axios from "axios";

const API = (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api";

const RawMaterials = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/suppliers-mgmt-data`);
      const data = res.data;

      if (data.success && data.suppliers) {
        const allItems = [];
        data.suppliers.forEach(supplier => {
          if (supplier.items && supplier.items.length > 0) {
            supplier.items.forEach(item => {
              allItems.push({
                ...item,
                supplierName: supplier.name,
                supplierCompany: supplier.company
              });
            });
          }
        });
        setItems(allItems);
      }
    } catch (err) {
      console.error("Error fetching supplier items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const response = await axios.delete(`${API}/items/${id}`);
      if (response.data.success || response.status === 200) {
        fetchItems(); // Refresh list
      }
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Failed to delete item.");
    }
  };

  const addToProducts = async (item) => {
    try {
      const newItem = {
        name: item.name,
        Model: item.model || "",
        model: item.model || "",
        type: item.type || "",
        Type: item.type || "",
        watts: item.watts || "",
        hsn: item.watts || "",
        buyPrice: parseFloat(item.buy_price || item.buyPrice || 0),
        sellPrice: parseFloat(item.sell_price || item.sellPrice || item.buy_price || item.buyPrice || 0),
        quantity: parseInt(item.quantity || 1),
      };

      const createRes = await fetch((process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      if (createRes.ok) {
        // Automatically remove from raw materials
        await axios.delete(`${API}/items/${item.id}`);
        alert(`Successfully added ${item.name} to products!`);
        fetchItems(); // Refresh the table
      } else {
        alert(`Failed to add ${item.name} to products.`);
      }
    } catch (err) {
      console.error("Error adding product:", err);
      alert("Error adding product.");
    }
  };

  const addAllToProducts = async () => {
    if (!items || items.length === 0) {
      alert("No items to add.");
      return;
    }

    if (!window.confirm(`Are you sure you want to add all ${items.length} items to your Products inventory?`)) return;

    setLoading(true);
    let successCount = 0;

    for (const item of items) {
      try {
        const newItem = {
          name: item.name,
          Model: item.model || "",
          model: item.model || "",
          type: item.type || "",
          Type: item.type || "",
          watts: item.watts || "",
          hsn: item.watts || "",
          buyPrice: parseFloat(item.buy_price || item.buyPrice || 0),
          sellPrice: parseFloat(item.sell_price || item.sellPrice || 0),
          quantity: parseInt(item.quantity || 1),
        };

        const createRes = await fetch((process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem),
        });

        if (createRes.ok) {
          successCount++;
          // Automatically delete from raw materials
          await axios.delete(`${API}/items/${item.id}`);
        }
      } catch (err) {
        console.error("Error adding product:", item.name, err);
      }
    }

    setLoading(false);
    fetchItems(); // Refresh the table
    alert(`Successfully added ${successCount} out of ${items.length} items to Products!`);
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
    tableContainer: {
      backgroundColor: "#1e293b", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155"
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { backgroundColor: "#334155", color: "#e2e8f0", padding: "12px 16px", textAlign: "left", fontSize: "14px", fontWeight: "600" },
    td: { padding: "14px 16px", borderBottom: "1px solid #334155", color: "#f8fafc", fontSize: "14px" },
    loadingState: { textAlign: "center", padding: "40px", color: "#94a3b8" }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Raw Materials (Supplier Items)</h1>
        <button
          onClick={addAllToProducts}
          style={{
            padding: "10px 16px",
            backgroundColor: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <PlusSquare size={18} />
          Add All to Products
        </button>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>SUPPLIER</th>
              <th style={styles.th}>ITEM NAME</th>
              <th style={styles.th}>FLAVOUR</th>
              <th style={styles.th}>TYPE</th>
              <th style={styles.th}>HSN</th>
              <th style={styles.th}>PRICE (₹)</th>
              <th style={styles.th}>QUANTITY</th>
              <th style={styles.th}>STATUS</th>
              <th style={styles.th}>ATTACHMENT</th>
              <th style={styles.th}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={styles.loadingState}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No raw materials found from suppliers.</td></tr>
            ) : (
              items.map((item, index) => (
                <tr key={`${item.id}-${index}`}>
                  <td style={styles.td}>
                    <span style={{ fontWeight: "500", color: "#f8fafc" }}>{item.supplierCompany}</span> <br />
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>{item.supplierName}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontWeight: '500', color: '#fff' }}>{item.name}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ background: '#334155', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {item.model || '—'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ background: '#334155', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {item.type || '—'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontFamily: 'monospace' }}>{item.watts || '—'}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontWeight: '600', color: '#10b981' }}>₹{(item.buy_price || item.buyPrice || 0).toFixed(2)}</span>
                  </td>
                  <td style={styles.td}>
                    {item.quantity}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      background: item.status === 'Pending' ? '#f59e0b' : '#334155',
                      color: item.status === 'Pending' ? '#000' : '#e2e8f0',
                      padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600'
                    }}>
                      {item.status || 'Received'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {item.attachment ? (
                      <a
                        href={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/uploads/${item.attachment}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        📎 View File
                      </a>
                    ) : (
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => addToProducts(item)}
                        title="Add to Products"
                        style={{
                          background: "#10b981", color: "white", border: "none", padding: "4px 8px",
                          borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px"
                        }}
                      >
                        <Plus size={14} /> Add
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        title="Delete Item"
                        style={{
                          background: "#ef4444", color: "white", border: "none", padding: "4px 8px",
                          borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RawMaterials;
