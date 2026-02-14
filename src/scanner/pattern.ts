import * as vscode from 'vscode';

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface Pattern {
  type: string;
  regex: RegExp;
  severity: Severity;
  confidence: number;
  isCustom?: boolean;
}

export interface Finding {
  file: string;
  line: number;
  type: string;
  key: string;
  value: string;
  severity: string;
}

export const defaultPatterns: Pattern[] = [
  {
    type: "RSA Private Key",
    regex: /-----BEGIN RSA PRIVATE KEY-----/,
    severity: "CRITICAL",
    confidence: 1.0
  },
  {
    type: "OpenSSH Private Key",
    regex: /-----BEGIN OPENSSH PRIVATE KEY-----/,
    severity: "CRITICAL",
    confidence: 1.0
  },
  {
    type: "PGP Private Key",
    regex: /-----BEGIN PGP PRIVATE KEY BLOCK-----/,
    severity: "CRITICAL",
    confidence: 1.0
  },
  {
    type: "Private Key (Generic)",
    regex: /-----BEGIN (RSA|DSA|EC|OPENSSH|PGP)? ?PRIVATE KEY-----/,
    severity: "CRITICAL",
    confidence: 0.95
  },
  {
    type: "AWS Access Key ID",
    regex: /AKIA[0-9A-Z]{16}/,
    severity: "HIGH",
    confidence: 0.9
  },
  {
    type: "AWS Secret Access Key",
    regex: /aws(.{0,20})?(secret|private)[^a-z0-9]{0,10}[a-z0-9/+=]{40}/i,
    severity: "CRITICAL",
    confidence: 0.95
  },
  {
    type: "Google API Key",
    regex: /AIza[0-9A-Za-z\-_]{35}/,
    severity: "HIGH",
    confidence: 0.9
  },
  {
    type: "JWT Token",
    regex: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
    severity: "HIGH",
    confidence: 0.85
  },
  {
    type: "Bearer Token",
    regex: /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/i,
    severity: "HIGH",
    confidence: 0.8
  },
  {
    type: "GitHub Token",
    regex: /gh[pousr]_[A-Za-z0-9_]{36,255}/,
    severity: "HIGH",
    confidence: 0.95
  },
  {
    type: "GitLab Access Token",
    regex: /glpat-[A-Za-z0-9\-_]{20,}/,
    severity: "HIGH",
    confidence: 0.95
  },
  {
    type: "Slack Token",
    regex: /xox[baprs]-[A-Za-z0-9-]{10,48}/,
    severity: "HIGH",
    confidence: 0.9
  },
  {
    type: "Stripe API Key",
    regex: /sk_(live|test)_[0-9a-zA-Z]{24,}/,
    severity: "HIGH",
    confidence: 0.9
  },
  {
    type: "Twilio API Key",
    regex: /SK[0-9a-fA-F]{32}/,
    severity: "HIGH",
    confidence: 0.9
  },
  {
    type: "Facebook Access Token",
    regex: /EAACEdEose0cBA[0-9A-Za-z]+/,
    severity: "HIGH",
    confidence: 0.85
  },
  {
    type: "Generic Token",
    regex: /(token|access_token|auth_token)[^a-zA-Z0-9]{0,10}['"]?[a-z0-9_\-]{16,64}['"]?/i,
    severity: "MEDIUM",
    confidence: 0.7
  },
  {
    type: "Generic API Key",
    regex: /(api[_-]?key|apikey)[^a-zA-Z0-9]{0,10}['"]?[a-z0-9_\-]{16,64}['"]?/i,
    severity: "MEDIUM",
    confidence: 0.7
  },
  {
    type: "Generic Secret",
    regex: /(secret|client_secret|private_key)[^a-zA-Z0-9]{0,10}['"]?[a-z0-9_\-]{16,64}['"]?/i,
    severity: "MEDIUM",
    confidence: 0.7
  },
  {
    type: ".env Secret",
    regex: /^[A-Z0-9_]+=(["'])?[A-Za-z0-9_\-/.+=]{12,}\1?$/m,
    severity: "LOW",
    confidence: 0.6
  }
];

export default function getPatterns(): Pattern[] {
  const config = vscode.workspace.getConfiguration('dontCommitThat');
  const userPatternsRaw = config.get<any[]>('customPatterns') || [];
  const userPatterns: Pattern[] = userPatternsRaw.map((raw) => {
    const type = raw.type || raw.name || 'Custom Pattern';
    let regex: RegExp;
    try {
      regex = new RegExp(raw.regex, raw.flags || '');
    } catch (e) {
      console.warn('[dont-commit-that] Invalid custom pattern regex:', raw.regex, 'Error:', e);
      return null;
    }
    return {
      type,
      regex,
      severity: raw.severity || 'LOW',
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5,
      isCustom: true
    };
  }).filter(Boolean) as Pattern[];
  return mergePatterns(defaultPatterns, userPatterns);
}

function mergePatterns(
  defaults: Pattern[],
  userPatterns: Pattern[]
): Pattern[] {
  const map = new Map<string, Pattern>();

  for (const pattern of defaults) {
    map.set(pattern.type, pattern);
  }

  for (const pattern of userPatterns) {
    if (pattern && pattern.type && pattern.regex instanceof RegExp) {
      map.set(pattern.type, pattern);
    }
  }

  return Array.from(map.values());
}