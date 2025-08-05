import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./app/styles/index.css";
import App from "./app/App";
import { createTheme, ThemeProvider } from "@fluentui/react";
import { colours } from "./app/styles/colours";
import * as microsoftTeams from "@microsoft/teams-js";
import { isInTeams } from "./app/functionality/isInTeams";
import { Matter, UserData, Enquiry, TeamData } from "./app/functionality/types";
// Local sample data used when REACT_APP_USE_LOCAL_DATA is set
import localUserData from "./localData/localUserData.json";
import localEnquiries from "./localData/localEnquiries.json";
import localMatters from "./localData/localMatters.json";
import localTeamData from "./localData/team-sql-data.json";
import { getLiveLocalEnquiries } from "./tabs/home/Home";

import "./utils/callLogger";
import Data from "./tabs/Data";
import { getProxyBaseUrl } from "./utils/getProxyBaseUrl";

import { initializeIcons } from "@fluentui/react";
initializeIcons();

// Define the custom Fluent UI theme
// invisible change 2
const customTheme = createTheme({
  palette: {
    themePrimary: colours.blue,
    themeDark: colours.darkBlue,
    themeLighter: colours.highlight,
    accent: colours.accent,
    neutralLight: colours.grey,
    redDark: colours.cta,
    neutralPrimary: colours.websiteBlue,
  },
  fonts: {
    small: { fontFamily: "Raleway, sans-serif" },
    medium: { fontFamily: "Raleway, sans-serif" },
    large: { fontFamily: "Raleway, sans-serif" },
    xLarge: { fontFamily: "Raleway, sans-serif" },
  },
});

const proxyBaseUrl = getProxyBaseUrl();

// Flag to decide whether to use local sample data instead of remote API
const inTeams = isInTeams();
const useLocalData =
  process.env.REACT_APP_USE_LOCAL_DATA === "true" || !inTeams;

// Surface any unhandled promise rejections so they don't fail silently
if (typeof window !== "undefined") {
  if (!(window as any).__unhandledRejectionHandlerAdded) {
    (window as any).__unhandledRejectionHandlerAdded = true;
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      event.preventDefault();
      alert("An unexpected error occurred. Check the console for details.");
    });
  }
}

// Simple localStorage caching with a 15 minute TTL
const CACHE_TTL = 15 * 60 * 1000;

function getCachedData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data as T;
    }
  } catch {
    /* ignore parsing errors */
  }
  return null;
}

function setCachedData(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    /* ignore write errors */
  }
}

// Helper function to calculate the date range (6 months)
const getDateRange = () => {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1); // Increase range
  const startDate = new Date(
    twelveMonthsAgo.getFullYear(),
    twelveMonthsAgo.getMonth(),
    1,
  );
  const endDate = now;
  const formattedStartDate = startDate.toISOString().split("T")[0];
  const formattedEndDate = endDate.toISOString().split("T")[0];
  return {
    dateFrom: formattedStartDate,
    dateTo: formattedEndDate,
  };
};

// Fetch functions
async function fetchUserData(objectId: string): Promise<UserData[]> {
  const cacheKey = `userData-${objectId}`;
  const cached = getCachedData<UserData[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `${proxyBaseUrl}/${process.env.REACT_APP_GET_USER_DATA_PATH}?code=${process.env.REACT_APP_GET_USER_DATA_CODE}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userObjectId: objectId }),
    },
  );
  if (!response.ok)
    throw new Error(`Failed to fetch user data: ${response.status}`);
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
}

async function fetchEnquiries(
  email: string,
  dateFrom: string,
  dateTo: string,
  userAow: string = '',
  userInitials: string = '',
): Promise<Enquiry[]> {
  console.log('🚀 FETCH ENQUIRIES CALLED:', { email, dateFrom, dateTo, userAow, userInitials });
  
  const cacheKey = `enquiries-${email}-${dateFrom}-${dateTo}-${userAow}`;
  const cached = getCachedData<Enquiry[]>(cacheKey);
  if (cached) return cached;

  // FOR TESTING: Only fetch from the NEW decoupled function to simulate production behavior
  let enquiries: Enquiry[] = [];
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isLZUser = userInitials.toUpperCase() === 'LZ';
  
  if (isLocalDev || isLZUser) {
    try {
      console.log('🔵 Attempting to fetch NEW enquiries data...');
      console.log('📍 Local dev:', isLocalDev, '| LZ user:', isLZUser);
      
      // Call the decoupled function via Express route (local) or directly (production)
      // NEW decoupled function expects simple GET with no params to return ALL data
      const newDataUrl = isLocalDev 
        ? `http://localhost:8080/api/enquiries` // Direct call to Express server for local dev
        : `https://instructions-vnet-functions.azurewebsites.net/api/fetchEnquiriesData`; // Direct call for production - simple GET, no params
      
      console.log('🌐 Calling NEW enquiries URL:', newDataUrl);
      
      const newResponse = await fetch(newDataUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (newResponse.ok) {
        console.log('✅ NEW enquiries response OK, processing data...');
        const newData = await newResponse.json();
        console.log('📦 Raw NEW data count:', Array.isArray(newData) ? newData.length : newData.enquiries?.length || 0);
        
        let rawNewEnquiries: any[] = [];
        if (Array.isArray(newData)) {
          rawNewEnquiries = newData;
        } else if (Array.isArray(newData.enquiries)) {
          rawNewEnquiries = newData.enquiries;
        }
        
        // Filter new enquiries to match user's criteria
        // New space uses Initials matching, old space uses email matching
        const userEmail = email.toLowerCase();
        const userInitialsUpper = userInitials.toUpperCase();
        
        const filteredNewEnquiries = rawNewEnquiries.filter(enq => {
          const pocInitials = (enq.Point_of_Contact || enq.poc || '').toUpperCase();
          const pocEmail = (enq.Point_of_Contact || enq.poc || '').toLowerCase();

          const matchesInitials = pocInitials === userInitialsUpper;
          const matchesEmail = pocEmail === userEmail;
          const unclaimedEmails = [
            'team@helix-law.com',
            'commercial@helix-law.com',
            'construction@helix-law.com',
            'employment@helix-law.com',
            'property@helix-law.com',
          ];
          const isUnclaimed = unclaimedEmails.includes(pocEmail) || pocInitials === 'TEAM';

          return matchesInitials || matchesEmail || isUnclaimed;
        });
        
        // Convert to Enquiry format if needed
        const newEnquiries = filteredNewEnquiries.map(enq => ({
          ID: enq.ID || enq.id || String(Math.random()),
          Date_Created: enq.Date_Created || enq.date_created || enq.datetime,
          Touchpoint_Date: enq.Touchpoint_Date || enq.touchpoint_date || enq.datetime,
          Email: enq.Email || enq.email,
          Area_of_Work: enq.Area_of_Work || enq.area_of_work || enq.aow,
          Type_of_Work: enq.Type_of_Work || enq.type_of_work || enq.tow,
          Method_of_Contact: enq.Method_of_Contact || enq.method_of_contact || enq.moc,
          Point_of_Contact: enq.Point_of_Contact || enq.poc,
          First_Name: enq.First_Name || enq.first_name || enq.first,
          Last_Name: enq.Last_Name || enq.last_name || enq.last,
          Phone_Number: enq.Phone_Number || enq.phone_number || enq.phone,
          Company: enq.Company || enq.company,
          Value: enq.Value || enq.value,
          Rating: enq.Rating || enq.rating,
          // Add any other fields as needed
          ...enq
        })) as Enquiry[];
        
        console.log('✅ Successfully fetched and filtered NEW enquiries data:', newEnquiries.length);
        
        // Add the NEW enquiries to the beginning of the array
        enquiries = [...newEnquiries, ...enquiries];
        
      } else {
        console.warn('❌ NEW enquiries data not available:', newResponse.status, newResponse.statusText);
        const errorText = await newResponse.text().catch(() => 'Could not read error response');
        console.warn('Error details:', errorText);
      }
    } catch (error) {
      console.warn('❌ Error fetching NEW enquiries data (non-blocking):', error);
    }
  }

  // Always attempt to fetch LEGACY enquiries so existing data continues to load
  try {
    console.log('🔵 Attempting to fetch LEGACY enquiries data (via proxy)...');


    // Hard-code the legacy base URL, but get path and code strictly from env
    const legacyBaseUrl = 'https://helix-keys-proxy.azurewebsites.net/api';
    const legacyPath = process.env.REACT_APP_GET_ENQUIRIES_PATH;
    const legacyCode = process.env.REACT_APP_GET_ENQUIRIES_CODE;
    const legacyDataUrl = `${legacyBaseUrl}/${legacyPath}?code=${legacyCode}`;

    // Add debug log to confirm the call is being attempted
    console.log('[fetchEnquiries] Attempting legacy getEnquiries call:', legacyDataUrl, { email, dateFrom, dateTo });

    // The proxy expects POST with JSON body containing email, dateFrom, dateTo
    const legacyResponse = await fetch(legacyDataUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email, // Use actual email for proper filtering
        dateFrom: dateFrom,
        dateTo: dateTo
      })
    });

    console.log('📋 LEGACY response status:', legacyResponse.status, legacyResponse.statusText);

    if (legacyResponse.ok) {
      console.log('✅ LEGACY enquiries response OK, processing data...');
      const legacyData = await legacyResponse.json();
      console.log('📦 Raw LEGACY data:', legacyData);
      console.log('📦 Raw LEGACY data count:', Array.isArray(legacyData) ? legacyData.length : legacyData.enquiries?.length || 0);

      let rawLegacyEnquiries: any[] = [];
      if (Array.isArray(legacyData)) {
        rawLegacyEnquiries = legacyData;
      } else if (Array.isArray(legacyData.enquiries)) {
        rawLegacyEnquiries = legacyData.enquiries;
      }

      console.log('📊 Raw LEGACY enquiries before filtering:', rawLegacyEnquiries.length);

      // Filter legacy enquiries based on email matching (legacy system)
      const userEmail = email.toLowerCase();

      console.log('🔍 LEGACY filtering debug:');
      console.log('   User email for filtering:', userEmail);
      console.log('   Sample LEGACY record Point_of_Contact:', rawLegacyEnquiries[0]?.Point_of_Contact);

      const filteredLegacyEnquiries = rawLegacyEnquiries.filter(enq => {
        const pocEmail = (enq.Point_of_Contact || enq.poc || '').toLowerCase();
        const unclaimedEmails = [
          'team@helix-law.com',
          'commercial@helix-law.com',
          'construction@helix-law.com',
          'employment@helix-law.com',
          'property@helix-law.com',
        ];
        const isUnclaimed = unclaimedEmails.includes(pocEmail);

        return pocEmail === userEmail || isUnclaimed;
      });

      // Convert legacy data to Enquiry format and append to existing enquiries
      const legacyEnquiries = filteredLegacyEnquiries.map(enq => ({
        ID: enq.ID || enq.id || String(Math.random()),
        Date_Created: enq.Date_Created || enq.date_created || enq.datetime,
        Touchpoint_Date: enq.Touchpoint_Date || enq.touchpoint_date || enq.datetime,
        Email: enq.Email || enq.email,
        Area_of_Work: enq.Area_of_Work || enq.area_of_work || enq.aow,
        Type_of_Work: enq.Type_of_Work || enq.type_of_work || enq.tow,
        Method_of_Contact: enq.Method_of_Contact || enq.method_of_contact || enq.moc,
        Point_of_Contact: enq.Point_of_Contact || enq.poc,
        First_Name: enq.First_Name || enq.first_name || enq.first,
        Last_Name: enq.Last_Name || enq.last_name || enq.last,
        Phone_Number: enq.Phone_Number || enq.phone_number || enq.phone,
        Company: enq.Company || enq.company,
        Value: enq.Value || enq.value,
        Rating: enq.Rating || enq.rating,
        // Add any other fields as needed
        ...enq
      })) as Enquiry[];

      console.log('✅ Successfully fetched and filtered LEGACY enquiries data:', legacyEnquiries.length);

      // Append LEGACY enquiries to the end (after NEW enquiries)
      enquiries = [...enquiries, ...legacyEnquiries];

    } else {
      console.warn('❌ LEGACY enquiries data not available:', legacyResponse.status, legacyResponse.statusText);
      const errorText = await legacyResponse.text().catch(() => 'Could not read error response');
      console.warn('Error details:', errorText);
      console.warn('Response headers:', Array.from(legacyResponse.headers.entries()));
    }
  } catch (error) {
    console.warn('❌ Error fetching LEGACY enquiries data (non-blocking):', error);
  }

  // Apply area-of-work filtering based on user's AOW
  let filteredEnquiries = enquiries;
  if (userAow) {
    const userAreas = userAow
      .split(',')
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);
    const hasFullAccess = userAreas.some(
      (a) => a.includes('operations') || a.includes('tech'),
    );
    if (!hasFullAccess) {
      filteredEnquiries = enquiries.filter((enq) => {
        const area = (enq.Area_of_Work || (enq as any).aow || '').toLowerCase();
        return userAreas.some(
          (a) => a === area || a.includes(area) || area.includes(a),
        );
      });
    }
  }

  console.log('🎯 FINAL ENQUIRIES SUMMARY:');
  console.log('   Total before AOW filtering:', enquiries.length);
  console.log('   Total after AOW filtering:', filteredEnquiries.length);
  console.log('   User AOW:', userAow);

  setCachedData(cacheKey, filteredEnquiries);
  console.log('🏁 FETCH ENQUIRIES RETURNING:', filteredEnquiries.length, 'enquiries');
  return filteredEnquiries;
}

async function fetchMatters(fullName: string): Promise<Matter[]> {
  const cacheKey = `matters-${fullName}`;
  const cached = getCachedData<Matter[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `${proxyBaseUrl}/${process.env.REACT_APP_GET_MATTERS_PATH}?code=${process.env.REACT_APP_GET_MATTERS_CODE}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName }),
    },
  );
  if (!response.ok)
    throw new Error(`Failed to fetch matters: ${response.status}`);
  const data = await response.json();

  const mapData = (items: any[]): Matter[] => {
    return items.map((item) => ({
      MatterID: item["MatterID"] || item["Matter ID"] || "",
      InstructionRef: item["InstructionRef"] || item["Instruction Ref"] || "",
      DisplayNumber: item["Display Number"] || "",
      OpenDate: item["Open Date"] || "",
      MonthYear: item["MonthYear"] || "",
      YearMonthNumeric: item["YearMonthNumeric"] || 0,
      ClientID: item["Client ID"] || "",
      ClientName: item["Client Name"] || "",
      ClientPhone: item["Client Phone"] || "",
      ClientEmail: item["Client Email"] || "",
      Status: item["Status"] || "",
      UniqueID: item["Unique ID"] || "",
      Description: item["Description"] || "",
      PracticeArea: item["Practice Area"] || "",
      Source: item["Source"] || "",
      Referrer: item["Referrer"] || "",
      ResponsibleSolicitor: item["Responsible Solicitor"] || "",
      OriginatingSolicitor: item["Originating Solicitor"] || "",
      SupervisingPartner: item["Supervising Partner"] || "",
      Opponent: item["Opponent"] || "",
      OpponentSolicitor: item["Opponent Solicitor"] || "",
      CloseDate: item["Close Date"] || "",
      ApproxValue: item["Approx. Value"] || "",
      mod_stamp: item["mod_stamp"] || "",
      method_of_contact: item["method_of_contact"] || "",
      CCL_date: item["CCL_date"] || null,
      Rating: item["Rating"] as "Good" | "Neutral" | "Poor" | undefined,
    }));
  };

  let fetchedMatters: Matter[] = [];

  if (Array.isArray(data)) {
    fetchedMatters = mapData(data);
  } else if (Array.isArray(data.matters)) {
    fetchedMatters = mapData(data.matters);
  } else {
    console.warn("Unexpected data format:", data);
  }
  setCachedData(cacheKey, fetchedMatters);
  return fetchedMatters;
}

async function fetchTeamData(): Promise<TeamData[] | null> {
  const cacheKey = "teamData";
  const cached = getCachedData<TeamData[]>(cacheKey);
  if (cached) return cached;
  try {
    const response = await fetch(
      `${proxyBaseUrl}/getTeamData?code=${process.env.REACT_APP_GET_TEAM_DATA_CODE}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch team data: ${response.statusText}`);
    }
    const data: TeamData[] = await response.json();
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error fetching team data:", error);
    return null;
  }
}

// Main component
const AppWithContext: React.FC = () => {
  const [teamsContext, setTeamsContext] =
    useState<microsoftTeams.Context | null>(null);
  const [userData, setUserData] = useState<UserData[] | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [matters, setMatters] = useState<Matter[] | null>(null);
  const [teamData, setTeamData] = useState<TeamData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Local development state for area selection
  const [localSelectedAreas, setLocalSelectedAreas] = useState<string[]>(['Commercial', 'Construction', 'Property']);

  // Update user data when local areas change
  const updateLocalUserData = (areas: string[]) => {
    setLocalSelectedAreas(areas);
    if (useLocalData && userData) {
      const updatedUserData = [{
        ...userData[0],
        AOW: areas.join(', ')
      }];
      setUserData(updatedUserData as UserData[]);
    }
  };

  // Allow switching user in production for specific users
  const switchUser = async (newUser: UserData) => {
    const normalized: UserData = {
      ...newUser,
      EntraID: (newUser as any)["Entra ID"] || newUser.EntraID,
      ClioID: (newUser as any)["Clio ID"] || newUser.ClioID,
      FullName: newUser.FullName || (newUser as any)["Full Name"],
    };
    setUserData([normalized]);
    const fullName =
      normalized.FullName ||
      `${normalized.First || ''} ${normalized.Last || ''}`.trim();
    try {
      const mattersRes = await fetchMatters(fullName);
      setMatters(mattersRes);
    } catch (err) {
      console.error('Error fetching matters for switched user:', err);
    }
  };

  useEffect(() => {
    const initializeTeamsAndFetchData = async () => {
      if (inTeams && !useLocalData) {
        try {
          microsoftTeams.initialize();
          microsoftTeams.getContext(async (ctx) => {
            setTeamsContext(ctx);

            const objectId = ctx.userObjectId || "";
            if (!objectId) throw new Error("Missing Teams context objectId.");

            const { dateFrom, dateTo } = getDateRange();

            // 1. Fetch user data first to get full name
            const userDataRes = await fetchUserData(objectId);
            setUserData(userDataRes);

            const fullName =
              `${userDataRes[0]?.First} ${userDataRes[0]?.Last}`.trim() || "";

            // 2. In parallel, fetch enquiries, matters, and team data
            const [enquiriesRes, mattersRes, teamDataRes] = await Promise.all([
              fetchEnquiries(
                userDataRes[0]?.Email || "",
                dateFrom,
                dateTo,
                userDataRes[0]?.AOW || "",
                userDataRes[0]?.Initials || "",
              ),
              fetchMatters(fullName),
              fetchTeamData(),
            ]);

            setEnquiries(enquiriesRes);
            setMatters(mattersRes);
            setTeamData(teamDataRes);

            setLoading(false);
          });
        } catch (err: any) {
          console.error("Error initializing or fetching data:", err);
          setError(err.message || "Unknown error occurred.");

          setLoading(false);
        }
      } else {
        console.log("Using local sample data for development.");
        setTeamsContext({
          userObjectId: "local",
          userPrincipalName: "lz@helix-law.com",
          theme: "default",
        } as microsoftTeams.Context);
        
        // Initialize local user data with selected areas
        const initialUserData = [{
          ...localUserData[0],
          AOW: localSelectedAreas.join(', ')
        }];
        setUserData(initialUserData as UserData[]);
        
        // For local development, also test the dual enquiries fetching
        const { dateFrom, dateTo } = getDateRange();
        const fullName = `${initialUserData[0].First} ${initialUserData[0].Last}`.trim();
        
        try {
          const [enquiriesRes, mattersRes] = await Promise.all([
            fetchEnquiries(
              initialUserData[0].Email || "",
              dateFrom,
              dateTo,
              initialUserData[0].AOW || "",
              initialUserData[0].Initials || "",
            ),
            fetchMatters(fullName),
          ]);
          
          setEnquiries(enquiriesRes);
          setMatters(mattersRes);
        } catch (err) {
          console.error('Error fetching live data in local dev:', err);
          // Fallback to local sample data
          setEnquiries(getLiveLocalEnquiries(initialUserData[0].Email) as Enquiry[]);
          setMatters(localMatters as unknown as Matter[]);
        }
        
        setTeamData(localTeamData as TeamData[]);
        setLoading(false);
      }
    };

    initializeTeamsAndFetchData();
  }, [localSelectedAreas]); // Add dependency so it re-runs when areas change

  return (
    <>
      <App
        teamsContext={teamsContext}
        userData={userData}
        enquiries={enquiries}
        matters={matters}
        fetchMatters={fetchMatters}
        isLoading={loading}
        error={error}
        teamData={teamData}
        isLocalDev={useLocalData}
        onAreaChange={updateLocalUserData}
        onUserChange={switchUser}
      />
    </>
  );
};

const root = document.getElementById('root');
if (window.location.pathname === '/data') {
  ReactDOM.render(
    <React.StrictMode>
      <ThemeProvider theme={customTheme}>
        <Data />
      </ThemeProvider>
    </React.StrictMode>,
    root,
  );
} else {
  ReactDOM.render(
    <React.StrictMode>
      <ThemeProvider theme={customTheme}>
        <AppWithContext />
      </ThemeProvider>
    </React.StrictMode>,
    root,
  );
}