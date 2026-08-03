import type { CareerDomain, SkillCategory } from './types';

// Modular technical skill knowledge base.
// Each category covers a distinct domain. New domains can be added without
// touching the analysis architecture — the matcher iterates all categories.

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    name: 'Programming Languages',
    skills: [
      'Python', 'Java', 'JavaScript', 'TypeScript', 'C', 'C++', 'C#', 'Go', 'Rust',
      'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Dart', 'Perl',
      'Objective-C', 'Shell Scripting', 'Bash', 'PowerShell', 'Lua', 'Elixir', 'Clojure',
      'Haskell', 'Julia', 'Groovy', 'Assembly', 'VBA',
    ],
  },
  {
    name: 'Web Frameworks',
    skills: [
      'React', 'Angular', 'Vue', 'Next.js', 'Nuxt', 'Svelte', 'Express', 'Node.js',
      'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot', 'Ruby on Rails', 'Laravel',
      'ASP.NET', 'Gin', 'Echo', 'Remix', 'Gatsby', 'Bootstrap', 'Tailwind CSS',
      'Material UI', 'Redux', 'GraphQL', 'Apollo', 'Socket.io', 'WebSockets',
    ],
  },
  {
    name: 'Databases',
    skills: [
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server',
      'Cassandra', 'DynamoDB', 'Elasticsearch', 'Neo4j', 'Firebase', 'Supabase',
      'MariaDB', 'CouchDB', 'InfluxDB', 'Snowflake', 'BigQuery', 'Redshift',
      'Dgraph', 'ArangoDB', 'Amazon RDS', 'Aurora',
    ],
  },
  {
    name: 'Cloud Technologies',
    skills: [
      'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
      'Ansible', 'CloudFormation', 'Serverless', 'Lambda', 'EC2', 'S3', 'RDS',
      'CloudFront', 'Cloudflare', 'Vercel', 'Heroku', 'Netlify', 'DigitalOcean',
      'IBM Cloud', 'OpenStack', 'Helm', 'Istio', 'Knative', 'Cloud Run', 'App Engine',
    ],
  },
  {
    name: 'DevOps & CI/CD',
    skills: [
      'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'Travis CI', 'Bamboo',
      'ArgoCD', 'Prometheus', 'Grafana', 'Datadog', 'Splunk', 'ELK Stack',
      'Nagios', 'Zabbix', 'Vault', 'Consul', 'Packer', 'Vagrant', 'Chef', 'Puppet',
    ],
  },
  {
    name: 'AI/ML Frameworks',
    skills: [
      'TensorFlow', 'PyTorch', 'Keras', 'scikit-learn', 'Pandas', 'NumPy',
      'SciPy', 'Matplotlib', 'Seaborn', 'NLTK', 'spaCy', 'Hugging Face',
      'Transformers', 'OpenAI', 'LangChain', 'LlamaIndex', 'Jupyter', 'OpenCV',
      'YOLO', 'XGBoost', 'LightGBM', 'CatBoost', 'MLflow', 'Kubeflow', 'Airflow',
      'Sentence Transformers', 'Gensim', 'FastText', 'Word2Vec',
    ],
  },
  {
    name: 'Data Science & Analytics',
    skills: [
      'Data Analysis', 'Data Visualization', 'Statistical Analysis', 'Machine Learning',
      'Deep Learning', 'NLP', 'Computer Vision', 'Time Series Analysis', 'A/B Testing',
      'ETL', 'Data Warehousing', 'Data Mining', 'Big Data', 'Spark', 'Hadoop',
      'Kafka', 'Flink', 'Tableau', 'Power BI', 'Looker', 'dbt', 'Databricks',
      'Feature Engineering', 'Model Deployment', 'MLOps', 'Reinforcement Learning',
    ],
  },
  {
    name: 'Cybersecurity',
    skills: [
      'Penetration Testing', 'Vulnerability Assessment', 'Network Security',
      'Cryptography', 'SIEM', 'Incident Response', 'Forensics', 'OWASP',
      'Burp Suite', 'Nessus', 'Metasploit', 'Wireshark', 'Nmap', 'Kali Linux',
      'ISO 27001', 'NIST', 'SOC 2', 'GDPR', 'Zero Trust', 'IAM',
    ],
  },
  {
    name: 'Software Engineering',
    skills: [
      'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Agile', 'Scrum', 'Kanban', 'Jira',
      'Confluence', 'REST API', 'gRPC', 'Microservices', 'System Design',
      'Object-Oriented Programming', 'Design Patterns', 'SOLID', 'TDD', 'Unit Testing',
      'Jest', 'Pytest', 'JUnit', 'Selenium', 'Cypress', 'Playwright', 'CI/CD',
      'Code Review', 'Refactoring', 'Documentation', 'Linux', 'Unix',
    ],
  },
  {
    name: 'Soft Skills',
    skills: [
      'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
      'Time Management', 'Adaptability', 'Creativity', 'Collaboration',
      'Presentation Skills', 'Mentoring', 'Project Management', 'Negotiation',
      'Conflict Resolution', 'Decision Making', 'Analytical Skills',
    ],
  },
];

// Flat list of all technical skills (excluding soft skills) for quick lookup.
export const ALL_TECHNICAL_SKILLS: string[] = SKILL_CATEGORIES.filter(
  (c) => c.name !== 'Soft Skills'
).flatMap((c) => c.skills);

// Normalized skill lookup map (lowercase key -> canonical name).
const skillLookup = new Map<string, string>();
[...ALL_TECHNICAL_SKILLS].forEach((s) => {
  skillLookup.set(s.toLowerCase(), s);
});

export function normalizeSkill(raw: string): string | null {
  return skillLookup.get(raw.trim().toLowerCase()) ?? null;
}

// Domain-specific recommended certifications.
export const DOMAIN_CERTIFICATIONS: Record<Exclude<CareerDomain, 'general'>, string[]> = {
  'software-engineering': [
    'AWS Certified Developer – Associate',
    'Microsoft Certified: Azure Developer Associate',
    'Professional Cloud Developer (Google Cloud)',
    'Certified Kubernetes Application Developer (CKAD)',
    'Oracle Certified Professional Java Programmer',
  ],
  'data-science': [
    'Google Data Analytics Professional Certificate',
    'Microsoft Certified: Azure Data Scientist Associate',
    'IBM Data Science Professional Certificate',
    'SAS Certified Data Scientist',
    'TensorFlow Developer Certificate',
  ],
  'devops-cloud': [
    'AWS Certified DevOps Engineer – Professional',
    'Certified Kubernetes Administrator (CKA)',
    'HashiCorp Terraform Certification',
    'Microsoft Certified: DevOps Engineer Expert',
    'Google Cloud Professional DevOps Engineer',
  ],
  'cybersecurity': [
    'CompTIA Security+',
    'CISSP (Certified Information Systems Security Professional)',
    'CEH (Certified Ethical Hacker)',
    'CISA (Certified Information Systems Auditor)',
    'Offensive Security Certified Professional (OSCP)',
  ],
  'ai-ml': [
    'TensorFlow Developer Certificate',
    'Deep Learning Specialization (Coursera)',
    'Microsoft Certified: Azure AI Engineer Associate',
    'NVIDIA Deep Learning Institute Certification',
    'AWS Certified Machine Learning – Specialty',
  ],
};

// Domain → recommended technologies a candidate should know.
export const DOMAIN_TECH_STACKS: Record<Exclude<CareerDomain, 'general'>, string[]> = {
  'software-engineering': ['React', 'TypeScript', 'Node.js', 'Docker', 'Git', 'REST API', 'PostgreSQL', 'AWS'],
  'data-science': ['Python', 'Pandas', 'NumPy', 'scikit-learn', 'SQL', 'Tableau', 'Jupyter', 'TensorFlow'],
  'devops-cloud': ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'Jenkins', 'Linux', 'Prometheus', 'Ansible'],
  'cybersecurity': ['Wireshark', 'Nmap', 'Metasploit', 'OWASP', 'Linux', 'SIEM', 'Cryptography', 'NIST'],
  'ai-ml': ['Python', 'PyTorch', 'TensorFlow', 'Hugging Face', 'Transformers', 'scikit-learn', 'OpenAI', 'LangChain'],
};
