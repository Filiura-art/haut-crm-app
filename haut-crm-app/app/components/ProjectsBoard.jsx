'use client';

import React, { useState } from 'react';

const STAGES = ['Pre-Production', 'Production', 'Post-Production', 'Delivered'];

export default function ProjectsBoard({ projects = [] }) {
  const [filter, setFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const filteredProjects = projects.filter((prj) => {
    if (filter === 'Our Side') return prj.ball === 'Our Side';
    if (filter === 'Client Side') return prj.ball === 'Client Side';
    if (filter === 'Payment Due') return prj.calculated?.outstandingAED > 0;
    if (filter === 'Delivered') return prj.stage === 'Delivered';
    if (filter === 'On Hold') return prj.status === 'On Hold';
    return true;
  });

  const handleAddToCalendar = async (prj) => {
    if (!prj.actionDate || !prj.waitingFor) {
      alert('Пожалуйста, заполните Action Date и Next Action.');
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

      if (res.ok) alert('Задача добавлена в Google Календарь!');
      else alert('Ошибка при добавлении.');
    } catch (err) {
      alert('Произошла ошибка.');
    } finally {
      setCalendarLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto' }}>
        {['All', 'Our Side', 'Client Side', 'Payment Due', 'Delivered', 'On Hold'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              border: filter === f ? 'none' : '1px solid #27272a',
              backgroundColor: filter === f ? '#c5a059' : '#18181b',
              color: filter === f ? '#000000' : '#a1a1aa',
              cursor: 'pointer'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {STAGES.map((stage) => {
          const stageProjects = filteredProjects.filter((p) => p.stage === stage);
          return (
            <div key={stage} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '14px', minHeight: '450px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #27272a', paddingBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa', textTransform: 'uppercase' }}>{stage}</span>
                <span style={{ fontSize: '11px', backgroundColor: '#27272a', padding: '2px 8px', borderRadius: '4px', color: '#f4f4f5' }}>{stageProjects.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stageProjects.map((prj) => (
                  <div
                    key={prj.id}
                    onClick={() => setSelectedProject(prj)}
                    style={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '12px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#ffffff' }}>{prj.name}</span>
                      <span style={{ fontSize: '10px', backgroundColor: '#27272a', color: '#a1a1aa', padding: '2px 6px', borderRadius: '4px' }}>{prj.type}</span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '10px' }}>{prj.clientId}</div>

                    <div style={{ marginBottom: '10px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: prj.ball === 'Client Side' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: prj.ball === 'Client Side' ? '#fbbf24' : '#60a5fa',
                        border: prj.ball === 'Client Side' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        {prj.ball}
                      </span>
                      {prj.waitingFor && (
                        <p style={{ fontSize: '11px', color: '#d4d4d8', margin: '4px 0 0 0' }}>
                          <span style={{ color: '#71717a' }}>Next:</span> {prj.waitingFor}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderTop: '1px solid #27272a', paddingTop: '8px', color: '#a1a1aa' }}>
                      <span>{prj.calculated?.totalAED?.toLocaleString()} AED</span>
                      {prj.deadline && <span>📅 {prj.deadline}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Detail */}
      {selectedProject && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', itemsCenter: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '16px', maxWidth: '600px', width: '100%', padding: '24px', color: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #27272a', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{selectedProject.name}</h2>
                <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '4px 0 0 0' }}>Client: {selectedProject.clientId}</p>
              </div>
              <button onClick={() => setSelectedProject(null)} style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ backgroundColor: '#09090b', border: '1px solid #27272a', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#c5a059', marginBottom: '8px' }}>ACTION / BALL</div>
              <div style={{ fontSize: '13px', marginBottom: '4px' }}>Ball: <strong>{selectedProject.ball}</strong></div>
              <div style={{ fontSize: '13px', marginBottom: '12px' }}>Next Action: {selectedProject.waitingFor}</div>

              <button
                onClick={() => handleAddToCalendar(selectedProject)}
                disabled={calendarLoading}
                style={{ width: '100%', backgroundColor: '#c5a059', color: '#000000', fontWeight: 'bold', padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
              >
                📅 {calendarLoading ? 'Adding...' : 'Add Action to Google Calendar'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedProject(null)} style={{ backgroundColor: '#27272a', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
