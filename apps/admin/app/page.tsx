'use client';

import { useState } from 'react';
import { ContentPackUploader } from '@/components/ContentPackUploader';
import { BrandSettings } from '@/components/BrandSettings';
import { TechRadar } from '@/components/TechRadar';
import { ProviderConfig } from '@/components/ProviderConfig';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('content');
  
  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Durmah Admin Console</h1>
        <nav>
          <button 
            onClick={() => setActiveTab('content')}
            className={activeTab === 'content' ? 'active' : ''}
          >
            Content Packs
          </button>
          <button 
            onClick={() => setActiveTab('brand')}
            className={activeTab === 'brand' ? 'active' : ''}
          >
            Brand Settings
          </button>
          <button 
            onClick={() => setActiveTab('providers')}
            className={activeTab === 'providers' ? 'active' : ''}
          >
            Providers
          </button>
          <button 
            onClick={() => setActiveTab('tech-radar')}
            className={activeTab === 'tech-radar' ? 'active' : ''}
          >
            Tech Radar
          </button>
        </nav>
      </header>
      
      <main className="admin-content">
        {activeTab === 'content' && <ContentPackUploader />}
        {activeTab === 'brand' && <BrandSettings />}
        {activeTab === 'providers' && <ProviderConfig />}
        {activeTab === 'tech-radar' && <TechRadar />}
      </main>
    </div>
  );
}
