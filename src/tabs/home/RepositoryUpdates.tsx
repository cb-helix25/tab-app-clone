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
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import repositories from '../../shared/repositories.json';

type RepoDescriptor = {
  owner: string;
  name: string;
};

type RepoTrackingState = {
  status: 'tracked' | 'untracked';
  lastPushedAt?: string;
  branches?: Record<string, string | undefined>;
  recentlyUpdatedBranches?: string[];
};

type RepoRow = {
  key: string;
  fullName: string;
  lastUpdatedLabel: string;
  pushedAt?: string;
  status: 'tracked' | 'untracked';
  updatedBranches: string[];
};

type RepoApiResult = {
  fullName: string;
  pushedAt?: string;
  htmlUrl?: string;
  branches?: {
    name: string;
    commitSha?: string;
    commitDate?: string;
    htmlUrl?: string;
  }[];
  error?: string;
};

const STORAGE_KEY = 'repository-updates:states';

const createDefaultState = (): Record<string, RepoTrackingState> =>
  (repositories as RepoDescriptor[]).reduce<Record<string, RepoTrackingState>>((acc, repo) => {
    acc[`${repo.owner}/${repo.name}`] = {
      status: 'tracked',
      lastPushedAt: undefined,
      branches: {},
      recentlyUpdatedBranches: [],
    };
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
  const navigate = useNavigate();
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
        recentlyUpdatedBranches: [],
      },
    }));
  }, []);

  const refreshStatuses = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/github/repositories/updates');
      if (!response.ok) {
        throw new Error(`Unable to refresh repositories (status ${response.status}).`);
      }
      const json = await response.json();
      const repoResults: RepoApiResult[] = json?.repositories ?? [];
      setLastCheckedAt(json?.fetchedAt ?? new Date().toISOString());

      const successes = repoResults.filter((result) => !result.error);
      const failures = repoResults.filter((result) => !!result.error);

      if (successes.length > 0) {
        setRepoStates((current) => {
          const nextState = { ...current };

          successes.forEach((result) => {
            const previous = current[result.fullName]
              ? {
                  status: 'tracked',
                  lastPushedAt: undefined,
                  branches: {},
                  recentlyUpdatedBranches: [],
                  ...current[result.fullName],
                }
              : {
                status: 'tracked',
                lastPushedAt: undefined,
                branches: {},
                recentlyUpdatedBranches: [],
              };
            const previousTimestamp = previous.lastPushedAt ? new Date(previous.lastPushedAt).getTime() : null;
            const currentTimestamp = result.pushedAt ? new Date(result.pushedAt).getTime() : null;
            const hasNewPush =
              previousTimestamp !== null && currentTimestamp !== null && currentTimestamp > previousTimestamp;

            const branchMap: Record<string, string | undefined> = {};
            const updatedBranches: string[] = [];
            (result.branches ?? []).forEach((branch) => {
              branchMap[branch.name] = branch.commitDate;
              const previousBranchTimestamp = previous.branches?.[branch.name]
                ? new Date(previous.branches[branch.name] as string).getTime()
                : null;
              const currentBranchTimestamp = branch.commitDate ? new Date(branch.commitDate).getTime() : null;
              if (
                previousBranchTimestamp !== null &&
                currentBranchTimestamp !== null &&
                currentBranchTimestamp > previousBranchTimestamp
              ) {
                updatedBranches.push(branch.name);
              }
            });

            const hasBranchUpdates = updatedBranches.length > 0;

            nextState[result.fullName] = {
              status: hasNewPush || hasBranchUpdates ? 'untracked' : previous.status,
              lastPushedAt: result.pushedAt ?? previous.lastPushedAt,
              branches: branchMap,
              recentlyUpdatedBranches: updatedBranches,
            };
          });

          return nextState;
        });
      }

      if (failures.length > 0) {
        const message = failures
          .map((failure) => failure.error || 'Unknown error')
          .join(' ');
        setErrorMessage(message || 'Unable to refresh one or more repositories.');
      }

    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to refresh repository updates.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const trackedRows = useMemo<RepoRow[]>(() => {
    const rows: RepoRow[] = [];

    (repositories as RepoDescriptor[]).forEach((repo) => {
      const fullName = `${repo.owner}/${repo.name}`;
      const state = repoStates[fullName] ?? { status: 'tracked', lastPushedAt: undefined, branches: {}, recentlyUpdatedBranches: [] };
      if (state.status === 'tracked') {
        rows.push({
          key: fullName,
          fullName,
          lastUpdatedLabel: safeFormatDate(state.lastPushedAt),
          pushedAt: state.lastPushedAt,
          status: state.status,
          updatedBranches: state.recentlyUpdatedBranches ?? [],
        });
      }
    });

    return rows.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [repoStates]);

  const untrackedRows = useMemo<RepoRow[]>(() => {
    const rows: RepoRow[] = [];

    (repositories as RepoDescriptor[]).forEach((repo) => {
      const fullName = `${repo.owner}/${repo.name}`;
      const state = repoStates[fullName] ?? { status: 'tracked', lastPushedAt: undefined, branches: {}, recentlyUpdatedBranches: [] };
      if (state.status === 'untracked') {
        rows.push({
          key: fullName,
          fullName,
          lastUpdatedLabel: safeFormatDate(state.lastPushedAt),
          pushedAt: state.lastPushedAt,
          status: state.status,
          updatedBranches: state.recentlyUpdatedBranches ?? [],
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
      {
        key: 'branches',
        name: 'Updated branches',
        minWidth: 240,
        onRender: (item: RepoRow) =>
          item.updatedBranches.length > 0 ? (
            <Stack tokens={{ childrenGap: 4 }}>
              {item.updatedBranches.map((branch) => (
                <Text key={branch} variant="small">
                  {branch}
                </Text>
              ))}
            </Stack>
          ) : (
            <Text
              variant="small"
              styles={{ root: { color: isDarkMode ? colours.dark.subText : colours.light.subText } }}
            >
              No changes since last check
            </Text>
          ),
      },
    ],
    [isDarkMode],
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
          Checks run only when you select Refresh now. A GitHub token is securely retrieved from Azure Key Vault
          (<code>environment-token</code>) with an environment variable fallback to reduce rate limits for private
          repositories.
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
        <DefaultButton text="Back" onClick={() => navigate(-1)} />
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