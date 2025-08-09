#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🌱 Starting database seed...');
  
  try {
    // Create organizations
    const { data: orgs, error: orgError } = await supabase
      .from('orgs')
      .insert([
        {
          id: 'durham-uni',
          name: 'Durham University',
          config_url: 'http://localhost:8080/v1/config/durham'
        },
        {
          id: 'oxford-uni',
          name: 'Oxford University',
          config_url: 'http://localhost:8080/v1/config/oxford'
        },
        {
          id: 'cambridge-uni',
          name: 'Cambridge University',
          config_url: 'http://localhost:8080/v1/config/cambridge'
        }
      ])
      .select();
    
    if (orgError) throw orgError;
    console.log('✅ Organizations created');
    
    // Create demo users
    const { data: users, error: userError } = await supabase
      .from('users')
      .insert([
        {
          org_id: 'durham-uni',
          email: 'student1@durham.ac.uk',
          role: 'student'
        },
        {
          org_id: 'durham-uni',
          email: 'admin@durham.ac.uk',
          role: 'admin'
        },
        {
          org_id: 'oxford-uni',
          email: 'student1@oxford.ac.uk',
          role: 'student'
        }
      ])
      .select();
    
    if (userError) throw userError;
    console.log('✅ Users created');
    
    // Load content packs
    const durhamPack = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../packages/content-packs/samples/durham-2025.json'),
        'utf8'
      )
    );
    
    const { error: packError } = await supabase
      .from('content_packs')
      .insert([
        {
          org_id: 'durham-uni',
          pack_json: durhamPack
        }
      ]);
    
    if (packError) throw packError;
    console.log('✅ Content packs loaded');
    
    // Create sample provider candidates for Tech Radar
    const { error: candidateError } = await supabase
      .from('provider_candidates')
      .insert([
        {
          vendor: 'Voxa TTS v3',
          category: 'tts',
          capabilities: ['tts:stream', 'tts:multilingual', 'tts:voice-clone'],
          fit_score: 85,
          risk_score: 25,
          status: 'new',
          data_json: {
            latencyClaimMs: 400,
            pricingNote: '$0.015 per 1K chars',
            jurisdictions: ['EU', 'US', 'SG']
          }
        },
        {
          vendor: 'Claude 3 Opus',
          category: 'llm',
          capabilities: ['llm:functions', 'llm:realtime', 'llm:tooluse'],
          fit_score: 92,
          risk_score: 15,
          status: 'under_review',
          data_json: {
            model: 'claude-3-opus',
            contextWindow: 200000
          }
        }
      ]);
    
    if (candidateError) throw candidateError;
    console.log('✅ Tech Radar candidates created');
    
    console.log('🎉 Database seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seed
seed();
