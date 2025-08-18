import React, { useEffect, useState } from "react";
import DailyCountChart from "./DailyCountChart";
import TitleCountChart from "./TitleCountChart";

function App() {
  const [agencies, setAgencies] = useState([]);
  const [wordCount, setwordCount] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState("");
  const [description, setdescription] = useState("");
  const [dailyCount, setdailyCount] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChild, setSelectedChild] = useState("");
  const [titleCounts, setTitleCounts] = useState({});

 useEffect(() => {
  fetch("http://localhost:4000/api/agents")
    .then((res) => res.json())
    .then((data) => {
      setAgencies(data.agencies || []);
    })
    .catch((err) => console.error("Error fetching agencies:", err));
 }, []);

  const fetchAgencyData = (agencySlug, term, childSlug = null) => {
    const params = new URLSearchParams();
    params.append('agency', agencySlug);
    if (childSlug) params.append('child', childSlug);
    if (term && term.trim() !== "") params.append('query', term);

    fetch(`http://localhost:4000/api/search/count?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setwordCount(data.meta?.total_count || []);
        setdescription(data.meta?.description || "");
      })
      .catch((err) => console.error("Error fetching count:", err));

    fetch(`http://localhost:4000/api/search/daily?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setdailyCount(data.dates || []);
      })
      .catch((err) => console.error("Error fetching daily count:", err));

    fetch(`http://localhost:4000/api/search/titles?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setTitleCounts(data.titles || {});
      })
      .catch((err) => console.error("Error fetching title counts:", err));
  };

  const agencyOnChange = (event) => {
    const value = event.target.value;
    const agency = agencies.find((a) => a.slug === value);
    setSelectedAgency(agency);
    setSelectedChild("");
    //fetchAgencyData(value, searchTerm);
  };

  const childOnChange = (event) => {
    setSelectedChild(event.target.value);
  };

  const handleSearchTermChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (selectedAgency && selectedAgency.slug) {
      fetchAgencyData(selectedAgency.slug, searchTerm, selectedChild || null);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "1rem",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        padding: "2.5rem 3rem",
        minWidth: "350px",
        textAlign: "center"
      }}>
        <h1 style={{
          color: "#2d3a4b",
          marginBottom: "2rem",
          fontWeight: 700,
          letterSpacing: "0.02em"
        }}>eCFR Dashboard</h1>

        <form onSubmit={handleSearch} style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <select
            value={selectedAgency.slug}
            onChange={agencyOnChange}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1.1rem",
              borderRadius: "0.5rem",
              border: "1px solid #b0b8c1",
              background: "#f7fafc",
              color: "#2d3a4b",
              outline: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              transition: "border 0.2s"
            }}
          >
            <option value="">-- Select an Agency --</option>
            {agencies.map((agency) => (
              <option key={agency.slug} value={agency.slug}>
                {agency.display_name}
              </option>
            ))}
          </select>
          {selectedAgency && selectedAgency.children && selectedAgency.children.length > 0 && (
            <select
              value={selectedChild}
              onChange={childOnChange}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "1.1rem",
                borderRadius: "0.5rem",
                border: "1px solid #b0b8c1",
                background: "#f7fafc",
                color: "#2d3a4b",
                outline: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                transition: "border 0.2s"
              }}
            >
              <option value="">-- Select a Sub-Agency --</option>
              {selectedAgency.children.map((child) => (
                <option key={child.slug} value={child.slug}>
                  {child.display_name}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="Search term (optional)"
            value={searchTerm}
            onChange={handleSearchTermChange}
            style={{
              padding: "0.75rem 1rem",
              fontSize: "1.1rem",
              borderRadius: "0.5rem",
              border: "1px solid #b0b8c1",
              background: "#f7fafc",
              color: "#2d3a4b",
              outline: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              transition: "border 0.2s"
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1.1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#3a4d63",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
            }}
            disabled={!selectedAgency || !selectedAgency.slug}
          >
            Search
          </button>
        </form>

        {selectedAgency && description && (
          <p style={{
            marginTop: "1rem",
            color: "#3a4d63",
            fontSize: "1.1rem"
          }}>
            {description}
          </p>
        )}
        {wordCount && (
          <p style={{
            marginTop: "0.5rem",
            color: "#5a6d85",
            fontSize: "1rem"
          }}>
            Word count for agency: <strong>{wordCount}</strong>
          </p>
        )}
        {(dailyCount || titleCounts) && (
          <div style={{ marginTop: "2rem", display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ minWidth: 350, flex: 1 }}>
              <p><strong>Daily Count Over Time</strong></p>
              <p>Sum of daily counts: {typeof dailyCount === 'object' && dailyCount !== null ? Object.values(dailyCount).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0) : 0}</p>
              <DailyCountChart dailyCount={dailyCount} />
            </div>
            <div style={{ minWidth: 350, flex: 1 }}>
              <p><strong>Count Per Title</strong></p>
              <p>Sum counts: {typeof titleCounts === 'object' && titleCounts !== null ? Object.values(titleCounts).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0) : 0}</p>
              <TitleCountChart titleCounts={titleCounts} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
