
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

// Flag to decide whether to use local sample data instead of remote API
const inTeams = isInTeams();
const useLocalData =
  process.env.REACT_APP_USE_LOCAL_DATA === "true" || !inTeams;

// Clear persisted pitch builder state when the page is refreshed or closed
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    sessionStorage.removeItem("pitchBuilderState");
  });

  // Surface any unhandled promise rejections so they don't fail silently
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
    `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_GET_USER_DATA_PATH}?code=${process.env.REACT_APP_GET_USER_DATA_CODE}`,
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
): Promise<Enquiry[]> {
  const cacheKey = `enquiries-${email}-${dateFrom}-${dateTo}`;
  const cached = getCachedData<Enquiry[]>(cacheKey);
  if (cached) return cached;
  
  // Build query parameters for the new decoupled function
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  // Note: email parameter not used in new function as it filters by different fields
  
  const response = await fetch(
    `/api/enquiries?${params.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  if (!response.ok)
    throw new Error(`Failed to fetch enquiries: ${response.status}`);
  const data = await response.json();
  const enquiries = data.enquiries || [];
  setCachedData(cacheKey, enquiries);
  return enquiries;
}

async function fetchMatters(fullName: string): Promise<Matter[]> {
  const cacheKey = `matters-${fullName}`;
  const cached = getCachedData<Matter[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_GET_MATTERS_PATH}?code=${process.env.REACT_APP_GET_MATTERS_CODE}`,
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
      `${process.env.REACT_APP_PROXY_BASE_URL}/getTeamData?code=${process.env.REACT_APP_GET_TEAM_DATA_CODE}`,
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
              fetchEnquiries("anyone", dateFrom, dateTo),
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
        console.warn("Using local sample data for development.");
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
        setEnquiries(localEnquiries as Enquiry[]);
        setMatters(localMatters as unknown as Matter[]);
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
      />
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={customTheme}>
      <AppWithContext />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);
