import React, { useState, useEffect } from 'react';
import { colours } from '../../app/styles/colours';
import {
  UserData,
  TeamData,
  Enquiry,
  Matter,
  POID,
  Transaction,
  OutstandingClientBalancesResponse,
} from '../../app/functionality/types';
import * as microsoftTeams from '@microsoft/teams-js';
import { sharedDecisionButtonStyles, sharedDefaultButtonStyles } from '../../app/styles/ButtonStyles';
import ReportCard from './ReportCard';
import HomePreview from './HomePreview';
import ManagementDashboard from './ManagementDashboard';
import './ReportingHome.css';

const API_BASE_URL = process.env.REACT_APP_PROXY_BASE_URL;

const DATASETS = [
  { key: 'userData', name: 'User Data', type: 'UserData[]', duration: 1000 }, // 1 second
  { key: 'teamData', name: 'Team Data', type: 'TeamData[]', duration: 1000 }, // 1 second
  { key: 'enquiries', name: 'Enquiries', type: 'Enquiry[]', duration: 3000 }, // 3 seconds
  { key: 'allMatters', name: 'All Matters', type: 'Matter[]', duration: 2500 }, // 2.5 seconds
  { key: 'poidData', name: 'POID 6 Years', type: 'POID[]', duration: 1500 }, // 1.5 seconds
  { key: 'transactions', name: 'Transactions', type: 'Transaction[]', duration: 2000 }, // 2 seconds
  { key: 'outstandingBalances', name: 'Outstanding Balances', type: 'OutstandingClientBalancesResponse', duration: 3000 }, // 3 seconds
  { key: 'wip', name: 'WIP', type: 'any', duration: 2000 }, // 2 seconds
  { key: 'recoveredFees', name: 'Recovered Fees', type: 'CollectedTimeData[]', duration: 2000 }, // 2 seconds
] as const;

const TOTAL_FETCH_DURATION = 20000; // 20 seconds total
const DATASET_FETCH_DURATION = 15000; // 15 seconds for datasets
const WRAPPING_UP_DURATION = TOTAL_FETCH_DURATION - DATASET_FETCH_DURATION; // 5 seconds

let cachedData: { [key: string]: any } = {
  userData: null,
  teamData: null,
  enquiries: null,
  allMatters: null,
  poidData: null,
  transactions: null,
  outstandingBalances: null,
  wip: null,
  recoveredFees: null,
};
let hasFetchedInitially = false;

interface ReportingHomeProps {
  userData?: UserData[] | null;
  teamData?: TeamData[] | null;
}

const ReportingHome: React.FC<ReportingHomeProps> = ({ userData: propUserData, teamData }) => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>(DATASETS.map((d) => d.key));
  const [fetchedUserData, setFetchedUserData] = useState<UserData[] | null>(cachedData.userData);
  const [fetchedTeamData, setFetchedTeamData] = useState<TeamData[] | null>(cachedData.teamData);
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(cachedData.enquiries);
  const [allMatters, setAllMatters] = useState<Matter[] | null>(cachedData.allMatters);
  const [poidData, setPoidData] = useState<POID[] | null>(cachedData.poidData);
  const [transactions, setTransactions] = useState<Transaction[] | null>(cachedData.transactions);
  const [outstandingBalances, setOutstandingBalances] = useState<OutstandingClientBalancesResponse | null>(cachedData.outstandingBalances);
  const [wip, setWip] = useState<any>(cachedData.wip);
  const [recoveredFees, setRecoveredFees] = useState<any>(cachedData.recoveredFees);
  const [fetchStatus, setFetchStatus] = useState<{ [key: string]: 'idle' | 'fetching' | 'success' | 'error' }>(
    Object.fromEntries(DATASETS.map(d => [d.key, 'idle']))
  );
  const [fetchProgress, setFetchProgress] = useState<{ [key: string]: number }>(
    Object.fromEntries(DATASETS.map(d => [d.key, 0]))
  );
  const [isWrappingUp, setIsWrappingUp] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [entraId, setEntraId] = useState<string | null>(null);
  const [previewDataset, setPreviewDataset] = useState<string | null>(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [isDataSectionOpen, setIsDataSectionOpen] = useState(true);

  const decisionButtonRootStyles = sharedDecisionButtonStyles.root as React.CSSProperties;
  const defaultButtonRootStyles = sharedDefaultButtonStyles.root as React.CSSProperties;

  const datePickerStyles: Partial<any> = {
    root: { marginRight: 8, width: '100%' },
    textField: {
      width: '100%',
      height: '40px',
      borderRadius: '4px',
      backgroundColor: colours.secondaryButtonBackground,
      border: 'none',
      padding: '6px 12px',
      fontSize: '14px',
      color: '#000000',
      transition: 'background 0.3s ease, box-shadow 0.3s ease',
    },
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const initializeTeams = async () => {
      try {
        await microsoftTeams.app.initialize();
        const context = await microsoftTeams.app.getContext();
        const userObjectId = context.user?.id;
        if (userObjectId) {
          setEntraId(userObjectId);
          console.log('Teams context EntraID:', userObjectId);
        } else {
          setError('Unable to retrieve user ID from Teams context.');
        }
      } catch (err) {
        setError('Failed to initialize Teams context: ' + (err instanceof Error ? err.message : 'Unknown error'));
        console.error('Teams initialization error:', err);
      }
    };
    initializeTeams();
  }, []);

  useEffect(() => {
    if (entraId && !hasFetchedInitially) {
      const allCached = DATASETS.every((dataset) => cachedData[dataset.key] !== null);
      if (!allCached) {
        console.log('Initial fetch with EntraID:', entraId);
        fetchReportDatasets(DATASETS.map((d) => d.key));
      } else {
        console.log('Using cached data');
        hasFetchedInitially = true;
      }
    }
  }, [entraId]);

  useEffect(() => {
    setFetchedUserData(cachedData.userData);
    setFetchedTeamData(cachedData.teamData);
    setEnquiries(cachedData.enquiries);
    setAllMatters(cachedData.allMatters);
    setPoidData(cachedData.poidData);
    setTransactions(cachedData.transactions);
    setOutstandingBalances(cachedData.outstandingBalances);
    setWip(cachedData.wip);
    setRecoveredFees(cachedData.recoveredFees);
  }, []);

  const fetchReportDatasets = async (datasets: string[]) => {
    setShowSelectionModal(false);
    datasets.forEach(dataset => setFetchStatus(prev => ({ ...prev, [dataset]: 'fetching' })));
    datasets.forEach(dataset => setFetchProgress(prev => ({ ...prev, [dataset]: 0 })));
    setError(null);
    setIsWrappingUp(false);

    if (!entraId) {
      setError("Missing Entra ID. Cannot fetch data without user context.");
      datasets.forEach(dataset => setFetchStatus(prev => ({ ...prev, [dataset]: 'error' })));
      console.log('No entraId available for fetch');
      setTimeout(() => datasets.forEach(dataset => setFetchStatus(prev => ({ ...prev, [dataset]: 'idle' }))), 2000);
      return;
    }

    // Simulate fetch progress with arbitrary durations
    const simulateFetchProgress = async () => {
      const completionPromises: Promise<void>[] = [];
      const progressIntervals: NodeJS.Timeout[] = [];

      // Start a progress simulation for each dataset
      datasets.forEach(datasetKey => {
        const dataset = DATASETS.find(d => d.key === datasetKey);
        if (!dataset) return;

        const duration = dataset.duration;

        // Promise to mark dataset as completed after its duration
        const completionPromise = new Promise<void>(resolve => {
          setTimeout(() => {
            setFetchStatus(prev => ({ ...prev, [datasetKey]: 'success' }));
            setFetchProgress(prev => ({ ...prev, [datasetKey]: 100 }));
            resolve();
          }, duration);
        });
        completionPromises.push(completionPromise);

        // Simulate random progress updates
        const interval = setInterval(() => {
          setFetchProgress(prev => {
            const currentProgress = prev[datasetKey];
            if (currentProgress >= 100) {
              clearInterval(interval);
              return prev;
            }
            // Randomly increase progress by 1-15%, ensuring it doesn't exceed 100
            const increase = Math.random() * 15 + 1;
            const newProgress = Math.min(currentProgress + increase, 99); // Cap at 99 until completion
            return { ...prev, [datasetKey]: newProgress };
          });
        }, 200); // Update every 200ms
        progressIntervals.push(interval);
      });

      // Wait for all datasets to "complete"
      await Promise.all(completionPromises);

      // Clear all progress intervals
      progressIntervals.forEach(interval => clearInterval(interval));

      // After all datasets are "completed", show "Wrapping things up"
      setIsWrappingUp(true);

      // Ensure at least DATASET_FETCH_DURATION has passed before wrapping up
      const elapsed = Date.now() - startTime;
      const remainingDatasetTime = DATASET_FETCH_DURATION - elapsed;
      if (remainingDatasetTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingDatasetTime));
      }
    };

    const startTime = Date.now();
    const progressPromise = simulateFetchProgress();

    // Perform the actual fetch
    try {
      const response = await fetch(
        `${API_BASE_URL}/${process.env.REACT_APP_GENERATE_REPORT_DATASET_PATH}?code=${process.env.REACT_APP_GENERATE_REPORT_DATASET_CODE}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ datasets, entraId }),
        }
      );

      if (!response.ok) throw new Error(`Failed to fetch datasets: ${response.status}`);

      const data = await response.json();

      if (datasets.includes('userData') && data.userData) {
        cachedData.userData = data.userData;
        setFetchedUserData(cachedData.userData);
      }
      if (datasets.includes('teamData') && data.teamData) {
        cachedData.teamData = data.teamData;
        setFetchedTeamData(cachedData.teamData);
      }
      if (datasets.includes('enquiries') && data.enquiries) {
        cachedData.enquiries = data.enquiries;
        setEnquiries(cachedData.enquiries);
      }
      if (datasets.includes('allMatters') && data.allMatters) {
        cachedData.allMatters = data.allMatters;
        setAllMatters(cachedData.allMatters);
      }
      if (datasets.includes('poidData') && data.poidData) {
        cachedData.poidData = data.poidData;
        setPoidData(cachedData.poidData);
      }
      if (datasets.includes('transactions') && data.transactions) {
        cachedData.transactions = data.transactions;
        setTransactions(cachedData.transactions);
      }
      if (datasets.includes('outstandingBalances') && data.outstandingBalances) {
        cachedData.outstandingBalances = data.outstandingBalances;
        setOutstandingBalances(cachedData.outstandingBalances);
      }
      if (datasets.includes('wip') && data.wip) {
        cachedData.wip = data.wip;
        setWip(cachedData.wip);
      }
      if (datasets.includes('recoveredFees') && data.recoveredFees) {
        cachedData.recoveredFees = data.recoveredFees;
        setRecoveredFees(cachedData.recoveredFees);
      }

      DATASETS.forEach(d => {
        if (datasets.includes(d.key) && !data[d.key]) {
          setFetchStatus(prev => ({ ...prev, [d.key]: 'idle' }));
        }
      });

      if (!hasFetchedInitially) hasFetchedInitially = true;

      // Wait for the simulated progress to complete "Wrapping things up"
      await progressPromise;

      // If fetch completes early, wait until TOTAL_FETCH_DURATION
      const fetchDuration = Date.now() - startTime;
      if (fetchDuration < TOTAL_FETCH_DURATION) {
        const remainingTime = TOTAL_FETCH_DURATION - fetchDuration;
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      // If fetch takes longer, "Wrapping things up" persists until completion (handled by awaiting the fetch)
      setIsWrappingUp(false);
      datasets.forEach(dataset => setFetchStatus(prev => ({ ...prev, [dataset]: 'idle' })));
      datasets.forEach(dataset => setFetchProgress(prev => ({ ...prev, [dataset]: 0 })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      datasets.forEach(dataset => setFetchStatus(prev => ({ ...prev, [dataset]: 'error' })));
      console.log('Fetch error:', err);
      await progressPromise; // Ensure progress simulation completes
      setIsWrappingUp(false);
      setTimeout(() => datasets.forEach(dataset => setFetchStatus(prev => ({ ...prev, [dataset]: 'idle' }))), 2000);
      datasets.forEach(dataset => setFetchProgress(prev => ({ ...prev, [dataset]: 0 })));
    }
  };

  const toggleSelectAll = () => {
    if (selectedDatasets.length === DATASETS.length) {
      setSelectedDatasets([]);
    } else {
      setSelectedDatasets(DATASETS.map((d) => d.key));
    }
  };

  const handleDatasetToggle = (key: string) => {
    setSelectedDatasets((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const togglePreview = (name: string) => {
    setPreviewDataset(previewDataset === name ? null : name);
  };

  const handleGoTo = (title: string) => {
    if (title === 'Management Dashboard') {
      setSelectedReport(title);
    } else {
      console.log('Report clicked:', title);
    }
  };

  const getPreviewContent = (name: string) => {
    const dataMap: { [key: string]: any } = {
      'User Data': fetchedUserData,
      'Team Data': fetchedTeamData,
      'Enquiries': enquiries,
      'All Matters': allMatters,
      'POID 6 Years': poidData,
      'Transactions': transactions,
      'Outstanding Balances': outstandingBalances?.data,
      'WIP': wip,
      'Recovered Fees': recoveredFees,
    };
    const data = dataMap[name];
    if (!data) return 'No data available';

    if (Array.isArray(data)) {
      const previewItems = data.slice(0, 10);
      return (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {previewItems.map((item, index) => (
            <li key={index} style={{ marginBottom: '12px', fontSize: '14px', color: '#333' }}>
              <pre style={{ margin: 0 }}>{JSON.stringify(item, null, 2)}</pre>
            </li>
          ))}
          {data.length > 10 && <li style={{ fontStyle: 'italic' }}>...and {data.length - 10} more</li>}
        </ul>
      );
    }
    return <pre style={{ fontSize: '14px', color: '#333', margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>;
  };

  const isDatasetReady = (key: string) => !!cachedData[key];

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const formattedDate = currentTime.toLocaleDateString('en-GB', dateOptions);
  const formattedTime = currentTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const reportSections = [
    { title: 'Management Dashboard', description: 'Key metrics and team performance', path: '/management-dashboard', icon: 'BarChartHorizontal' },
    { title: 'Enquiries', description: 'Enquiry trends and details', path: '/enquiries', icon: 'Chat' },
    { title: 'Matters', description: 'Matter status and analysis', path: '/matters', icon: 'DocumentSet' },
    { title: 'Tasks', description: 'Task completion and workload', path: '/tasks', icon: 'TaskLogo' },
  ];

  const availableData = [
    { name: 'User Data', available: !!fetchedUserData, details: fetchedUserData ? `${fetchedUserData.length} record(s)` : 'Not fetched' },
    { name: 'Team Data', available: !!fetchedTeamData, details: fetchedTeamData ? `${fetchedTeamData.length} record(s)` : 'Not fetched' },
    { name: 'Enquiries', available: !!enquiries, details: enquiries ? `${enquiries.length} record(s)` : 'Not fetched' },
    { name: 'All Matters', available: !!allMatters, details: allMatters ? `${allMatters.length} record(s)` : 'Not fetched' },
    { name: 'POID 6 Years', available: !!poidData, details: poidData ? `${poidData.length} record(s)` : 'Not fetched' },
    { name: 'Transactions', available: !!transactions, details: transactions ? `${transactions.length} record(s)` : 'Not fetched' },
    {
      name: 'Outstanding Balances',
      available: !!outstandingBalances,
      details: outstandingBalances?.data ? `${outstandingBalances.data.length} record(s)` : 'Not fetched',
    },
    { name: 'WIP', available: !!wip, details: wip ? `${Array.isArray(wip) ? wip.length + ' record(s)' : 'Available'}` : 'Not fetched' },
    { name: 'Recovered Fees', available: !!recoveredFees, details: recoveredFees ? `${recoveredFees.length} record(s)` : 'Not fetched' },
  ];

  if (selectedReport === 'Management Dashboard') {
    return (
      <div style={{ width: '100%', backgroundColor: colours.light.background, minHeight: '100vh' }}>
        <div className="back-arrow" onClick={() => setSelectedReport(null)}>
          <span>← Back</span>
        </div>
        <ManagementDashboard
          enquiries={enquiries}
          allMatters={allMatters}
          wip={wip}
          recoveredFees={recoveredFees}
          teamData={fetchedTeamData}
          userData={fetchedUserData}
          poidData={poidData}
        />
      </div>
    );
  }

  return (
    <div className="reporting-home-container" style={{ backgroundColor: colours.light.background }}>
      <div className="disclaimer animate-disclaimer">
        <p>Note: This module is visible only to Luke, Jonathan, and Alex.</p>
      </div>

      {previewDataset && (
        <div className="data-preview-popup" style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
          zIndex: 1001, maxWidth: '600px', width: '90%', maxHeight: '70vh', overflowY: 'auto'
        }}>
          <h3 style={{ margin: '0 0 15px', fontSize: '18px', color: '#333' }}>{previewDataset} Preview</h3>
          {getPreviewContent(previewDataset)}
          <button
            className="decision-button"
            onClick={() => setPreviewDataset(null)}
            style={decisionButtonRootStyles}
          >
            Close
          </button>
        </div>
      )}

      {showSelectionModal && (
        <div className="selection-modal" style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
          zIndex: 1000, maxWidth: '500px', width: '90%'
        }}>
          <h3 style={{ margin: '0 0 15px', fontSize: '18px', color: '#333' }}>Select Datasets to Refresh</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555' }}>
              <input
                type="checkbox"
                checked={selectedDatasets.length === DATASETS.length}
                onChange={toggleSelectAll}
                style={{ marginRight: '5px' }}
              />
              Select All
            </label>
            {DATASETS.map((dataset) => (
              <label key={dataset.key} style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555' }}>
                <input
                  type="checkbox"
                  checked={selectedDatasets.includes(dataset.key)}
                  onChange={() => handleDatasetToggle(dataset.key)}
                  style={{ marginRight: '5px' }}
                />
                {dataset.name}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              className="decision-button"
              onClick={() => fetchReportDatasets(selectedDatasets)}
              disabled={selectedDatasets.length === 0 || Object.values(fetchStatus).some(status => status === 'fetching')}
              style={decisionButtonRootStyles}
            >
              Refresh
            </button>
            <button
              className="default-button"
              onClick={() => setShowSelectionModal(false)}
              style={defaultButtonRootStyles}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {(Object.values(fetchStatus).some(status => status === 'fetching' || status === 'success' || status === 'error') || isWrappingUp) && (
        <div className="fetch-status-overlay" style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '12px', boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
          zIndex: 999, maxWidth: '600px', width: '90%'
        }}>
          <h3 style={{ margin: '0 0 15px', fontSize: '18px', color: '#333' }}>Fetching Data</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {DATASETS.map((dataset) => (
              <div
                key={dataset.key}
                className="fetch-status-item"
                style={{
                  flex: '1 1 180px',
                  padding: '10px',
                  background: fetchStatus[dataset.key] === 'success' ? '#e6ffe6' : fetchStatus[dataset.key] === 'error' ? '#ffe6e6' : '#f9f9f9',
                  borderRadius: '6px',
                  textAlign: 'center',
                  display: fetchStatus[dataset.key] === 'idle' ? 'none' : 'block',
                }}
              >
                <span
                  className={`status-indicator ${fetchStatus[dataset.key]}`}
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    marginRight: '8px',
                    background: fetchStatus[dataset.key] === 'success' ? '#28a745' : fetchStatus[dataset.key] === 'fetching' ? '#ccc' : '#dc3545',
                    animation: fetchStatus[dataset.key] === 'fetching' ? 'pulse 1s infinite' : 'none',
                  }}
                />
                <span style={{ fontSize: '14px', color: '#333' }}>
                  {fetchStatus[dataset.key] === 'fetching'
                    ? `Fetching ${dataset.name} (${Math.round(fetchProgress[dataset.key])}%)`
                    : fetchStatus[dataset.key] === 'success'
                      ? `${dataset.name} Updated`
                      : `${dataset.name} Failed`}
                </span>
              </div>
            ))}
            {isWrappingUp && (
              <div
                className="fetch-status-item"
                style={{
                  flex: '1 1 180px',
                  padding: '10px',
                  background: '#f9f9f9',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}
              >
                <span
                  className="status-indicator fetching"
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    marginRight: '8px',
                    background: '#ccc',
                    animation: 'pulse 1s infinite',
                  }}
                />
                <span style={{ fontSize: '14px', color: '#333' }}>Wrapping things up</span>
              </div>
            )}
          </div>
          {error && <p style={{ color: '#dc3545', fontSize: '14px', marginTop: '10px' }}>{error}</p>}
        </div>
      )}

      <main className="page-content animate-page">
        <header className="reporting-header" style={{ marginBottom: '20px' }}>
          <h1 className="reporting-title">Reporting Home</h1>
          <div className="datetime-container">
            <p className="date-text">{formattedDate}</p>
            <p className="time-text">{formattedTime}</p>
          </div>
        </header>

        <HomePreview
          enquiries={enquiries}
          allMatters={allMatters}
          wip={wip}
          recoveredFees={recoveredFees}
        />

        <section className="report-section" style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', color: '#333', margin: '0 0 20px' }}>Reports</h2>
          <div className="report-cards-container" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
            width: '100%',
          }}>
            {reportSections.map((report, index) => (
              <ReportCard
                key={report.title}
                report={report}
                onGoTo={handleGoTo}
                animationDelay={index * 0.15}
              />
            ))}
          </div>
        </section>

        <section className="data-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', color: '#333', margin: 0 }}>Available Data</h2>
            <button
              className="decision-button"
              onClick={() => setIsDataSectionOpen(!isDataSectionOpen)}
              style={decisionButtonRootStyles}
            >
              {isDataSectionOpen ? 'Collapse' : 'Expand'}
            </button>
          </div>
          <div className="data-access-grid" style={{
            display: isDataSectionOpen ? 'flex' : 'none',
            flexWrap: 'wrap',
            gap: '20px',
            transition: 'height 0.3s ease',
          }}>
            {availableData.map((data, index) => (
              <div
                key={data.name}
                className="data-access-card animate-data-card"
                style={{ animationDelay: `${index * 0.1}s`, flex: '1 1 300px', maxWidth: '300px', padding: '15px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center' }}
              >
                <span
                  className={`status-indicator ${data.available ? 'available' : 'unavailable'}`}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: data.available ? '#28a745' : '#dc3545',
                    marginRight: '10px',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 5px', fontSize: '16px' }}>{data.name}</h4>
                  <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#666' }}>{data.details}</p>
                  {isDatasetReady(DATASETS.find(d => d.name === data.name)!.key) && (
                    <button
                      onClick={() => togglePreview(data.name)}
                      style={{ background: 'none', border: 'none', color: colours.blue, cursor: 'pointer', fontSize: '12px', padding: 0 }}
                    >
                      Preview
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              className="decision-button"
              onClick={() => setShowSelectionModal(true)}
              style={decisionButtonRootStyles}
            >
              Refresh Data
            </button>
          </div>
        </section>
      </main>

      <footer className="reporting-footer animate-footer" style={{ marginTop: '40px' }}>
        <p>Helix Hub Reporting Module | Version 1.0</p>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes statusFade {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(1.05); }
        }
        .decision-button {
          padding: 6px 12px;
          border-radius: 4px;
          background-color: ${colours.highlight};
          border: none;
          height: 40px;
          font-size: 14px;
          font-weight: normal;
          color: #ffffff;
          transition: background 0.3s ease, box-shadow 0.3s ease;
          outline: none;
          cursor: pointer;
        }
        .decision-button:hover {
          background: radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 100%), ${colours.highlight} !important;
          box-shadow: 0 0 8px rgba(0,0,0,0.2) !important;
        }
        .decision-button:active {
          background: radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%), ${colours.highlight} !important;
          box-shadow: 0 0 8px rgba(0,0,0,0.3) !important;
        }
        .decision-button:focus {
          background-color: ${colours.highlight} !important;
          outline: none !important;
          border: none !important;
        }
        .decision-button:disabled {
          background-color: #ccc !important;
          cursor: not-allowed;
        }
        .default-button {
          padding: 6px 12px;
          border-radius: 4px;
          background-color: ${colours.secondaryButtonBackground};
          border: none;
          height: 40px;
          font-size: 14px;
          font-weight: normal;
          color: #000000;
          transition: background 0.3s ease, box-shadow 0.3s ease;
          outline: none;
          cursor: pointer;
        }
        .default-button:hover {
          background: radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 100%), ${colours.secondaryButtonBackground} !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15) !important;
        }
        .default-button:active {
          background: radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 100%), ${colours.secondaryButtonBackground} !important;
          box-shadow: 0 0 8px rgba(0,0,0,0.2) !important;
        }
        .default-button:focus {
          background-color: ${colours.secondaryButtonBackground} !important;
          outline: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};

export default ReportingHome;