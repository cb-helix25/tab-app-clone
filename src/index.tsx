import React, { useState, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./app/styles/index.css";
import App from "./app/App";
import { createTheme, ThemeProvider } from "@fluentui/react";
import { colours } from "./app/styles/colours";
import * as microsoftTeams from "@microsoft/teams-js";
import { isInTeams } from "./app/functionality/isInTeams";
import { Matter, UserData, Enquiry, TeamData, NormalizedMatter } from "./app/functionality/types";
import { mergeMattersFromSources } from "./utils/matterNormalization";

import "./utils/callLogger";
import { getProxyBaseUrl } from "./utils/getProxyBaseUrl";
import { initializeIcons } from "@fluentui/react";
const Data = lazy(() => import("./tabs/Data"));

// Initialize icons once, but defer to idle to speed first paint
if (typeof window !== 'undefined' && !(window as any).__iconsInitialized) {
  const init = () => {
    initializeIcons();
    (window as any).__iconsInitialized = true;
  };
  (window as any).requestIdleCallback ? (window as any).requestIdleCallback(init) : setTimeout(init, 0);
}

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
  fetchAll: boolean = false // New parameter to fetch all enquiries without filtering
): Promise<Enquiry[]> {
  const cacheKey = `enquiries-${email}-${dateFrom}-${dateTo}-${userAow}`;
  const cached = getCachedData<Enquiry[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Primary source: use server-side routes to avoid browser CORS issues
  //  - Both local and production: use unified route for proper Ultimate_Source -> source mapping
  let enquiries: Enquiry[] = [];
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  try {
    const primaryUrl = '/api/enquiries-unified';
    const resp = await fetch(primaryUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (resp.ok) {
      const data = await resp.json();
      let raw: any[] = [];
      if (Array.isArray(data)) raw = data; else if (Array.isArray(data.enquiries)) raw = data.enquiries;

      // Filter to user scope unless fetchAll
      const userEmail = email.toLowerCase();
      const userInitialsUpper = userInitials.toUpperCase();
      let filtered = raw;
      if (!fetchAll) {
        filtered = raw.filter(enq => {
          const poc = (enq.Point_of_Contact || enq.poc || '') as string;
          const pocInitials = poc.toUpperCase();
          const pocEmail = poc.toLowerCase();
          const matchesInitials = pocInitials === userInitialsUpper;
          const matchesEmail = pocEmail === userEmail;
          const unclaimedEmails = ['team@helix-law.com'];
          const isUnclaimed = unclaimedEmails.includes(pocEmail) || pocInitials === 'TEAM';
          return matchesInitials || matchesEmail || isUnclaimed;
        });
      }

      enquiries = filtered.map(enq => ({
        ID: (enq as any).ID || (enq as any).id || String(Math.random()),
        Date_Created: (enq as any).Date_Created || (enq as any).date_created || (enq as any).datetime,
        Touchpoint_Date: (enq as any).Touchpoint_Date || (enq as any).touchpoint_date || (enq as any).datetime,
        Email: (enq as any).Email || (enq as any).email,
        Area_of_Work: (enq as any).Area_of_Work || (enq as any).area_of_work || (enq as any).aow,
        Type_of_Work: (enq as any).Type_of_Work || (enq as any).type_of_work || (enq as any).tow,
        Method_of_Contact: (enq as any).Method_of_Contact || (enq as any).method_of_contact || (enq as any).moc,
        Point_of_Contact: (enq as any).Point_of_Contact || (enq as any).poc,
        First_Name: (enq as any).First_Name || (enq as any).first_name || (enq as any).first,
        Last_Name: (enq as any).Last_Name || (enq as any).last_name || (enq as any).last,
        Phone_Number: (enq as any).Phone_Number || (enq as any).phone_number || (enq as any).phone,
        Company: (enq as any).Company || (enq as any).company,
        Value: (enq as any).Value || (enq as any).value,
        Rating: (enq as any).Rating || (enq as any).rating,
        ...enq
      })) as Enquiry[];
    }
  } catch {
    // non-blocking; fallback below
  }

  // Fetch LEGACY enquiries as a fallback ONLY if we don't already have results
  try {
    if (enquiries.length === 0) {

    // Use local Express server proxy when developing, otherwise call production proxy
    const legacyBaseUrl = isLocalDev
      ? 'http://localhost:8080'
      : 'https://helix-keys-proxy.azurewebsites.net/api';
    const legacyPath = process.env.REACT_APP_GET_ENQUIRIES_PATH;
    const legacyCode = process.env.REACT_APP_GET_ENQUIRIES_CODE;
    const legacyDataUrl = `${legacyBaseUrl}/${legacyPath}?code=${legacyCode}`;

    // The proxy expects POST with JSON body containing email, dateFrom, dateTo
    // Use 'anyone' to retrieve all enquiries and filter client-side
    const legacyResponse = await fetch(legacyDataUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'anyone',
        dateFrom,
        dateTo,
      }),
    });

  if (legacyResponse.ok) {
      const legacyData = await legacyResponse.json();

      let rawLegacyEnquiries: any[] = [];
      if (Array.isArray(legacyData)) {
        rawLegacyEnquiries = legacyData;
      } else if (Array.isArray(legacyData.enquiries)) {
        rawLegacyEnquiries = legacyData.enquiries;
      }

      // Filter legacy enquiries based on email matching (legacy system)
      const userEmail = email.toLowerCase();

      const filteredLegacyEnquiries = rawLegacyEnquiries.filter(enq => {
        const pocEmail = (enq.Point_of_Contact || enq.poc || '').toLowerCase();
        // Only keep legacy enquiries assigned to the current user or the team inbox
        const unclaimedEmails = ['team@helix-law.com'];
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

      // Use LEGACY enquiries as fallback (no NEW data loaded yet)
      enquiries = [...legacyEnquiries];

    } else {
      const errorText = await legacyResponse.text().catch(() => 'Could not read error response');
    }
    }
  } catch (error) {
    // Legacy enquiries error is non-blocking
  }

  // De-duplicate by ID to avoid duplicates when sources overlap
  if (Array.isArray(enquiries) && enquiries.length > 1) {
    const seen = new Set<string>();
    const deduped: Enquiry[] = [] as unknown as Enquiry[];
    for (const e of enquiries as unknown as any[]) {
      const id = (e && (e.ID || e.id)) ? String(e.ID || e.id) : '';
      if (!id || !seen.has(id)) {
        if (id) seen.add(id);
        deduped.push(e as Enquiry);
      }
    }
    enquiries = deduped;
  }

  // Apply area-of-work filtering based on user's AOW (only for unclaimed enquiries)
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
      const unclaimedEmails = ['team@helix-law.com'];
      filteredEnquiries = enquiries.filter((enq) => {
        const pocEmail = (enq.Point_of_Contact || (enq as any).poc || '').toLowerCase();
        const isUnclaimed = unclaimedEmails.includes(pocEmail) || pocEmail === 'team';
        if (!isUnclaimed) {
          return true; // keep claimed enquiries regardless of area
        }
        const area = (enq.Area_of_Work || (enq as any).aow || '').toLowerCase();
        return userAreas.some(
          (a) => a === area || a.includes(area) || area.includes(a),
        );
      });
    }
  }

  setCachedData(cacheKey, filteredEnquiries);
  return filteredEnquiries;
}

// Helper functions for mapping matter data from different sources
const mapLegacyMatters = (items: any[]): Matter[] => {
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

const mapNewMatters = (items: any[]): Matter[] => {
  return items.map((item) => ({
    MatterID: item.MatterID || item.matter_id || "",
    InstructionRef: item.InstructionRef || item.instruction_ref || "",
    DisplayNumber: item.DisplayNumber || item.display_number || "",
    OpenDate: item.OpenDate || item.open_date || "",
    MonthYear: item.MonthYear || item.month_year || "",
    YearMonthNumeric: item.YearMonthNumeric || item.year_month_numeric || 0,
    ClientID: item.ClientID || item.client_id || "",
    ClientName: item.ClientName || item.client_name || "",
    ClientPhone: item.ClientPhone || item.client_phone || "",
    ClientEmail: item.ClientEmail || item.client_email || "",
    Status: item.Status || item.status || "",
    UniqueID: item.UniqueID || item.unique_id || "",
    Description: item.Description || item.description || "",
    PracticeArea: item.PracticeArea || item.practice_area || "",
    Source: item.Source || item.source || "",
    Referrer: item.Referrer || item.referrer || "",
    ResponsibleSolicitor: item.ResponsibleSolicitor || item.responsible_solicitor || "",
    OriginatingSolicitor: item.OriginatingSolicitor || item.originating_solicitor || "",
    SupervisingPartner: item.SupervisingPartner || item.supervising_partner || "",
    Opponent: item.Opponent || item.opponent || "",
    OpponentSolicitor: item.OpponentSolicitor || item.opponent_solicitor || "",
    CloseDate: item.CloseDate || item.close_date || "",
    ApproxValue: item.ApproxValue || item.approx_value || "",
    mod_stamp: item.mod_stamp || '',
    method_of_contact: item.method_of_contact || '',
    CCL_date: item.CCL_date || null,
    Rating: item.Rating as "Good" | "Neutral" | "Poor" | undefined,
  }));
};

async function fetchAllMatters(): Promise<Matter[]> {
  const cacheKey = 'allMatters';
  const cached = getCachedData<Matter[]>(cacheKey);
  if (cached) return cached;

  const isLocalDev = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  let allMatters: any[] = [];

  try {
    const getAllMattersCode = process.env.REACT_APP_GET_ALL_MATTERS_CODE;
    // Use Express server proxy when developing, same pattern as getEnquiries
    const getAllMattersUrl = isLocalDev 
      ? `http://localhost:8080/api/getAllMatters${getAllMattersCode ? `?code=${getAllMattersCode}` : ''}` 
      : `${proxyBaseUrl}/${process.env.REACT_APP_GET_ALL_MATTERS_PATH}?code=${getAllMattersCode}`;
    
    const response = await fetch(getAllMattersUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    if (response.ok) {
      const data = await response.json();
      allMatters = Array.isArray(data) ? data : data.matters || [];
    }
  } catch (err) {
    // All matters fetch error is non-blocking
  }

  const mappedMatters = mapLegacyMatters(allMatters);
  setCachedData(cacheKey, mappedMatters);
  return mappedMatters;
}

async function fetchMatters(fullName: string): Promise<Matter[]> {
  const cacheKey = `matters-${fullName}`;
  const cached = getCachedData<Matter[]>(cacheKey);
  if (cached) return cached;

  const isLocalDev = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  // IMPORTANT: We previously pointed local dev legacy fetch to /api/getMatters which
  // is now reserved for the NEW (VNet) dataset (decoupled fetchMattersData function).
  // That caused the "legacy" path to return new data and starve the actual new dataset
  // (because both code paths hit the same route and we then filtered by source).
  // To restore a clean separation:
  //  - NEW dataset   -> /api/getMatters (GET/POST)  (decoupled VNet function proxy)
  //  - LEGACY dataset (user) -> call legacy Azure Function via helix-keys proxy even in local dev
  //  - LEGACY dataset (all)  -> /api/getAllMatters (already legacy)
  // This ensures local dev still sees legacy data while allowing VNet toggle to work.
  // Route legacy per-user matters via server proxy to avoid exposing function keys
  // Mounted under /api in the local Express server
  const legacyUrl = '/api/getMatters';

  let legacyData: any[] = [];

  try {
    const response = await fetch(legacyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName }),
    });
    if (!response.ok) throw new Error(`Failed to fetch matters: ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data)) legacyData = data;
    else if (Array.isArray(data.matters)) legacyData = data.matters;
  } catch (err) {
    console.warn('Legacy matters fetch failed', err);
  }

  let fetchedMatters = mapLegacyMatters(legacyData);

  if (fetchedMatters.length === 0) {
    const { default: localMatters } = await import('./localData/localMatters.json');
    fetchedMatters = mapLegacyMatters(localMatters as unknown as any[]);
  }

  setCachedData(cacheKey, fetchedMatters);
  return fetchedMatters;
}

async function fetchVNetMatters(fullName?: string): Promise<any[]> {
  const cacheKey = fullName ? `vnetMatters-${fullName}` : 'vnetMatters-all';
  const cached = getCachedData<any[]>(cacheKey);
  if (cached) return cached;
  // NEW dataset lives behind /api/getMatters (decoupled function). We previously
  // used /api/matters which is a single-matter Clio lookup route and cannot serve
  // bulk lists, resulting in 0 "new" matters. Switching to /api/getMatters fixes that.
  const newUrl = '/api/getMatters';
  let vnetData: any[] = [];

  try {
    // Support optional fullName filter (POST is also accepted by the route, but GET keeps caching simpler)
    const params = fullName ? `?fullName=${encodeURIComponent(fullName)}` : '';
    const resNew = await fetch(`${newUrl}${params}`, { method: 'GET' });
    if (resNew.ok) {
      const data = await resNew.json();
      vnetData = Array.isArray(data) ? data : data.matters || [];
      
    } else {
      console.warn('❌ VNet matters fetch failed:', resNew.status, resNew.statusText);
    }
  } catch (err) {
    console.warn('VNet matters fetch error', err);
  }

  setCachedData(cacheKey, vnetData);
  return vnetData;
}

// (removed) legacy v4 fetchAllMatterSources in favor of unified v5
  async function fetchAllMatterSources(fullName: string): Promise<NormalizedMatter[]> {
    // v5 cache key: unified server endpoint
    const cacheKey = `normalizedMatters-v5-${fullName}`;
    const cached = getCachedData<NormalizedMatter[]>(cacheKey);
    if (cached) return cached;

    try {
      const query = fullName ? `?fullName=${encodeURIComponent(fullName)}` : '';
      const res = await fetch(`/api/matters-unified${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const legacyAll = Array.isArray(data.legacyAll) ? data.legacyAll : [];
      const vnetAll = Array.isArray(data.vnetAll) ? data.vnetAll : [];

      const normalizedMatters = mergeMattersFromSources(
        legacyAll,
        [],
        vnetAll,
        fullName,
      );
      setCachedData(cacheKey, normalizedMatters);
      return normalizedMatters;
    } catch (err) {
      // Fallback: call previous two-source path
      try {
        const [allMatters, vnetAllMatters] = await Promise.all([
          fetchAllMatters(),
          fetchVNetMatters(),
        ]);
        const normalizedMatters = mergeMattersFromSources(
          allMatters,
          [],
          vnetAllMatters,
          fullName,
        );
        setCachedData(cacheKey, normalizedMatters);
        return normalizedMatters;
      } catch {
        return [];
      }
    }
  }

async function fetchTeamData(): Promise<TeamData[] | null> {
  console.log('🚀 fetchTeamData called...');
  const cacheKey = "teamData";
  const cached = getCachedData<TeamData[]>(cacheKey);
  if (cached) {
    console.log('📦 Using cached team data:', cached.length, 'members');
    return cached;
  }
  try {
    console.log('🌐 Making API call to /api/team-data...');
    // Use server route instead of decoupled function
    const response = await fetch(
      `/api/team-data`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    console.log('📡 Response received:', response.status, response.statusText);
    if (!response.ok) {
      throw new Error(`Failed to fetch team data: ${response.statusText}`);
    }
    const data: TeamData[] = await response.json();
    console.log('✅ Team data fetched from server route:', data?.length, 'members');
    console.log('👥 Active members:', data?.filter(m => m.status?.toLowerCase() === 'active').length);
    console.log('🚫 Inactive members:', data?.filter(m => m.status?.toLowerCase() === 'inactive').length);
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error("❌ Error fetching team data:", error);
    return null;
  }
}

// Main component
const AppWithContext: React.FC = () => {
  const [teamsContext, setTeamsContext] =
    useState<microsoftTeams.Context | null>(null);
  const [userData, setUserData] = useState<UserData[] | null>(null);
  const [originalAdminUser, setOriginalAdminUser] = useState<UserData | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [matters, setMatters] = useState<NormalizedMatter[]>([]);
  const [teamData, setTeamData] = useState<TeamData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Local development state for area selection
  const [localSelectedAreas, setLocalSelectedAreas] = useState<string[]>(['Commercial', 'Construction', 'Property']);

  // Refresh enquiries function - can be called after claiming an enquiry
  const refreshEnquiries = async () => {
    if (!userData || !userData[0]) return;
    
    try {
      const { dateFrom, dateTo } = getDateRange();
      const userEmail = userData[0].Email || "";
      const userAow = userData[0].AOW || "";
      const userInitials = userData[0].Initials || "";

      const enquiriesRes = await fetchEnquiries(userEmail, dateFrom, dateTo, userAow, userInitials);
      setEnquiries(enquiriesRes);
      
    } catch (error) {
      console.error('❌ Error refreshing enquiries:', error);
    }
  };

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
    // Store the current admin user if this is the first switch
    if (!originalAdminUser && userData && userData[0]) {
      setOriginalAdminUser(userData[0]);
    }

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
    


    
    // Clear localStorage cache when switching users to force fresh data
    // Include normalized matters v5 cache keys and other matter-related caches
    const keysToRemove = Object.keys(localStorage).filter(key => {
      const k = key.toLowerCase();
      return (
        k.includes('enquiries-') ||
        k.includes('userdata-') ||
        k.includes('matters-') ||
        k.startsWith('normalizedmatters-v5-') ||
        k.startsWith('vnetmatters-') ||
        k === 'allmatters'
      );
    });
    keysToRemove.forEach(key => localStorage.removeItem(key));

    
    try {
      // Fetch matters for new user
      const mattersRes = await fetchAllMatterSources(fullName);
      setMatters(mattersRes);
      
      // Fetch enquiries for new user with extended date range and fresh data
      const { dateFrom, dateTo } = getDateRange();
      const enquiriesRes = await fetchEnquiries(
        normalized.Email || '',
        dateFrom,
        dateTo,
        normalized.AOW || '',
        normalized.Initials || ''
      );
      setEnquiries(enquiriesRes);
      

      
    } catch (err) {
      console.error('Error fetching data for switched user:', err);
    }
  };

  // Return to original admin user
  const returnToAdmin = async () => {
    if (originalAdminUser) {

      await switchUser(originalAdminUser);
      setOriginalAdminUser(null); // Clear the stored admin user
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
              fetchAllMatterSources(fullName),
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


        setTeamsContext({
          userObjectId: "local",
          userPrincipalName: "lz@helix-law.com",
          theme: "default",
        } as microsoftTeams.Context);
        
        // Initialize local user data with selected areas
        const { default: localUserData } = await import('./localData/localUserData.json');
        const initialUserData = [{
          ...localUserData[0],
          AOW: localSelectedAreas.join(', ')
        }];

        setUserData(initialUserData as UserData[]);
        
        // For local development, also test the dual enquiries fetching
        const { dateFrom, dateTo } = getDateRange();
        const fullName = `${initialUserData[0].First} ${initialUserData[0].Last}`.trim();

        try {

          // Try to fetch enquiries independently first
          let enquiriesRes: Enquiry[] = [];
          try {
            enquiriesRes = await fetchEnquiries(
              initialUserData[0].Email || "",
              dateFrom,
              dateTo,
              initialUserData[0].AOW || "",
              initialUserData[0].Initials || "",
            );
            
          } catch (enquiriesError) {
            console.warn('⚠️ Enquiries API failed, using fallback:', enquiriesError);
            const { getLiveLocalEnquiries } = await import('./tabs/home/Home');
            enquiriesRes = getLiveLocalEnquiries(initialUserData[0].Email) as Enquiry[];
          }
          
          // Try to fetch matters separately (don't block enquiries)
          let normalizedMatters: NormalizedMatter[] = [];
          try {
            normalizedMatters = await fetchAllMatterSources(fullName);
            
          } catch (mattersError) {
            console.warn('⚠️ Matters API failed, using fallback:', mattersError);
            // Create fallback normalized matters from local data
            const { default: localMatters } = await import('./localData/localMatters.json');
            const fallbackMatters = mergeMattersFromSources([], localMatters as unknown as Matter[], [], fullName);
            normalizedMatters = fallbackMatters;
          }

          // Removed extra local-dev fetchAllMatters test call to avoid duplicate requests

          setEnquiries(enquiriesRes);
          setMatters(normalizedMatters);
        } catch (err) {
          console.error('❌ Unexpected error in local dev:', err);
          
          // Fallback to local sample data with normalization
          const { getLiveLocalEnquiries } = await import('./tabs/home/Home');
          const { default: localMatters } = await import('./localData/localMatters.json');
          const fallbackEnquiries = getLiveLocalEnquiries(initialUserData[0].Email) as Enquiry[];
          const fallbackMatters = mergeMattersFromSources([], localMatters as unknown as Matter[], [], fullName);
          
          setEnquiries(fallbackEnquiries);
          setMatters(fallbackMatters);
        }
        
        // Prefer live team data via server route even in local dev; fallback to local JSON
        try {
          const liveTeam = await fetchTeamData();
          if (liveTeam && Array.isArray(liveTeam) && liveTeam.length > 0) {
            setTeamData(liveTeam);
          } else {
            const { default: localTeamData } = await import('./localData/team-sql-data.json');
            setTeamData(localTeamData as TeamData[]);
          }
        } catch {
          const { default: localTeamData } = await import('./localData/team-sql-data.json');
          setTeamData(localTeamData as TeamData[]);
        }
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
        isLoading={loading}
        error={error}
        teamData={teamData}
        isLocalDev={useLocalData}
        onAreaChange={updateLocalUserData}
        onUserChange={switchUser}
        onReturnToAdmin={returnToAdmin}
        originalAdminUser={originalAdminUser}
        onRefreshEnquiries={refreshEnquiries}
      />
    </>
  );
};

const root = document.getElementById('root');
const appRoot = createRoot(root!);

if (window.location.pathname === '/data') {
  appRoot.render(
    <React.StrictMode>
      <ThemeProvider theme={customTheme}>
        <Suspense fallback={<div>Loading...</div>}>
          <Data />
        </Suspense>
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  appRoot.render(
    <React.StrictMode>
      <ThemeProvider theme={customTheme}>
        <AppWithContext />
      </ThemeProvider>
    </React.StrictMode>
  );
}