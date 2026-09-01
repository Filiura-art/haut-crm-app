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
    <div className="min-h-screen bg-[#111111] text-[#ededed] p-6 font-sans">
      {/* Top Brand Header */}
      <div className="max-w-[1400px] mx-auto">
        <div className="text-[11px] uppercase tracking-[0.2em] text-[#c5a059] font-medium mb-1">
          HAUT CGI
        </div>

        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#222222] mb-6">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {activeTab === 'clients' ? 'Client Ledger' : 'Projects Board'}
            </h1>

            {/* Navigation Switcher */}
            <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-[#2a2a2a]">
              <button
                onClick={() => setActiveTab('clients')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'clients'
                    ? 'bg-[#282828] text-white shadow-sm'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                📋 Client Ledger
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'projects'
                    ? 'bg-[#282828] text-white shadow-sm'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                🎬 Projects Board
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'projects' ? (
              <button
                onClick={() => alert('Для добавления нового проекта внесите запись в Google Sheets на вкладке Projects')}
                className="bg-[#c5a059] hover:bg-[#b38f48] text-black font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                + Add project
              </button>
            ) : (
              <button className="bg-[#c5a059] hover:bg-[#b38f48] text-black font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                + Add contact
              </button>
            )}
          </div>
        </div>

        {/* Content View */}
        {activeTab === 'clients' ? (
          <div className="w-full">
            {/* Рендеринг таблицы/воронки лидов */}
            <div className="bg-[#181818] border border-[#262626] rounded-xl p-6 text-center text-[#777777] text-sm">
              Ваша таблица контактов и Sales Pipeline активированы на этой вкладке.
            </div>
          </div>
        ) : (
          <div>
            {loadingProjects ? (
              <div className="text-center py-20 text-[#666666] text-sm font-mono">
                Загрузка проектов из Google Sheets...
              </div>
            ) : (
              <ProjectsBoard projects={projects} onRefresh={fetchProjects} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
