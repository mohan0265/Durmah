import { useQuery } from '@tanstack/react-query';
import { ProviderCandidate } from '@durmah/schema';

export function TechRadar() {
  const { data: candidates, isLoading } = useQuery({
    queryKey: ['tech-candidates'],
    queryFn: async () => {
      const res = await fetch('/api/techwatch/candidates');
      return res.json() as Promise<ProviderCandidate[]>;
    }
  });
  
  if (isLoading) return <div>Loading tech radar...</div>;
  
  return (
    <div className="tech-radar">
      <h2>Technology Radar</h2>
      <div className="candidates-grid">
        {candidates?.map(candidate => (
          <div key={candidate.id} className="candidate-card">
            <h3>{candidate.vendor}</h3>
            <div className="scores">
              <span>Fit: {candidate.fitScore}/100</span>
              <span>Risk: {candidate.riskScore}/100</span>
            </div>
            <div className="capabilities">
              {candidate.capabilities.map(cap => (
                <span key={cap} className="capability-badge">{cap}</span>
              ))}
            </div>
            <div className="actions">
              <button>Generate Adapter</button>
              <button>Start Canary 5%</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
