'use client';

import React, { useState, useEffect } from 'react';
import ProjectsBoard from './components/ProjectsBoard';

export default function Home() {
  const [activeTab, setActiveTab] = useState('clients');
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'projects') {
      fetchProjects();
    }
  }, [activeTab]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#f4f4f5', padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', itemsCenter: 'center', borderBottom: '1px solid #27272a', paddingBottom: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.2em', color: '#c5a059', textTransform: 'uppercase', marginBottom: '4px' }}>
              HAUT CGI
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
              {activeTab === 'clients' ? 'Client Ledger' : 'Projects Board'}
            </h1>
          </div>

          {/* Tabs */}
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

        {/* Views */}
        {activeTab === 'clients' ? (
          <div style={{ padding: '40px', border: '1px dashed #27272a', borderRadius: '12px', textAlign: 'center', color: '#71717a' }}>
            [Основной список клиентов]
          </div>
        ) : (
          <>
            {loadingProjects ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#71717a', fontSize: '14px' }}>
                Loading projects from Google Sheets...
              </div>
            ) : (
              <ProjectsBoard projects={projects} onRefresh={fetchProjects} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
