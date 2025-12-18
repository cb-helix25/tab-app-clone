import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DefaultButton,
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  Link,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  SelectionMode,
  Spinner,
  SpinnerSize,
  Stack,
  Text,
} from '@fluentui/react';
import { format } from 'date-fns';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';

type RepoDescriptor = {
  owner: string;
  name: string;
};

type RepoTrackingState = {
  status: 'tracked' | 'untracked';
  lastPushedAt?: string;
};

type RepoRow = {
  key: string;
  fullName: string;
  lastUpdatedLabel: string;
  pushedAt?: string;
  status: 'tracked' | 'untracked';
};

type RepoApiResult = {
  fullName: string;
  pushedAt?: string;
  htmlUrl?: string;
};

const repositories: RepoDescriptor[] = [
  { owner: 'HelixAutomations', name: 'tab-app' },
  { owner: 'HelixAutomations', name: 'tasking-v3' },
  { owner: 'HelixAutomations', name: 'instruct-pitch' },
  { owner: 'HelixAutomations', name: 'enquiry-processing-v2' },
  { owner: 'HelixAutomations', name: 'recruitment' },
  { owner: 'HelixAutomations', name: 'content-reviews' },
  { owner: 'HelixAutomations', name: 'transaction-intake' },
  { owner: 'HelixAutomations', name: 'matter-opening-v3' },
  { owner: 'HelixAutomations', name: 'aged-debts-v2' },
  { owner: 'HelixAutomations', name: 'bcc-v3' },
  { owner: 'HelixAutomations', name: 'proof-of-id' },
  { owner: 'HelixAutomations', name: 'compliance' },
];

const STORAGE_KEY = 'repository-updates:states';

const createDefaultState = (): Record<string, RepoTrackingState> =>
  repositories.reduce<Record<string, RepoTrackingState>>((acc, repo) => {
    acc[`${repo.owner}/${repo.name}`] = { status: 'tracked', lastPushedAt: undefined };
    return acc;
  }, {});

const safeFormatDate = (timestamp?: string) => {
  if (!timestamp) {
    return 'Waiting for first check';
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unrecognised date';
  }

  return format(parsed, 'PPpp');
};

const RepositoryUpdates: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [repoStates, setRepoStates] = useState<Record<string, RepoTrackingState>>(() => {
    if (typeof window === 'undefined') {
      return createDefaultState();
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...createDefaultState(), ...JSON.parse(stored) };
      } catch {
        return createDefaultState();
      }
    }

    return createDefaultState();
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  const activeToken = process.env.REACT_APP_GITHUB_TOKEN || '';

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(repoStates));
  }, [repoStates]);

  const handleMarkTracked = useCallback((fullName: string) => {
    setRepoStates((current) => ({
      ...current,
      [fullName]: {
        ...current[fullName],
        status: 'tracked',
      },
    }));
  }, []);

  const fetchRepositoryUpdate = useCallback(
    async (repo: RepoDescriptor): Promise<RepoApiResult> => {
      const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}`, {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(
          `Unable to load ${repo.owner}/${repo.name} (status ${response.status}). The repository may be private or unavailable.`,
        );
      }

      const json = await response.json();
      return {
        fullName: json.full_name ?? `${repo.owner}/${repo.name}`,
        pushedAt: json.pushed_at,
        htmlUrl: json.html_url,
      };
    },
    [activeToken],
  );

  const refreshStatuses = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const results = await Promise.allSettled(repositories.map((repo) => fetchRepositoryUpdate(repo)));
      const successes = results.filter((result): result is PromiseFulfilledResult<RepoApiResult> => result.status === 'fulfilled');
      const failures = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );

      if (successes.length > 0) {
        setRepoStates((current) => {
          const nextState = { ...current };

          successes.forEach(({ value: result }) => {
            const previous = current[result.fullName] ?? { status: 'tracked', lastPushedAt: undefined };
            const previousTimestamp = previous.lastPushedAt ? new Date(previous.lastPushedAt).getTime() : null;
            const currentTimestamp = result.pushedAt ? new Date(result.pushedAt).getTime() : null;
            const hasNewPush =
              previousTimestamp !== null && currentTimestamp !== null && currentTimestamp > previousTimestamp;

            nextState[result.fullName] = {
              status: hasNewPush ? 'untracked' : previous.status,
              lastPushedAt: result.pushedAt ?? previous.lastPushedAt,
            };
          });

          return nextState;
        });
      }

      if (failures.length > 0) {
        const message = failures
          .map((failure) => (failure.reason instanceof Error ? failure.reason.message : 'Unknown error'))
          .join(' ');
        setErrorMessage(message || 'Unable to refresh one or more repositories.');
      }

      setLastCheckedAt(new Date().toISOString());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to refresh repository updates.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchRepositoryUpdate]);

  const trackedRows = useMemo<RepoRow[]>(() => {
    const rows: RepoRow[] = [];

    repositories.forEach((repo) => {
      const fullName = `${repo.owner}/${repo.name}`;
      const state = repoStates[fullName] ?? { status: 'tracked', lastPushedAt: undefined };
      if (state.status === 'tracked') {
        rows.push({
          key: fullName,
          fullName,
          lastUpdatedLabel: safeFormatDate(state.lastPushedAt),
          pushedAt: state.lastPushedAt,
          status: state.status,
        });
      }
    });

    return rows.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [repoStates]);

  const untrackedRows = useMemo<RepoRow[]>(() => {
    const rows: RepoRow[] = [];

    repositories.forEach((repo) => {
      const fullName = `${repo.owner}/${repo.name}`;
      const state = repoStates[fullName] ?? { status: 'tracked', lastPushedAt: undefined };
      if (state.status === 'untracked') {
        rows.push({
          key: fullName,
          fullName,
          lastUpdatedLabel: safeFormatDate(state.lastPushedAt),
          pushedAt: state.lastPushedAt,
          status: state.status,
        });
      }
    });

    return rows.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [repoStates]);

  const baseColumns: IColumn[] = useMemo(
    () => [
      {
        key: 'repository',
        name: 'Repository',
        minWidth: 240,
        onRender: (item: RepoRow) => (
          <Link href={`https://github.com/${item.fullName}`} target="_blank" rel="noreferrer">
            {item.fullName}
          </Link>
        ),
      },
      {
        key: 'lastUpdate',
        name: 'Last update (pushed_at)',
        minWidth: 200,
        onRender: (item: RepoRow) => <span>{item.lastUpdatedLabel}</span>,
      },
    ],
    [],
  );

  const untrackedColumns: IColumn[] = useMemo(
    () => [
      ...baseColumns,
      {
        key: 'actions',
        name: 'Actions',
        minWidth: 140,
        onRender: (item: RepoRow) => (
          <DefaultButton onClick={() => handleMarkTracked(item.fullName)} text="Mark as tracked" />
        ),
      },
    ],
    [baseColumns, handleMarkTracked],
  );

  const lastCheckedLabel = lastCheckedAt ? safeFormatDate(lastCheckedAt) : 'Not checked yet';

  return (
    <Stack tokens={{ childrenGap: 20 }}>
      <Stack tokens={{ childrenGap: 8 }}>
        <Text>
          Track GitHub pushes via the <code>pushed_at</code> field. Repositories start in the tracked table and move to
          untracked when a new push is detected.
        </Text>
        <Text variant="small">
          Checks run only when you select Refresh now. If configured, an environment token with <code>repo</code> read
          access is used to reduce rate limits for private repositories.
        </Text>
      </Stack>

      <Stack
        horizontal
        wrap
        tokens={{ childrenGap: 12 }}
        verticalAlign="end"
        styles={{
          root: {
            rowGap: 8,
          },
        }}
      >
        <PrimaryButton text="Refresh now" onClick={refreshStatuses} disabled={isLoading} />
        {isLoading && <Spinner size={SpinnerSize.small} label="Checking repositories..." />}
        <Text styles={{ root: { color: isDarkMode ? colours.dark.subText : colours.light.subText } }}>
          Last checked: {lastCheckedLabel}
        </Text>
      </Stack>

      {errorMessage && (
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline
          styles={{ root: { maxWidth: 720 } }}
          onDismiss={() => setErrorMessage(null)}
        >
          {errorMessage}
        </MessageBar>
      )}

      <Stack tokens={{ childrenGap: 12 }}>
        <Text variant="mediumPlus">Tracked</Text>
        <DetailsList
          items={trackedRows}
          columns={baseColumns}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
          styles={{
            root: {
              background: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
              borderRadius: 6,
              padding: 8,
            },
          }}
        />
        {trackedRows.length === 0 && <Text>No repositories are currently tracked.</Text>}
      </Stack>

      <Stack tokens={{ childrenGap: 12 }}>
        <Text variant="mediumPlus">Untracked (needs review)</Text>
        <DetailsList
          items={untrackedRows}
          columns={untrackedColumns}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
          styles={{
            root: {
              background: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
              borderRadius: 6,
              padding: 8,
            },
          }}
        />
        {untrackedRows.length === 0 && <Text>No repositories need review.</Text>}
      </Stack>
    </Stack>
  );
};

export default RepositoryUpdates;