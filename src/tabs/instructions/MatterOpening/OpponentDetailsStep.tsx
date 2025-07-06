import React from "react";
import { Stack, TextField, Dropdown, IDropdownOption, Checkbox, PrimaryButton, Icon, FontIcon } from "@fluentui/react";
import { sharedPrimaryButtonStyles } from "../../../app/styles/ButtonStyles";
import "../../../app/styles/MultiSelect.css";
import BubbleTextField from "../../../app/styles/BubbleTextField";
import { useTheme } from "../../../app/functionality/ThemeContext";
import { countries } from "../../../data/referenceData";
import ModernMultiSelect from './ModernMultiSelect';

interface OpponentDetailsStepProps {
  opponentName: string;
  setOpponentName: (v: string) => void;
  opponentEmail: string;
  setOpponentEmail: (v: string) => void;
  opponentSolicitorName: string;
  setOpponentSolicitorName: (v: string) => void;
  opponentSolicitorCompany: string;
  setOpponentSolicitorCompany: (v: string) => void;
  opponentSolicitorEmail: string;
  setOpponentSolicitorEmail: (v: string) => void;
  noConflict: boolean;
  setNoConflict: (v: boolean) => void;
  disputeValue: string;
  setDisputeValue: (v: string) => void;
  setOpponentTitle?: (v: string) => void;
  opponentTitle?: string;
  setOpponentFirst?: (v: string) => void;
  opponentFirst?: string;
  setOpponentLast?: (v: string) => void;
  opponentLast?: string;
  setOpponentPhone?: (v: string) => void;
  opponentPhone?: string;
  setOpponentAddress?: (v: string) => void;
  opponentAddress?: string;
  opponentHasCompany?: boolean;
  setOpponentHasCompany?: (v: boolean) => void;
  opponentCompanyName?: string;
  setOpponentCompanyName?: (v: string) => void;
  opponentCompanyNumber?: string;
  setOpponentCompanyNumber?: (v: string) => void;
  // Solicitor fields
  setSolicitorTitle?: (v: string) => void;
  solicitorTitle?: string;
  setSolicitorFirst?: (v: string) => void;
  solicitorFirst?: string;
  setSolicitorLast?: (v: string) => void;
  solicitorLast?: string;
  setSolicitorPhone?: (v: string) => void;
  solicitorPhone?: string;
  setSolicitorAddress?: (v: string) => void;
  solicitorAddress?: string;
  solicitorCompanyNumber?: string;
  setSolicitorCompanyNumber?: (v: string) => void;
  // Choice tracking
  opponentChoiceMade?: boolean;
  setOpponentChoiceMade?: (v: boolean) => void;
  onContinue?: () => void; // <-- Add this line
}

const titleOptions: IDropdownOption[] = [
  { key: "", text: "Title" },
  // { key: "AI", text: "AI" }, // Hide AI from dropdown, but use as fallback
  { key: "Mr", text: "Mr" },
  { key: "Mrs", text: "Mrs" },
  { key: "Ms", text: "Ms" },
  { key: "Miss", text: "Miss" },
  { key: "Dr", text: "Dr" },
  { key: "Prof", text: "Prof" },
  { key: "Other", text: "Other" },
];

const containerStyle: React.CSSProperties = {
  background: "#F4F4F6",
  border: "none",
  borderRadius: 0,
  boxShadow: "0 2px 8px rgba(54, 144, 206, 0.07)",
  padding: "18px 18px 12px 18px",
  marginBottom: 14,
  marginTop: 4,
  transition: "box-shadow 0.2s, border-color 0.2s"
};

const answeredFieldStyle = {
  background: "#d6e8ff",
  color: "#061733",
  border: "1.5px solid #3690CE",
  borderRadius: 0,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  transition: "background 0.2s, color 0.2s, border 0.2s"
};
const unansweredFieldStyle = {
  background: "#fff",
  color: "#061733",
  border: "1px solid #e3e8ef",
  borderRadius: 0,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  transition: "background 0.2s, color 0.2s, border 0.2s"
};
// Pressed state mimics .navigatorPivot .ms-Pivot-link:active from NavigatorPivot.css
const pressedFieldStyle = {
  background: "rgba(0, 0, 0, 0.2)",
  color: "var(--helix-highlight, #3690CE)",
  border: "1.5px solid transparent", // Remove blue border
  borderRadius: 0,
  boxShadow: "inset 0 0 8px rgba(0, 0, 0, 0.3)",
  transform: "scale(0.97)",
  outline: "none"
};

const addressFields = [
  { id: "houseNumber", placeholder: "House/Building Number" },
  { id: "street", placeholder: "Street" },
  { id: "city", placeholder: "City/Town" },
  { id: "county", placeholder: "County" },
  { id: "postcode", placeholder: "Post Code" },
  { id: "country", placeholder: "Country" }
];

const dummyData = {
  opponentTitle: "AI",
  opponentFirst: "A. Placeholder",
  opponentLast: "Entity",
  opponentEmail: "ae@hlx.place",
  opponentPhone: "00000000000",
  opponentHouseNumber: "0",
  opponentStreet: "Trace Null Row",
  opponentCity: "Lowlight",
  opponentCounty: "Eidolonshire",
  opponentPostcode: "NX01 0AE",
  opponentCountry: "United Kingdom",
  opponentHasCompany: true,
  opponentCompanyName: "Phantom Entity Ltd",
  opponentCompanyNumber: "AE001",
  opponentSolicitorCompany: "Null Proxy LLP",
  solicitorCompanyNumber: "AE-LAW-00X",
  solicitorTitle: "AI",
  solicitorFirst: "A. Placeholder",
  solicitorLast: "Solicitor",
  opponentSolicitorEmail: "relay@hlx.place",
  solicitorPhone: "00000000001",
  solicitorHouseNumber: "1",
  solicitorStreet: "Obscura Street",
  solicitorCity: "Lowlight",
  solicitorCounty: "Eidolonshire",
  solicitorPostcode: "NX01 0AE",
  solicitorCountry: "United Kingdom"
};

const OpponentDetailsStep: React.FC<OpponentDetailsStepProps> = ({
  opponentName,
  setOpponentName,
  opponentEmail,
  setOpponentEmail,
  opponentSolicitorName,
  setOpponentSolicitorName,
  opponentSolicitorCompany,
  setOpponentSolicitorCompany,
  opponentSolicitorEmail,
  setOpponentSolicitorEmail,
  noConflict,
  setNoConflict,
  disputeValue,
  setDisputeValue,
  // New/extended props
  setOpponentTitle,
  opponentTitle,
  setOpponentFirst,
  opponentFirst,
  setOpponentLast,
  opponentLast,
  setOpponentPhone,
  opponentPhone,
  setOpponentAddress,
  opponentAddress,
  opponentHasCompany,
  setOpponentHasCompany,
  opponentCompanyName,
  setOpponentCompanyName,
  opponentCompanyNumber,
  setOpponentCompanyNumber,
  setSolicitorTitle,
  solicitorTitle,
  setSolicitorFirst,
  solicitorFirst,
  setSolicitorLast,
  solicitorLast,
  setSolicitorPhone,
  solicitorPhone,
  setSolicitorAddress,
  solicitorAddress,
  solicitorCompanyNumber,
  setSolicitorCompanyNumber,
  // Choice tracking
  opponentChoiceMade,
  setOpponentChoiceMade,
  onContinue, // <-- Add this line
}) => {
  // Local state for new fields if not provided by parent
  const [localOpponentTitle, setLocalOpponentTitle] = React.useState("");
  const [localOpponentFirst, setLocalOpponentFirst] = React.useState("");
  const [localOpponentLast, setLocalOpponentLast] = React.useState("");
  const [localOpponentPhone, setLocalOpponentPhone] = React.useState("");
  const [localOpponentAddress, setLocalOpponentAddress] = React.useState("");
  const [localOpponentHasCompany, setLocalOpponentHasCompany] = React.useState(false);
  const [localOpponentCompanyName, setLocalOpponentCompanyName] = React.useState("");
  const [localOpponentCompanyNumber, setLocalOpponentCompanyNumber] = React.useState("");
  const [localSolicitorTitle, setLocalSolicitorTitle] = React.useState("");
  const [localSolicitorFirst, setLocalSolicitorFirst] = React.useState("");
  const [localSolicitorLast, setLocalSolicitorLast] = React.useState("");
  const [localSolicitorPhone, setLocalSolicitorPhone] = React.useState("");
  const [localSolicitorAddress, setLocalSolicitorAddress] = React.useState("");
  const [localSolicitorCompanyNumber, setLocalSolicitorCompanyNumber] = React.useState("");

  // Add local state for address fields if not provided by parent
  const [localOpponentHouseNumber, setLocalOpponentHouseNumber] = React.useState("");
  const [localOpponentStreet, setLocalOpponentStreet] = React.useState("");
  const [localOpponentCity, setLocalOpponentCity] = React.useState("");
  const [localOpponentCounty, setLocalOpponentCounty] = React.useState("");
  const [localOpponentPostcode, setLocalOpponentPostcode] = React.useState("");
  const [localOpponentCountry, setLocalOpponentCountry] = React.useState("");

  const [localSolicitorHouseNumber, setLocalSolicitorHouseNumber] = React.useState("");
  const [localSolicitorStreet, setLocalSolicitorStreet] = React.useState("");
  const [localSolicitorCity, setLocalSolicitorCity] = React.useState("");
  const [localSolicitorCounty, setLocalSolicitorCounty] = React.useState("");
  const [localSolicitorPostcode, setLocalSolicitorPostcode] = React.useState("");
  const [localSolicitorCountry, setLocalSolicitorCountry] = React.useState("");

  // Use parent state if provided, else local state
  const _opponentTitle = opponentTitle ?? localOpponentTitle;
  const _setOpponentTitle = setOpponentTitle ?? setLocalOpponentTitle;
  const _opponentFirst = opponentFirst ?? localOpponentFirst;
  const _setOpponentFirst = setOpponentFirst ?? setLocalOpponentFirst;
  const _opponentLast = opponentLast ?? localOpponentLast;
  const _setOpponentLast = setOpponentLast ?? setLocalOpponentLast;
  const _opponentPhone = opponentPhone ?? localOpponentPhone;
  const _setOpponentPhone = setOpponentPhone ?? setLocalOpponentPhone;
  const _opponentAddress = opponentAddress ?? localOpponentAddress;
  const _setOpponentAddress = setOpponentAddress ?? setLocalOpponentAddress;
  const _opponentHasCompany = opponentHasCompany ?? localOpponentHasCompany;
  const _setOpponentHasCompany = setOpponentHasCompany ?? setLocalOpponentHasCompany;
  const _opponentCompanyName = opponentCompanyName ?? localOpponentCompanyName;
  const _setOpponentCompanyName = setOpponentCompanyName ?? setLocalOpponentCompanyName;
  const _opponentCompanyNumber = opponentCompanyNumber ?? localOpponentCompanyNumber;
  const _setOpponentCompanyNumber = setOpponentCompanyNumber ?? setLocalOpponentCompanyNumber;
  const _solicitorTitle = solicitorTitle ?? localSolicitorTitle;
  const _setSolicitorTitle = setSolicitorTitle ?? setLocalSolicitorTitle;
  const _solicitorFirst = solicitorFirst ?? localSolicitorFirst;
  const _setSolicitorFirst = setSolicitorFirst ?? setLocalSolicitorFirst;
  const _solicitorLast = solicitorLast ?? localSolicitorLast;
  const _setSolicitorLast = setSolicitorLast ?? setLocalSolicitorLast;
  const _solicitorPhone = solicitorPhone ?? localSolicitorPhone;
  const _setSolicitorPhone = setSolicitorPhone ?? setLocalSolicitorPhone;
  const _solicitorAddress = solicitorAddress ?? localSolicitorAddress;
  const _setSolicitorAddress = setSolicitorAddress ?? setLocalSolicitorAddress;
  const _solicitorCompanyNumber = solicitorCompanyNumber ?? localSolicitorCompanyNumber;
  const _setSolicitorCompanyNumber = setSolicitorCompanyNumber ?? setLocalSolicitorCompanyNumber;

  const { isDarkMode } = useTheme();

  // Add this function inside the component
  const fillDummyData = () => {
    // Don't change opponent type if already selected
    if (!opponentType) {
      setOpponentType('Company');
    }
    
    // Use AI as fallback if skipping/using dummy data
    _setOpponentTitle("AI");
    _setOpponentFirst(dummyData.opponentFirst);
    _setOpponentLast(dummyData.opponentLast);
    setOpponentEmail(dummyData.opponentEmail);
    _setOpponentPhone(dummyData.opponentPhone);
    setLocalOpponentHouseNumber(dummyData.opponentHouseNumber);
    setLocalOpponentStreet(dummyData.opponentStreet);
    setLocalOpponentCity(dummyData.opponentCity);
    setLocalOpponentCounty(dummyData.opponentCounty);
    setLocalOpponentPostcode(dummyData.opponentPostcode);
    setLocalOpponentCountry(dummyData.opponentCountry);
    // No need for _setOpponentHasCompany as it's replaced by opponentType
    _setOpponentCompanyName(dummyData.opponentCompanyName);
    _setOpponentCompanyNumber(dummyData.opponentCompanyNumber);

    setOpponentSolicitorCompany(dummyData.opponentSolicitorCompany);
    _setSolicitorCompanyNumber(dummyData.solicitorCompanyNumber);
    // Use AI as fallback if skipping/using dummy data
    _setSolicitorTitle("AI");
    _setSolicitorFirst(dummyData.solicitorFirst);
    _setSolicitorLast(dummyData.solicitorLast);
    setOpponentSolicitorEmail(dummyData.opponentSolicitorEmail);
    _setSolicitorPhone(dummyData.solicitorPhone);
    setLocalSolicitorHouseNumber(dummyData.solicitorHouseNumber);
    setLocalSolicitorStreet(dummyData.solicitorStreet);
    setLocalSolicitorCity(dummyData.solicitorCity);
    setLocalSolicitorCounty(dummyData.solicitorCounty);
    setLocalSolicitorPostcode(dummyData.solicitorPostcode);
    setLocalSolicitorCountry(dummyData.solicitorCountry);
  };

  // Add state to control summary mode
  const [showSummary, setShowSummary] = React.useState(false);
  // Toggle: does user want to enter opponent details now?
  const [enterOpponentNow, setEnterOpponentNow] = React.useState<null | boolean>(null);
  // Add new state for opponent type (Individual or Company)
  const [opponentType, setOpponentType] = React.useState<string>("");

  // Skip details and show summary (user can return to edit later)
  const skipAndShowSummary = () => {
    setShowSummary(true);
  };

  // Reset to editable mode
  const handleEdit = () => {
    setShowSummary(false);
  };

  // Helper to render a summary row (clean, compact)
  const SummaryRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{
      display: "flex",
      alignItems: "center",
      marginBottom: 2,
      fontSize: 14,
      color: "#2d3748"
    }}>
      <span style={{ minWidth: 110, color: "#6b7280", fontWeight: 400 }}>{label}</span>
      <span style={{ color: value ? "#222" : "#b0b7be", marginLeft: 8 }}>{value || <span>—</span>}</span>
    </div>
  );

  // Helper to render address summary (compact)
  const AddressSummary = (data: any) => (
    <div>
      <SummaryRow label="House/Building" value={data.houseNumber} />
      <SummaryRow label="Street" value={data.street} />
      <SummaryRow label="City/Town" value={data.city} />
      <SummaryRow label="County" value={data.county} />
      <SummaryRow label="Post Code" value={data.postcode} />
      <SummaryRow label="Country" value={data.country} />
    </div>
  );

  // Clean summary group with icon, label, and card background
  const SummaryGroup = ({
    iconName,
    label,
    children,
    style = {},
    forceWhite = false,
  }: {
    iconName: string;
    label: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    forceWhite?: boolean;
  }) => (
    <div
      style={{
        background: forceWhite ? "#fff" : "linear-gradient(90deg, #f4f7fb 80%, #eaf1fa 100%)",
        border: forceWhite ? "none" : "1.5px solid #b6c6e3",
        borderRadius: 0,
        boxShadow: forceWhite ? "none" : "0 2px 8px rgba(54, 144, 206, 0.07)",
        padding: "16px 18px 12px 18px",
        marginBottom: 14,
        marginTop: 4,
        transition: "box-shadow 0.2s, border-color 0.2s",
        ...style
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 10,
        fontSize: 15,
        color: "#3b5b7e"
      }}>
        <FontIcon iconName={iconName} style={{ fontSize: 18, marginRight: 10, color: "#6b8bbd" }} />
        <span style={{ fontWeight: 600, letterSpacing: 0.2 }}>{label}</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0 18px",
        }}
      >
        {children}
      </div>
    </div>
  );

  // Add local state for focus/blur/active for each field group
  const [activeField, setActiveField] = React.useState<string | null>(null);
  const [touchedFields, setTouchedFields] = React.useState<{ [key: string]: boolean }>({});

  // Helper to get field style
  function getFieldStyle(fieldKey: string, value: string, isDropdown = false) {
    const isActive = activeField === fieldKey;
    const isTouched = touchedFields[fieldKey];
    if (isActive) return pressedFieldStyle;
    if (isTouched && value) return answeredFieldStyle;
    return unansweredFieldStyle;
  }

  // Remove blue border on focus for all intake fields using inline style override
  // (for TextField, Dropdown, etc.)
  // Add this style to all fieldGroup and dropdown/title style objects:
  const noFocusOutline = {
    outline: "none",
    boxShadow: "none",
    borderColor: "transparent"
  };

  return (
    <Stack tokens={{ childrenGap: 8 }}>
      {/* Conflict of Interest Question */}
      <Stack tokens={{ childrenGap: 10 }} style={{ marginBottom: 0 }}>
        <ModernMultiSelect
          label="Confirm No Conflict of Interest"
          options={[
            { key: 'true', text: 'Confirmed - No Conflict' },
            { key: 'false', text: 'Not Confirmed' }
          ]}
          selectedValue={noConflict ? 'true' : 'false'}
          onSelectionChange={(value) => setNoConflict(value === 'true')}
          variant="binary"
        />
      </Stack>
      {/* Only show opponent/solicitor details if noConflict is confirmed */}
      {noConflict && (
        <>
          {/* Separator with equal spacing above and below - animated */}
          <div style={{ 
            height: 1, 
            background: '#e3e8ef', 
            margin: '18px 0',
            animation: 'separatorSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            opacity: 0,
            transform: 'scaleX(0)',
            transformOrigin: 'left center'
          }} />
          {/* Opponent Type Selection */}
          <div className="opponent-type-selection" style={{ width: '100%', margin: 0, padding: 0, border: 'none', boxShadow: 'none', background: 'transparent' }}>
            <div style={{ padding: 0, background: 'transparent' }}>
              <div 
                className="question-banner" 
                style={{ 
                  width: '100%', 
                  boxSizing: 'border-box', 
                  margin: 0, 
                  marginBottom: 20,
                  animation: 'questionSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  animationDelay: '200ms',
                  opacity: 0,
                  transform: 'translateY(15px)'
                }}
              >
                What type of opponent is this matter against?
              </div>
              <div 
                className="client-details-contact-bigrow" 
                style={{ 
                  marginBottom: 24, 
                  display: 'flex', 
                  gap: 8,
                  animation: 'buttonRowSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  animationDelay: '400ms',
                  opacity: 0,
                  transform: 'translateY(20px)'
                }}
              >
                {[ 
                  { type: 'Individual', icon: 'Contact' },
                  { type: 'Company', icon: 'CityNext' }
                ].map(({ type, icon }) => {
                  const isActive = opponentType === type;
                  return (
                    <button
                      key={type}
                      className={`client-details-contact-bigbtn client-type-icon-btn${isActive ? ' active' : ''}`}
                      type="button"
                      onClick={() => {
                        setOpponentType(type);
                        setShowSummary(false);
                      }}
                      aria-pressed={isActive}
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        minWidth: 76.8, // 20% increase from 64
                        minHeight: 76.8, // 20% increase from 64
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isActive ? '#3690CE22' : '#F4F4F6', // 22 transparency or helix grey
                        border: isActive ? '1px solid #3690CE' : '1px solid #e0e0e0', // 1px blue or light border
                        borderRadius: 0, // no rounded corners
                        boxShadow: undefined,
                        transition: 'background 0.2s, border 0.2s',
                        outline: 'none',
                      }}
                      onMouseDown={e => e.currentTarget.classList.add('pressed')}
                      onMouseUp={e => e.currentTarget.classList.remove('pressed')}
                      onMouseLeave={e => e.currentTarget.classList.remove('pressed')}
                    >
                      <span
                        className="client-type-icon"
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 32,
                          opacity: isActive ? 0 : 1,
                          transition: 'opacity 0.25s cubic-bezier(.4,0,.2,1), transform 0.25s cubic-bezier(.4,0,.2,1), color 0.2s',
                          zIndex: 1,
                          color: isActive ? '#3690CE' : '#6B6B6B', // blue if active, grey if not
                          pointerEvents: 'none',
                        }}
                      >
                        <i className={`ms-Icon ms-Icon--${icon}`} aria-hidden="true" style={{ pointerEvents: 'none', color: isActive ? '#3690CE' : '#6B6B6B', transition: 'color 0.2s' }} />
                      </span>
                      <span
                        className="client-type-label"
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: 16,
                          color: isActive ? '#3690CE' : '#6B6B6B',
                          opacity: isActive ? 1 : 0,
                          transform: isActive ? 'translateY(0)' : 'translateY(8px)',
                          transition: 'opacity 0.25s cubic-bezier(.4,0,.2,1), transform 0.25s cubic-bezier(.4,0,.2,1), color 0.2s',
                          zIndex: 2,
                          pointerEvents: 'none',
                        }}
                      >
                        {type}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <style>{`
                .opponent-type-selection .client-type-icon-btn .client-type-label {
                    pointer-events: none;
                }
                .opponent-type-selection .client-type-icon-btn:not(.active):not(.pressed):not(:active):hover {
                    background: #e3f0fc !important; /* subtle blue hover */
                    border-color: #3690CE !important;
                }
                .opponent-type-selection .client-type-icon-btn:not(.active):not(.pressed):not(:active):hover .client-type-icon,
                .opponent-type-selection .client-type-icon-btn:not(.active):not(.pressed):not(:active):hover .client-type-icon i {
                    color: #3690CE !important;
                }
                .opponent-type-selection .client-type-icon-btn:not(.active):not(.pressed):not(:active):hover .client-type-label {
                    color: #3690CE !important;
                }
                .opponent-type-selection .client-type-icon-btn.pressed,
                .opponent-type-selection .client-type-icon-btn:active {
                    background: #b3d3f7 !important; /* deeper blue for press */
                    border-color: #1565c0 !important;
                }
                /* Animation for smooth transitions */
                .opponent-type-selection .client-type-icon-btn {
                    transition: all 0.2s ease-out;
                }
                .opponent-type-selection .client-type-icon-btn.active .client-type-icon {
                    opacity: 0 !important;
                }
                .opponent-type-selection .client-type-icon-btn.active .client-type-label {
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                }
                
                /* Animation keyframes for opponent details entrance */
                @keyframes slideInFromTop {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes cascadeSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                /* Animated placeholders */
                @keyframes shimmer {
                    0% {
                        background-position: -200px 0;
                    }
                    100% {
                        background-position: calc(200px + 100%) 0;
                    }
                }
                
                .placeholder-shimmer {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200px 100%;
                    animation: shimmer 1.5s infinite;
                }
                
                /* Shimmer pass animation for placeholder banner */
                @keyframes shimmerPass {
                    0% {
                        left: -100%;
                        opacity: 0;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        left: 100%;
                        opacity: 0;
                    }
                }
                
                /* Separator slide in animation */
                @keyframes separatorSlideIn {
                    0% {
                        opacity: 0;
                        transform: scaleX(0);
                    }
                    100% {
                        opacity: 1;
                        transform: scaleX(1);
                    }
                }
                
                /* Question banner slide in animation */
                @keyframes questionSlideIn {
                    0% {
                        opacity: 0;
                        transform: translateY(15px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                /* Button row slide in animation */
                @keyframes buttonRowSlideIn {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
          </div>
          
          {/* Only show option to delay details entry if opponent type is selected */}
          {opponentType && (
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "stretch", 
              width: "100%",
              margin: "0 0 16px 0",
              animation: 'slideInFromTop 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              animationDelay: '0ms',
              opacity: 0,
              transform: 'translateY(20px)'
            }}>
              <ModernMultiSelect
                label="Opponent Details"
                options={[
                  { key: 'true', text: 'I have Opponent Details to enter' },
                  { key: 'false', text: "I'll enter opponent details later" }
                ]}
                selectedValue={enterOpponentNow === null ? null : (enterOpponentNow ? 'true' : 'false')}
                onSelectionChange={(value) => {
                  const willEnter = value === 'true';
                  setEnterOpponentNow(willEnter);
                  if (willEnter) {
                    setShowSummary(false);
                  } else {
                    setShowSummary(true);
                    fillDummyData();
                  }
                  if (setOpponentChoiceMade) setOpponentChoiceMade(true);
                }}
                variant="binary"
              />
            </div>
          )}
          
          {/* Only show details if user wants to enter them now */}
          {enterOpponentNow === true ? (
            <div style={{
              animation: 'cascadeSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              animationDelay: '150ms',
              opacity: 0,
              transform: 'translateY(20px)'
            }}>
              {/* Opponent Details Fields */}
              <div style={containerStyle}>
                <Stack tokens={{ childrenGap: 6 }}>
                  {/* Section Header */}
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: 15, 
                    marginBottom: 8, 
                    color: '#061733'
                  }}>
                    Opponent
                  </div>
                  {/* Company sublabel - shown first for Company opponent type */}
                  {opponentType === 'Company' && (
                    <>
                      <div style={{ fontWeight: 600, marginBottom: 4, marginTop: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="ms-Icon ms-Icon--CityNext" style={{ fontSize: 18, color: '#6b8bbd', marginRight: 4 }} />
                        Company
                      </div>
                      {/* Company fields */}
                      <Stack horizontal tokens={{ childrenGap: 5 }} style={{ marginBottom: 8, width: "100%" }}>
                        <TextField
                          placeholder="Company Name"
                          value={_opponentCompanyName}
                          onChange={(_, v) => _setOpponentCompanyName(v || "")}
                          styles={{
                            root: {
                              flex: 1,
                              minWidth: 180,
                              height: 38,
                              ...(touchedFields["opponentCompanyName"] && _opponentCompanyName ? answeredFieldStyle : unansweredFieldStyle)
                            },
                            fieldGroup: {
                              borderRadius: 0,
                              height: 38,
                              background: "transparent",
                              border: "none"
                            },
                            field: {
                              color: "#061733",
                              background: "transparent"
                            }
                          }}
                          onFocus={() => setActiveField("opponentCompanyName")}
                          onBlur={() => {
                            setActiveField(null);
                            setTouchedFields((prev) => ({ ...prev, opponentCompanyName: true }));
                          }}
                        />
                        <TextField
                          placeholder="Company Number"
                          value={_opponentCompanyNumber}
                          onChange={(_, v) => _setOpponentCompanyNumber(v || "")}
                          styles={{
                            root: {
                              flex: 1,
                              minWidth: 140,
                              height: 38,
                              ...(touchedFields["opponentCompanyNumber"] && _opponentCompanyNumber ? answeredFieldStyle : unansweredFieldStyle)
                            },
                            fieldGroup: {
                              borderRadius: 0,
                              height: 38,
                              background: "transparent",
                              border: "none"
                            },
                            field: {
                              color: "#061733",
                              background: "transparent"
                            }
                          }}
                          onFocus={() => setActiveField("opponentCompanyNumber")}
                          onBlur={() => {
                            setActiveField(null);
                            setTouchedFields((prev) => ({ ...prev, opponentCompanyNumber: true }));
                          }}
                        />
                      </Stack>
                    </>
                  )}
                  {/* Name sublabel */}
                  <div style={{ fontWeight: 600, marginBottom: 4, marginTop: opponentType === 'Company' ? 8 : 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="ms-Icon ms-Icon--ContactInfo" style={{ fontSize: 18, color: '#6b8bbd', marginRight: 4 }} />
                    Name
                  </div>
                  <Stack horizontal tokens={{ childrenGap: 5 }} style={{ marginBottom: 8, width: "100%" }}>
                    <Dropdown
                      placeholder="Title"
                      options={titleOptions}
                      selectedKey={_opponentTitle}
                      onChange={(_, o) => _setOpponentTitle(o?.key as string)}
                      styles={{
                        root: {
                          flex: '0 0 20%',
                          minWidth: 80,
                          maxWidth: '20%',
                          height: 38,
                          alignSelf: 'flex-end',
                          ...getFieldStyle("opponentTitle", _opponentTitle, true)
                        },
                        dropdown: { borderRadius: 0, height: 38, background: "transparent", ...noFocusOutline },
                        title: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          color: "#061733",
                          display: 'flex',
                          alignItems: 'center',
                          ...noFocusOutline
                        }
                      }}
                      calloutProps={{ styles: { calloutMain: { borderRadius: 0 } } }}
                      onFocus={() => setActiveField("opponentTitle")}
                      onBlur={() => {
                        setActiveField(null);
                        setTouchedFields((prev) => ({ ...prev, opponentTitle: true }));
                      }}
                    />
                    <TextField
                      placeholder="First Name"
                      value={_opponentFirst}
                      onChange={(_, v) => _setOpponentFirst(v || "")}
                      styles={{
                        root: {
                          flex: '0 0 40%',
                          minWidth: 100,
                          maxWidth: '40%',
                          height: 38,
                          ...getFieldStyle("opponentFirst", _opponentFirst)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none",
                          ...noFocusOutline
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                      onFocus={() => setActiveField("opponentFirst")}
                      onBlur={() => {
                        setActiveField(null);
                        setTouchedFields((prev) => ({ ...prev, opponentFirst: true }));
                      }}
                    />
                    <TextField
                      placeholder="Last Name"
                      value={_opponentLast}
                      onChange={(_, v) => _setOpponentLast(v || "")}
                      styles={{
                        root: {
                          flex: '0 0 40%',
                          minWidth: 100,
                          maxWidth: '40%',
                          height: 38,
                          ...getFieldStyle("opponentLast", _opponentLast)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none",
                          ...noFocusOutline
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                      onFocus={() => setActiveField("opponentLast")}
                      onBlur={() => {
                        setActiveField(null);
                        setTouchedFields((prev) => ({ ...prev, opponentLast: true }));
                      }}
                    />
                  </Stack>
                  {/* Separator before Contact Details */}
                  <div style={{ height: 1, background: '#e3e8ef', margin: '12px 0 4px 0' }} />
                  {/* Contact Details sublabel (icon-labeled only) */}
                  <div style={{ fontWeight: 600, marginBottom: 4, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="ms-Icon ms-Icon--Mail" style={{ fontSize: 18, color: '#6b8bbd', marginRight: 4 }} />
                    Contact Details
                  </div>
                  <Stack horizontal tokens={{ childrenGap: 5 }} style={{ marginBottom: 8, width: "100%" }}>
                    <TextField
                      placeholder="Email"
                      value={opponentEmail}
                      onChange={(_, v) => setOpponentEmail(v || "")}
                      styles={{
                        root: {
                          flex: 1,
                          minWidth: 0,
                          maxWidth: 'none',
                          height: 38,
                          ...getFieldStyle("opponentEmail", opponentEmail)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none",
                          ...noFocusOutline
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                      onFocus={() => setActiveField("opponentEmail")}
                      onBlur={() => {
                        setActiveField(null);
                        setTouchedFields((prev) => ({ ...prev, opponentEmail: true }));
                      }}
                    />
                    <TextField
                      placeholder="Phone"
                      value={_opponentPhone}
                      onChange={(_, v) => _setOpponentPhone(v || "")}
                      styles={{
                        root: {
                          flex: 1,
                          minWidth: 0,
                          maxWidth: 'none',
                          height: 38,
                          ...getFieldStyle("opponentPhone", _opponentPhone)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none",
                          ...noFocusOutline
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                      onFocus={() => setActiveField("opponentPhone")}
                      onBlur={() => {
                        setActiveField(null);
                        setTouchedFields((prev) => ({ ...prev, opponentPhone: true }));
                      }}
                    />
                  </Stack>
                  {/* Separator before Address */}
                  <div style={{ height: 1, background: '#e3e8ef', margin: '12px 0 4px 0' }} />
                  {/* Address sublabel (icon-labeled only) */}
                  <div style={{ fontWeight: 600, marginBottom: 4, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="ms-Icon ms-Icon--Home" style={{ fontSize: 18, color: '#6b8bbd', marginRight: 4 }} />
                    Address
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, marginBottom: 8 }}>
                    <TextField
                      placeholder="House/Building Number"
                      value={localOpponentHouseNumber}
                      onChange={(_, v) => setLocalOpponentHouseNumber(v || "")}
                      styles={{
                        root: {
                          minWidth: 80,
                          flex: 1,
                          height: 38,
                          ...getFieldStyle("opponentHouseNumber", localOpponentHouseNumber)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none",
                          ...noFocusOutline
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                    onFocus={() => setActiveField("opponentHouseNumber")}
                    onBlur={() => {
                      setActiveField(null);
                      setTouchedFields((prev) => ({ ...prev, opponentHouseNumber: true }));
                    }}
                    />
                    <TextField
                      placeholder="Street"
                      value={localOpponentStreet}
                      onChange={(_, v) => setLocalOpponentStreet(v || "")}
                      styles={{
                        root: {
                          minWidth: 100,
                          flex: 1,
                          height: 38,
                          ...getFieldStyle("opponentStreet", localOpponentStreet)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none",
                          ...noFocusOutline
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                    onFocus={() => setActiveField("opponentStreet")}
                    onBlur={() => {
                      setActiveField(null);
                      setTouchedFields((prev) => ({ ...prev, opponentStreet: true }));
                    }}
                    />
                    <TextField
                      placeholder="City/Town"
                      value={localOpponentCity}
                      onChange={(_, v) => setLocalOpponentCity(v || "")}
                      styles={{
                        root: {
                          minWidth: 100,
                          flex: 1,
                          height: 38,
                          ...getFieldStyle("opponentCity", localOpponentCity)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none",
                          ...noFocusOutline
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                    onFocus={() => setActiveField("opponentCity")}
                    onBlur={() => {
                      setActiveField(null);
                      setTouchedFields((prev) => ({ ...prev, opponentCity: true }));
                    }}
                    />
                    <TextField
                      placeholder="County"
                      value={localOpponentCounty}
                      onChange={(_, v) => setLocalOpponentCounty(v || "")}
                      styles={{
                        root: {
                          minWidth: 80,
                          flex: 1,
                          height: 38,
                          ...getFieldStyle("opponentCounty", localOpponentCounty)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none",
                          ...noFocusOutline
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                    onFocus={() => setActiveField("opponentCounty")}
                    onBlur={() => {
                      setActiveField(null);
                      setTouchedFields((prev) => ({ ...prev, opponentCounty: true }));
                    }}
                    />
                    <TextField
                      placeholder="Post Code"
                      value={localOpponentPostcode}
                      onChange={(_, v) => setLocalOpponentPostcode(v || "")}
                      styles={{
                        root: {
                          minWidth: 80,
                          flex: 1,
                          height: 38,
                          ...getFieldStyle("opponentPostcode", localOpponentPostcode)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none",
                          ...noFocusOutline
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                    onFocus={() => setActiveField("opponentPostcode")}
                    onBlur={() => {
                      setActiveField(null);
                      setTouchedFields((prev) => ({ ...prev, opponentPostcode: true }));
                    }}
                    />
                    {/* Country dropdown */}
                    <Dropdown
                      placeholder="Country"
                      options={countries.map((c: { name: string; code: string }) => ({
                        key: c.name,
                        text: `${c.name} (${c.code})`
                      }))}
                      selectedKey={localOpponentCountry}
                      onChange={(_, o) => setLocalOpponentCountry(o?.key as string || "")}
                      styles={{
                        root: {
                          minWidth: 100,
                          flex: 1,
                          height: 38,
                          alignSelf: 'flex-end',
                          ...getFieldStyle("opponentCountry", localOpponentCountry, true)
                        },
                        dropdown: { borderRadius: 0, height: 38, background: "transparent", ...noFocusOutline },
                        title: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          color: "#061733",
                          display: 'flex',
                          alignItems: 'center',
                          ...noFocusOutline
                        }
                      }}
                      calloutProps={{ styles: { calloutMain: { borderRadius: 0 } } }}
                      onFocus={() => setActiveField("opponentCountry")}
                      onBlur={() => {
                        setActiveField(null);
                        setTouchedFields((prev) => ({ ...prev, opponentCountry: true }));
                      }}
                    />
                  </div>
                </Stack>
              </div>
              
              {/* Opponent's Solicitor Section */}
              <div style={containerStyle}>
                <Stack tokens={{ childrenGap: 6 }}>
                  {/* Section Header */}
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: 15, 
                    marginBottom: 8, 
                    color: '#061733'
                  }}>
                    Opponent's Solicitor
                  </div>
                  {/* Name & Company sublabel */}
                  <div style={{ fontWeight: 600, marginBottom: 4, marginTop: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="ms-Icon ms-Icon--ContactInfo" style={{ fontSize: 18, color: '#6b8bbd', marginRight: 4 }} />
                    Name & Company
                  </div>
                  <Stack horizontal tokens={{ childrenGap: 5 }} style={{ width: "100%", marginBottom: 8 }}>
                    <TextField
                      placeholder="Company Name"
                      value={opponentSolicitorCompany}
                      onChange={(_, v) => setOpponentSolicitorCompany(v || "")}
                      styles={{
                        root: {
                          flex: 1,
                          minWidth: 180,
                          height: 38,
                          ...(touchedFields["opponentSolicitorCompany"] && opponentSolicitorCompany ? answeredFieldStyle : unansweredFieldStyle)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none",
                          ...noFocusOutline
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                      onFocus={() => setActiveField("opponentSolicitorCompany")}
                      onBlur={() => {
                        setActiveField(null);
                        setTouchedFields((prev) => ({ ...prev, opponentSolicitorCompany: true }));
                      }}
                    />
                    <TextField
                      placeholder="Company Number"
                      value={_solicitorCompanyNumber}
                      onChange={(_, v) => _setSolicitorCompanyNumber(v || "")}
                      styles={{
                        root: {
                          flex: 1,
                          minWidth: 140,
                          height: 38,
                          ...(touchedFields["solicitorCompanyNumber"] && _solicitorCompanyNumber ? answeredFieldStyle : unansweredFieldStyle)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none",
                          ...noFocusOutline
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                      onFocus={() => setActiveField("solicitorCompanyNumber")}
                      onBlur={() => {
                        setActiveField(null);
                        setTouchedFields((prev) => ({ ...prev, solicitorCompanyNumber: true }));
                      }}
                    />
                  </Stack>
                  <Stack horizontal tokens={{ childrenGap: 5 }} style={{ marginBottom: 8, width: "100%" }}>
                    <Dropdown
                      placeholder="Title"
                      options={titleOptions}
                      selectedKey={_solicitorTitle}
                      onChange={(_, o) => _setSolicitorTitle(o?.key as string)}
                      styles={{
                        root: {
                          flex: '0 0 20%',
                          minWidth: 80,
                          maxWidth: '20%',
                          height: 38,
                          alignSelf: 'flex-end',
                          ...getFieldStyle("solicitorTitle", _solicitorTitle, true)
                        },
                        dropdown: { borderRadius: 0, height: 38, background: "transparent", ...noFocusOutline },
                        title: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          color: "#061733",
                          display: 'flex',
                          alignItems: 'center',
                          ...noFocusOutline
                        }
                      }}
                      calloutProps={{ styles: { calloutMain: { borderRadius: 0 } } }}
                      onFocus={() => setActiveField("solicitorTitle")}
                      onBlur={() => {
                        setActiveField(null);
                        setTouchedFields((prev) => ({ ...prev, solicitorTitle: true }));
                      }}
                    />
                    <TextField
                      placeholder="First Name"
                      value={_solicitorFirst}
                      onChange={(_, v) => _setSolicitorFirst(v || "")}
                      styles={{
                        root: {
                          flex: '0 0 40%',
                          minWidth: 100,
                          maxWidth: '40%',
                          height: 38,
                          ...getFieldStyle("solicitorFirst", _solicitorFirst)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none",
                          ...noFocusOutline
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                      onFocus={() => setActiveField("solicitorFirst")}
                      onBlur={() => {
                        setActiveField(null);
                        setTouchedFields((prev) => ({ ...prev, solicitorFirst: true }));
                      }}
                    />
                    <TextField
                      placeholder="Last Name"
                      value={_solicitorLast}
                      onChange={(_, v) => _setSolicitorLast(v || "")}
                      styles={{
                        root: {
                          flex: '0 0 40%',
                          minWidth: 100,
                          maxWidth: '40%',
                          height: 38,
                          ...getFieldStyle("solicitorLast", _solicitorLast)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none",
                          ...noFocusOutline
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                      onFocus={() => setActiveField("solicitorLast")}
                      onBlur={() => {
                        setActiveField(null);
                        setTouchedFields((prev) => ({ ...prev, solicitorLast: true }));
                      }}
                    />
                  </Stack>
                  {/* Separator before Contact Details */}
                  <div style={{ height: 1, background: '#e3e8ef', margin: '12px 0 4px 0' }} />
                  {/* Contact Details sublabel */}
                  <div style={{ fontWeight: 600, marginBottom: 4, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="ms-Icon ms-Icon--Mail" style={{ fontSize: 18, color: '#6b8bbd', marginRight: 4 }} />
                    Contact Details
                  </div>
                  <Stack horizontal tokens={{ childrenGap: 5 }} style={{ marginBottom: 8, width: "100%" }}>
                    <TextField
                      placeholder="Email"
                      value={opponentSolicitorEmail}
                      onChange={(_, v) => setOpponentSolicitorEmail(v || "")}
                      styles={{
                        root: {
                          flex: 1,
                          minWidth: 0,
                          maxWidth: 'none',
                          height: 38,
                          ...getFieldStyle("opponentSolicitorEmail", opponentSolicitorEmail)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none",
                          ...noFocusOutline
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                      onFocus={() => setActiveField("opponentSolicitorEmail")}
                      onBlur={() => {
                        setActiveField(null);
                        setTouchedFields((prev) => ({ ...prev, opponentSolicitorEmail: true }));
                      }}
                    />
                    <TextField
                      placeholder="Phone"
                      value={_solicitorPhone}
                      onChange={(_, v) => _setSolicitorPhone(v || "")}
                      styles={{
                        root: {
                          flex: 1,
                          minWidth: 0,
                          maxWidth: 'none',
                          height: 38,
                          ...getFieldStyle("solicitorPhone", _solicitorPhone)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none",
                          ...noFocusOutline
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                      onFocus={() => setActiveField("solicitorPhone")}
                      onBlur={() => {
                        setActiveField(null);
                        setTouchedFields((prev) => ({ ...prev, solicitorPhone: true }));
                      }}
                    />
                  </Stack>
                  {/* Separator before Address */}
                  <div style={{ height: 1, background: '#e3e8ef', margin: '12px 0 4px 0' }} />
                  {/* Address sublabel */}
                  <div style={{ fontWeight: 600, marginBottom: 4, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="ms-Icon ms-Icon--Home" style={{ fontSize: 18, color: '#6b8bbd', marginRight: 4 }} />
                    Address
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, marginBottom: 8 }}>
                    <TextField
                      placeholder="House/Building Number"
                      value={localSolicitorHouseNumber}
                      onChange={(_, v) => setLocalSolicitorHouseNumber(v || "")}
                      styles={{
                        root: {
                          minWidth: 80,
                          flex: 1,
                          height: 38,
                          ...getFieldStyle("solicitorHouseNumber", localSolicitorHouseNumber)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none"
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                    onFocus={() => setActiveField("solicitorHouseNumber")}
                    onBlur={() => {
                      setActiveField(null);
                      setTouchedFields((prev) => ({ ...prev, solicitorHouseNumber: true }));
                    }}
                    />
                    <TextField
                      placeholder="Street"
                      value={localSolicitorStreet}
                      onChange={(_, v) => setLocalSolicitorStreet(v || "")}
                      styles={{
                        root: {
                          minWidth: 100,
                          flex: 1,
                          height: 38,
                          ...getFieldStyle("solicitorStreet", localSolicitorStreet)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none"
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                    onFocus={() => setActiveField("solicitorStreet")}
                    onBlur={() => {
                      setActiveField(null);
                      setTouchedFields((prev) => ({ ...prev, solicitorStreet: true }));
                    }}
                    />
                    <TextField
                      placeholder="City/Town"
                      value={localSolicitorCity}
                      onChange={(_, v) => setLocalSolicitorCity(v || "")}
                      styles={{
                        root: {
                          minWidth: 100,
                          flex: 1,
                          height: 38,
                          ...getFieldStyle("solicitorCity", localSolicitorCity)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none"
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                    onFocus={() => setActiveField("solicitorCity")}
                    onBlur={() => {
                      setActiveField(null);
                      setTouchedFields((prev) => ({ ...prev, solicitorCity: true }));
                    }}
                    />
                    <TextField
                      placeholder="County"
                      value={localSolicitorCounty}
                      onChange={(_, v) => setLocalSolicitorCounty(v || "")}
                      styles={{
                        root: {
                          minWidth: 80,
                          flex: 1,
                          height: 38,
                          ...getFieldStyle("solicitorCounty", localSolicitorCounty)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none"
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                    onFocus={() => setActiveField("solicitorCounty")}
                    onBlur={() => {
                      setActiveField(null);
                      setTouchedFields((prev) => ({ ...prev, solicitorCounty: true }));
                    }}
                    />
                    <TextField
                      placeholder="Post Code"
                      value={localSolicitorPostcode}
                      onChange={(_, v) => setLocalSolicitorPostcode(v || "")}
                      styles={{
                        root: {
                          minWidth: 80,
                          flex: 1,
                          height: 38,
                          ...getFieldStyle("solicitorPostcode", localSolicitorPostcode)
                        },
                        fieldGroup: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          border: "none"
                        },
                        field: {
                          color: "#061733",
                          background: "transparent"
                        }
                      }}
                    onFocus={() => setActiveField("solicitorPostcode")}
                    onBlur={() => {
                      setActiveField(null);
                      setTouchedFields((prev) => ({ ...prev, solicitorPostcode: true }));
                    }}
                    />
                    {/* Country dropdown */}
                    <Dropdown
                      placeholder="Country"
                      options={countries.map((c: { name: string; code: string }) => ({
                        key: c.name,
                        text: `${c.name} (${c.code})`
                      }))}
                      selectedKey={localSolicitorCountry}
                      onChange={(_, o) => setLocalSolicitorCountry(o?.key as string || "")}
                      styles={{
                        root: {
                          minWidth: 100,
                          flex: 1,
                          height: 38,
                          alignSelf: 'flex-end',
                          ...getFieldStyle("solicitorCountry", localSolicitorCountry, true)
                        },
                        dropdown: { borderRadius: 0, height: 38, background: "transparent", ...noFocusOutline },
                        title: {
                          borderRadius: 0,
                          height: 38,
                          background: "transparent",
                          color: "#061733",
                          display: 'flex',
                          alignItems: 'center',
                          ...noFocusOutline
                        }
                      }}
                      calloutProps={{ styles: { calloutMain: { borderRadius: 0 } } }}
                      onFocus={() => setActiveField("solicitorCountry")}
                      onBlur={() => {
                        setActiveField(null);
                        setTouchedFields((prev) => ({ ...prev, solicitorCountry: true }));
                      }}
                    />
                  </div>
                </Stack>
              </div>
            </div>
          ) : enterOpponentNow === false ? (
            <>
              {/* Animated placeholder banner */}
              <div style={{
                animation: 'slideInFromTop 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                opacity: 0,
                transform: 'translateY(20px)',
                marginBottom: 16
              }}>
                <div className="question-banner" style={{
                  background: '#fffbe6',
                  border: '2px solid #FFB900',
                  borderRadius: 0,
                  padding: '12px 16px',
                  color: '#b88600',
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: 20, 
                    height: 20, 
                    background: '#FFB900', 
                    borderRadius: '50%',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    i
                  </span>
                  Using placeholder values for opponent details. You'll be prompted to update these later.
                  {/* Subtle shimmer effect */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'shimmerPass 2s ease-in-out',
                    pointerEvents: 'none'
                  }} />
                </div>
              </div>
              {/* Old info bar removed - using new animated banner instead */}
            </>
          ) : null}
        </>
      )}
      {onContinue && (
        <PrimaryButton
          text="Continue"
          onClick={onContinue}
          disabled={!noConflict}
          styles={sharedPrimaryButtonStyles}
        />
      )}
    </Stack>
  );
};

export default OpponentDetailsStep;
