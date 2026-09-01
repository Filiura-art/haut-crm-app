'use client';

import React, { useState, useEffect } from 'react';
import ProjectsBoard from './components/ProjectsBoard';

export default function Home() {
  const [activeTab, setActiveTab] = useState('clients');
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [contacts, setContacts] = useState([]);

  // Загрузка контактов/лидов
  useEffect(() => {
    fetch('/api/contacts')
      .then((res) => res.json())
      .then((data) => setContacts(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  }, []);

  // Загрузка проектов
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (Array.isArray(data)) setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'projects') fetchProjects();
  }, [activeTab]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#f4f4f5', padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', paddingBottom: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.2em', color: '#c5a059', textTransform: 'uppercase', marginBottom: '4px' }}>
              HAUT CGI
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
              {activeTab === 'clients' ? 'Client Ledger' : 'Projects Board'}
            </h1>
          </div>

          {/* Navigation Switcher */}
          <div style={{ display: 'flex', gap: '8px', backgroundColor: '#18181b', padding: '4px', borderRadius: '10px', border: '1px solid #27272a' }}>
            <button
              onClick={() => setActiveTab('clients')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'clients' ? '#27272a' : 'transparent',
                color: activeTab === 'clients' ? '#ffffff' : '#a1a1aa'
              }}
            >
              📋 Client Ledger
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'projects' ? '#27272a' : 'transparent',
                color: activeTab === 'projects' ? '#ffffff' : '#a1a1aa'
              }}
            >
              🎬 Projects Board
            </button>
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              if (activeTab === 'projects') {
                alert('Для создания проекта добавьте строчку в Google Sheets на листе Projects');
              }
            }}
            style={{
              backgroundColor: '#c5a059',
              color: '#000000',
              fontWeight: 'bold',
              fontSize: '12px',
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {activeTab === 'projects' ? '+ Add project' : '+ Add contact'}
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'clients' ? (
          <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '16px' }}>
              Contacts & Leads ({contacts.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {contacts.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #27272a' }}>
                  <span style={{ fontWeight: 'bold' }}>{c.name || c.company || `Contact #${i+1}`}</span>
                  <span style={{ color: '#a1a1aa', fontSize: '12px' }}>{c.email || c.status}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {loadingProjects ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#71717a', fontSize: '14px' }}>
                Loading projects from Google Sheets...
              </div>
            ) : (
              <ProjectsBoard projects={projects} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
