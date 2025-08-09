# Tech Watch Documentation

## Overview

The Tech Watch system continuously monitors the AI ecosystem for new providers and capabilities that could enhance Durmah.

## Architecture

### Components

1. **Collectors** - Gather updates from approved sources
2. **Scorer** - Evaluate fitness and risk of discoveries
3. **Worker** - Orchestrates scheduled scans
4. **Persistence** - Stores candidates in database
5. **Notifier** - Alerts admins of high-value finds

## Approved Sources

### Primary Sources
- **OpenAI Blog**: API updates, model releases
- **Anthropic Blog**: Claude models, safety research
- **Mistral Blog**: European LLM innovations
- **Google AI Blog**: Gemini, PaLM updates
- **Microsoft Azure AI**: Cognitive Services updates

### Technical Sources
- **Deepgram Releases**: STT improvements
- **AssemblyAI Changelog**: Speech features
- **ElevenLabs Changelog**: Voice synthesis updates
- **Hugging Face Models**: Open source models
- **GitHub Releases**: SDK updates

### Benchmarks
- **LMSYS Arena**: LLM performance rankings
- **HELM**: Holistic evaluation metrics
- **Papers with Code**: SOTA implementations
- **arXiv RSS**: cs.CL, cs.SD, cs.LG categories

## Scoring Rubric

### Fit Score (0-100)
Factors:
- **Capability coverage** (40%): Match against needed features
- **Performance claims** (30%): Latency, accuracy metrics
- **Regional support** (20%): Data residency compliance
- **Price efficiency** (10%): Cost vs current providers

### Risk Score (0-100)
Factors:
- **Maturity** (30%): GA=10, Beta=50, Alpha=80
- **Terms of Service** (25%): License compatibility
- **Vendor stability** (25%): Company track record
- **Community adoption** (20%): Usage metrics

## Thresholds

### Auto-Candidate Creation
- Fit Score ≥ 70
- Risk Score ≤ 40
- At least 2 matching capabilities

### High Priority Alert
- Fit Score ≥ 85
- Risk Score ≤ 25
- Immediate email/Slack notification

### Auto-Reject
- Risk Score > 80
- License conflicts
- ToS prohibits our use case

## Admin Actions

### One-Click Operations
1. **Generate Adapter Stub**
   - Creates provider implementation
   - Adds contract tests
   - Updates registry

2. **Start Canary**
   - Default 5% traffic
   - Sticky sessions by user hash
   - 24-hour minimum trial

3. **Schedule POC Bench**
   - Run performance tests
   - Compare against baseline
   - Generate report

## Canary Promotion Policy

### Automatic Promotion
Conditions (all must be met):
- 24 hours elapsed
- Error rate < baseline + 0.5%
- P95 latency < baseline + 100ms
- No critical incidents

### Automatic Rollback
Triggers (any):
- Error rate > baseline + 2%
- P95 latency > baseline + 500ms
- Critical incident reported

## Configuration

### Environment Variables
