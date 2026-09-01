'use client';

import React, { useState } from 'react';

const STAGES = ['Pre-Production', 'Production', 'Post-Production', 'Delivered'];

export default function ProjectsBoard({ projects = [], onRefresh }) {
  const [filter, setFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Фильтрация проектов
  const filteredProjects = projects.filter((prj) => {
    if (filter === 'Our Side') return prj.ball === 'Our Side';
    if (filter === 'Client Side') return prj.ball === 'Client Side';
    if (filter === 'Payment Due') return prj.calculated?.outstandingAED > 0;
    if (filter === 'Delivered') return prj.stage === 'Delivered';
    if (filter === 'On Hold') return prj.status === 'On Hold';
    return true;
  });

  // Отправка задачи в Google Calendar через существующий API /api/tasks
  const handleAddToCalendar = async (prj) => {
    if (!prj.actionDate || !prj.waitingFor) {
      alert('Пожалуйста, заполните Action Date и Next Action перед отправкой в Календарь.');
      return;
    }

    setCalendarLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[${prj.name}] ${prj.waitingFor}`,
          date: prj.actionDate,
          description: `Project: ${prj.name}\nClient: ${prj.clientId}\nAction Side: ${prj.ball}`,
        }),
      });

      if (res.ok) {
        alert('Задача успешно добавлена в Google Календарь!');
      } else {
        alert('Ошибка при добавлении задачи в календарь.');
      }
    } catch (err) {
      console.error(err);
      alert('Произошла ошибка.');
    } finally {
      setCalendarLoading(false);
    }
  };

  return (
    <div className="w-full text-zinc-100 mt-4">
      {/* Фильтры */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Our Side', 'Client Side', 'Payment Due', 'Delivered', 'On Hold'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-[#c5a059] text-black font-bold'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700/50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {STAGES.map((stage) => {
          const stageProjects = filteredProjects.filter((p) => p.stage === stage);
          return (
            <div key={stage} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3 min-h-[500px]">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{stage}</h3>
                <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-mono">
                  {stageProjects.length}
                </span>
              </div>

              <div className="space-y-3">
                {stageProjects.map((prj) => (
                  <div
                    key={prj.id}
                    onClick={() => setSelectedProject(prj)}
                    className="bg-zinc-900 border border-zinc-800 hover:border-[#c5a059]/50 rounded-lg p-3 cursor-pointer transition-all shadow-sm group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm text-zinc-100 group-hover:text-[#c5a059] transition-colors">
                        {prj.name}
                      </span>
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                        {prj.type}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 mb-3">{prj.clientId}</div>

                    {/* Ball & Next Action Indicator */}
                    <div className="mb-3">
                      <div
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mb-1 uppercase tracking-wide ${
                          prj.ball === 'Client Side'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {prj.ball}
                      </div>
                      {prj.waitingFor && (
                        <p className="text-xs text-zinc-300 line-clamp-2">
                          <span className="text-zinc-500">Next:</span> {prj.waitingFor}
                        </p>
                      )}
                    </div>

                    {/* Financial & Deadline Footer */}
                    <div className="flex justify-between items-center text-[11px] border-t border-zinc-800/80 pt-2 text-zinc-400">
                      <span className="font-mono text-zinc-200">
                        {prj.calculated?.totalAED?.toLocaleString()} AED
                      </span>
                      {prj.deadline && (
                        <span className="text-zinc-400 font-mono">
                          📅 {prj.deadline}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 text-zinc-100 space-y-6">
            <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedProject.name}</h2>
                <p className="text-sm text-zinc-400">Client: {selectedProject.clientId} • Contact: {selectedProject.contactPerson}</p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Action / Ball & Calendar Integration */}
            <div className="bg-zinc-800/40 border border-zinc-800 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-semibold text-[#c5a059] uppercase tracking-wider">Action / Ball & Calendar</h4>
              <div className="flex gap-4 items-center">
                <div className="text-sm">
                  <span className="text-zinc-400">Current Ball:</span>{' '}
                  <span className="font-bold text-white">{selectedProject.ball}</span>
                </div>
                <div className="text-sm">
                  <span className="text-zinc-400">Action Date:</span>{' '}
                  <span className="font-bold text-white font-mono">{selectedProject.actionDate || 'Not set'}</span>
                </div>
              </div>
              <p className="text-sm text-zinc-200 bg-zinc-900 p-2.5 rounded border border-zinc-800">
                <span className="text-zinc-500">Waiting for / Next Action:</span> {selectedProject.waitingFor || 'N/A'}
              </p>

              {/* Action Button: Push to Google Calendar */}
              <button
                onClick={() => handleAddToCalendar(selectedProject)}
                disabled={calendarLoading}
                className="w-full bg-[#c5a059] hover:bg-[#b38f48] text-black font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                📅 {calendarLoading ? 'Adding to Google Calendar...' : 'Add Action to Google Calendar'}
              </button>
            </div>

            {/* Financial Summary (in AED) */}
            <div className="bg-zinc-800/40 border border-zinc-800 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-semibold text-[#c5a059] uppercase tracking-wider">Financial Summary (AED)</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-400">Total Value</div>
                  <div className="text-sm font-bold font-mono text-white">
                    {selectedProject.calculated?.totalAED?.toLocaleString()} AED
                  </div>
                </div>
                <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-400">Paid</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    {selectedProject.calculated?.paidAED?.toLocaleString()} AED
                  </div>
                </div>
                <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-400">Outstanding</div>
                  <div className="text-sm font-bold font-mono text-amber-400">
                    {selectedProject.calculated?.outstandingAED?.toLocaleString()} AED
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProject(null)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 px-5 rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
