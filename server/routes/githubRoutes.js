const fetch = require('node-fetch');
const repositories = require('../../src/shared/repositories.json');

const TOKEN_SECRET_NAME = 'environment-token';
const TOKEN_ENV_FALLBACK = 'GITHUB_TOKEN';

async function getSecretValue(secretClient, secretName, envFallback) {
  if (!secretClient) {
    const envValue = process.env[envFallback];
    if (!envValue) {
      throw new Error(`Secret client unavailable and environment variable ${envFallback} is not set.`);
    }
    return envValue;
  }

  const secret = await secretClient.getSecret(secretName);
  if (!secret?.value) {
    const envValue = process.env[envFallback];
    if (!envValue) {
      throw new Error(`Secret ${secretName} is empty and environment variable ${envFallback} is not set.`);
    }
    return envValue;
  }

  return secret.value;
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed for ${url} (${response.status}). ${body}`);
  }

  return response.json();
}

async function fetchRepositorySnapshot(repo, token) {
  const repoInfo = await fetchJson(`https://api.github.com/repos/${repo.owner}/${repo.name}`, token);
  const branches = await fetchJson(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/branches?per_page=100`,
    token,
  );

  return {
    fullName: repoInfo.full_name ?? `${repo.owner}/${repo.name}`,
    pushedAt: repoInfo.pushed_at,
    htmlUrl: repoInfo.html_url,
    branches: Array.isArray(branches)
      ? branches.map((branch) => ({
          name: branch.name,
          commitSha: branch.commit?.sha,
          commitDate: branch.commit?.commit?.committer?.date || branch.commit?.commit?.author?.date,
          htmlUrl: branch.commit?.html_url || branch.commit?.url,
        }))
      : [],
  };
}

function registerGithubRoutes(app, secretClient) {
  let cachedToken = null;

  app.get('/api/github/repositories/updates', async (_req, res) => {
    try {
      if (!cachedToken) {
        cachedToken = await getSecretValue(secretClient, TOKEN_SECRET_NAME, TOKEN_ENV_FALLBACK);
      }

      const results = await Promise.allSettled(
        repositories.map((repo) => fetchRepositorySnapshot(repo, cachedToken)),
      );

      const repositoriesPayload = results.map((result, index) => {
        const descriptor = repositories[index];
        if (result.status === 'fulfilled') {
          return result.value;
        }

        return {
          fullName: `${descriptor.owner}/${descriptor.name}`,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        };
      });

      res.json({ repositories: repositoriesPayload, fetchedAt: new Date().toISOString() });
    } catch (error) {
      console.error('[GITHUB-UPDATES] Failed to refresh repositories', error);
      cachedToken = null;
      res.status(500).json({
        error: 'Unable to refresh repository updates',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });
}

module.exports = { registerGithubRoutes };