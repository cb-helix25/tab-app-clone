// src/index.ts

import { app } from "@azure/functions";

// Import all functions
import "./functions/approveSnippetEdit";
import "./functions/deleteSnippetEdit";
import "./functions/generateReportDataset";
import "./functions/getAllMatters";
import "./functions/getAnnualLeave";
import "./functions/getAnnualLeaveAll";
import "./functions/getAttendance";
import "./functions/getComplianceData";
import "./functions/getEnquiries";
import "./functions/getFutureBookings";
import "./functions/getInstructionData";
import "./functions/getMatterOverview";
import "./functions/getMatters";
import "./functions/getMatterSpecificActivities";
import "./functions/getOutstandingClientBalances";
import "./functions/getPOID";
import "./functions/getPOID6years";
import "./functions/getRecovered";
import "./functions/getRoadmap";
import "./functions/getSimplifiedBlocks";
import "./functions/getSnippetBlocks";
import "./functions/getSnippetEdits";
import "./functions/getTeamData";
import "./functions/getTransactions";
import "./functions/getUserData";
import "./functions/getUserProfile";
import "./functions/getWIPClio";
import "./functions/insertAnnualLeave";
import "./functions/insertAttendance";
import "./functions/insertBookSpace";
import "./functions/insertDeal";
import "./functions/insertRiskAssessment";
import "./functions/insertRoadmap";
import "./functions/postFinancialTask";
import "./functions/sendEmail";
import "./functions/submitSnippetEdit";
import "./functions/updateAnnualLeave";
import "./functions/updateEnquiryRating";
import "./functions/updateTransactions";

export default app;
