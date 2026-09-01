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
    <main className="min-h-screen bg-black text-zinc-100 p-6 md:p-10">
      <header className="border-b border-zinc-800 pb-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-[#c5a059] uppercase mb-1">
              HAUT CGI
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {activeTab === 'clients' ? 'Client Ledger' : 'Projects Board'}
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'clients'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              📋 Client Ledger
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'projects'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🎬 Projects Board
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'projects' ? (
              <button
                onClick={() => alert('Для создания проекта добавьте строчку в Google Таблицу на вкладке Projects')}
                className="bg-[#c5a059] hover:bg-[#b38f48] text-black font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                + Add project
              </button>
            ) : (
              <button
                className="bg-[#c5a059] hover:bg-[#b38f48] text-black font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                + Add contact
              </button>
            )}
          </div>
        </div>
      </header>

      {activeTab === 'clients' ? (
        <div className="p-8 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500">
          Client Ledger (Sales Pipeline)
        </div>
      ) : (
        <>
          {loadingProjects ? (
            <div className="text-center py-20 text-zinc-500 text-sm font-mono">
              Loading projects from Google Sheets...
            </div>
          ) : (
            <ProjectsBoard projects={projects} onRefresh={fetchProjects} />
          )}
        </>
      )}
    </main>
  );
}
