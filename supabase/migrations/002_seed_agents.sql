-- Seed initial agents

INSERT INTO agents (name, role, session_key, level, avatar_url, status) VALUES
    ('Atlas', 'Squad Lead', 'agent:lead:main', 'lead', 'https://api.dicebear.com/7.x/bottts/svg?seed=atlas', 'idle'),
    ('Scout', 'Researcher', 'agent:researcher:main', 'specialist', 'https://api.dicebear.com/7.x/bottts/svg?seed=scout', 'idle'),
    ('Scribe', 'Content Writer', 'agent:writer:main', 'specialist', 'https://api.dicebear.com/7.x/bottts/svg?seed=scribe', 'idle')
ON CONFLICT (session_key) DO NOTHING;

-- Log agent creation activity
INSERT INTO activities (type, message, metadata)
SELECT 'agent_started', 'Agent ' || name || ' (' || role || ') registered', '{}'::jsonb
FROM agents
WHERE created_at > NOW() - INTERVAL '1 minute';
