import { WidgetConfig } from '@durmah/schema';

export interface DurmahOptions {
  mount: string;
  configUrl: string;
  user: {
    id: string;
    orgId: string;
    email: string;
  };
}

export async function initDurmah(options: DurmahOptions): Promise<void> {
  // Fetch configuration
  const configResponse = await fetch(options.configUrl);
  const config: WidgetConfig = await configResponse.json();
  
  // Create widget container
  const container = document.querySelector(options.mount);
  if (!container) {
    throw new Error(`Mount point ${options.mount} not found`);
  }
  
  // Load widget styles
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = `${config.serverUrl}/widget.css`;
  document.head.appendChild(styleLink);
  
  // Load widget script
  const script = document.createElement('script');
  script.src = `${config.serverUrl}/widget.js`;
  script.onload = () => {
    // Initialize widget with config
    (window as any).DurmahWidget.init({
      container,
      config,
      user: options.user
    });
  };
  document.body.appendChild(script);
}

export function destroyDurmah(): void {
  (window as any).DurmahWidget?.destroy();
}

## Admin Console

### apps/admin/package.json
