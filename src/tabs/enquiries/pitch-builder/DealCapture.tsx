import React, { useCallback, useMemo } from 'react';
import { TextField } from '@fluentui/react';
// Removed calculator icon for cleaner alignment of fee field
import { colours } from '../../../app/styles/colours';

/** Props for DealCapture component */
export interface DealCaptureProps {
  isDarkMode: boolean;
  scopeDescription: string;
  onScopeChange: (value: string) => void;
  amount: string; // raw numeric string
  onAmountChange: (value: string) => void;
  amountError?: string | null;
}

/** Compact, theme‑aware deal capture (scope + fee + VAT breakdown). */
export const DealCapture: React.FC<DealCaptureProps> = ({
  isDarkMode,
  scopeDescription,
  onScopeChange,
  amount,
  onAmountChange,
  amountError,
}) => {
  const bg = isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground;
  const border = isDarkMode ? colours.dark.border : '#E2E8F0';
  const text = isDarkMode ? colours.dark.text : colours.light.text;
  const subtle = isDarkMode ? '#94a3b8' : '#64748B';
  const accent = isDarkMode ? '#60A5FA' : '#3690CE';

  const handleScope = useCallback((ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, v?: string) => {
    onScopeChange(v || '');
  }, [onScopeChange]);

  const handleAmount = useCallback((ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, v?: string) => {
    const raw = (v || '').replace(/[^0-9.]/g, '');
    onAmountChange(raw);
  }, [onAmountChange]);

  const vatInfo = useMemo(() => {
    const n = parseFloat(amount);
    if (!amount || isNaN(n)) return null;
    const vat = +(n * 0.2).toFixed(2);
    const total = +(n + vat).toFixed(2);
    const fmt = (x: number) => `£${x.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return { ex: fmt(n), vat: fmt(vat), total: fmt(total) };
  }, [amount]);

  const adjust = (delta: number) => {
    const n = parseFloat(amount) || 0;
    const next = Math.max(0, n + delta);
    onAmountChange(next.toString());
  };

  return (
    <div style={{
      background: isDarkMode
        ? 'linear-gradient(135deg, rgba(5, 12, 26, 0.98) 0%, rgba(9, 22, 44, 0.94) 52%, rgba(13, 35, 63, 0.9) 100%)'
        : 'linear-gradient(135deg, rgba(248, 250, 252, 0.96) 0%, rgba(255, 255, 255, 0.94) 100%)',
      border: `1px solid ${isDarkMode ? 'rgba(125, 211, 252, 0.24)' : 'rgba(148, 163, 184, 0.22)'}`,
      borderRadius: 16,
      padding: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      boxShadow: isDarkMode 
        ? '0 18px 32px rgba(2, 6, 17, 0.58)' 
        : '0 12px 28px rgba(13, 47, 96, 0.12)',
      position: 'relative',
      backdropFilter: 'blur(12px)',
      animation: 'cascadeIn 0.4s ease-out'
    }}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <label style={{
          fontSize: 16,
          fontWeight: 600,
          color: isDarkMode ? '#E0F2FE' : '#0F172A',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          Scope & Quote Description <span style={{ color: colours.red, fontSize: 12 }}>*</span>
        </label>
        <TextField
          multiline
          autoAdjustHeight
          rows={4}
          value={scopeDescription}
          onChange={handleScope}
          placeholder="Describe the scope of work..."
          styles={{
            field:{
              fontSize:15,
              lineHeight:1.55,
              background: 'transparent',
              color: isDarkMode ? '#E0F2FE' : '#0F172A',
              fontFamily:'inherit',
              padding:'18px 20px',
              border: 'none',
              borderRadius: 10,
              selectors:{
                '::placeholder':{ color: isDarkMode ? '#94A3B8' : '#64748B' }
              }
            },
            fieldGroup:{
              border:`1px solid ${isDarkMode ? 'rgba(125, 211, 252, 0.24)' : 'rgba(148, 163, 184, 0.3)'}`,
              borderRadius:10,
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(7, 16, 32, 0.94) 0%, rgba(11, 30, 55, 0.88) 100%)'
                : 'linear-gradient(135deg, rgba(248, 250, 252, 0.96) 0%, rgba(255, 255, 255, 0.92) 100%)',
              overflow: 'hidden',
              selectors:{
                ':hover':{ 
                  borderColor: isDarkMode ? '#60A5FA' : '#3690CE',
                  transition: 'border-color 0.2s ease'
                },
                '.is-focused':{ 
                  borderColor: isDarkMode ? '#60A5FA' : '#3690CE', 
                  boxShadow: isDarkMode
                    ? '0 0 0 4px rgba(96, 165, 250, 0.2)'
                    : '0 0 0 4px rgba(54, 144, 206, 0.15)',
                  outline: 'none'
                }
              }
            },
            wrapper:{
              borderRadius:10
            }
          }}
        />
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <div style={{ width:'100%' }}>
          <label style={{
            fontSize:15,
            fontWeight:600,
            color: isDarkMode ? '#E0F2FE' : '#0F172A',
            marginBottom:8,
            display:'flex',
            alignItems:'center',
            gap:6
          }}>
            Confirm Amount <span style={{ color: colours.red, fontSize: 11 }}>*</span>
          </label>
          <div 
            style={{
              border:`1px solid ${isDarkMode ? 'rgba(125, 211, 252, 0.24)' : 'rgba(148, 163, 184, 0.3)'}`,
              borderRadius:12,
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(7, 16, 32, 0.94) 0%, rgba(11, 30, 55, 0.88) 100%)'
                : 'linear-gradient(135deg, rgba(248, 250, 252, 0.96) 0%, rgba(255, 255, 255, 0.92) 100%)',
              display:'flex',
              alignItems:'stretch',
              minHeight: 62,
              transition:'all .2s ease',
              boxShadow: isDarkMode
                ? '0 8px 16px rgba(4, 9, 20, 0.5)'
                : '0 4px 12px rgba(13, 47, 96, 0.1)',
              backdropFilter: 'blur(6px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = isDarkMode ? '#60A5FA' : '#3690CE';
              e.currentTarget.style.boxShadow = isDarkMode
                ? '0 12px 24px rgba(96, 165, 250, 0.25)'
                : '0 8px 20px rgba(54, 144, 206, 0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(125, 211, 252, 0.24)' : 'rgba(148, 163, 184, 0.3)';
              e.currentTarget.style.boxShadow = isDarkMode
                ? '0 8px 16px rgba(4, 9, 20, 0.5)'
                : '0 4px 12px rgba(13, 47, 96, 0.1)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = isDarkMode ? '#60A5FA' : '#3690CE';
              e.currentTarget.style.boxShadow = isDarkMode
                ? '0 0 0 4px rgba(96, 165, 250, 0.2), 0 12px 24px rgba(96, 165, 250, 0.25)'
                : '0 0 0 4px rgba(54, 144, 206, 0.15), 0 8px 20px rgba(54, 144, 206, 0.18)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(125, 211, 252, 0.24)' : 'rgba(148, 163, 184, 0.3)';
              e.currentTarget.style.boxShadow = isDarkMode
                ? '0 8px 16px rgba(4, 9, 20, 0.5)'
                : '0 4px 12px rgba(13, 47, 96, 0.1)';
            }}
          >
            <div style={{
              display:'flex',
              alignItems:'center',
              paddingLeft:16,
              paddingRight:12,
              paddingTop: 4,
              paddingBottom: 4,
              fontSize:18,
              fontWeight:600,
              color: isDarkMode ? '#60A5FA' : '#3690CE',
              borderRight:`1px solid ${isDarkMode ? 'rgba(125, 211, 252, 0.24)' : 'rgba(148, 163, 184, 0.3)'}`
            }}>
              £
            </div>
            <TextField
              value={amount}
              onChange={handleAmount}
              placeholder="1500"
              errorMessage={amountError || undefined}
              styles={{
                root:{ flex:1 },
                field:{
                  fontSize:20,
                  fontWeight:600,
                  background:'transparent',
                  color: isDarkMode ? '#E0F2FE' : '#0F172A',
                  fontFamily:'inherit',
                  padding:'20px 16px',
                  border:'none',
                  minHeight: 60
                },
                fieldGroup:{
                  border:'none',
                  borderRadius:0,
                  background:'transparent',
                  minHeight: 60
                }
              }}
            />
            <div style={{
              display:'flex',
              alignItems:'center',
              gap:2,
              paddingRight:8,
              paddingTop: 4,
              paddingBottom: 4,
              borderLeft:`1px solid ${isDarkMode ? 'rgba(125, 211, 252, 0.24)' : 'rgba(148, 163, 184, 0.3)'}`
            }}>
              <button type="button" onClick={() => adjust(50)} style={integratedButton(isDarkMode, true)}>+50</button>
              <button type="button" onClick={() => adjust(-50)} style={integratedButton(isDarkMode, false)}>-50</button>
            </div>
          </div>
          <div style={{ marginTop:8, fontSize:12, lineHeight:1.4, color: isDarkMode ? '#94A3B8' : '#64748B' }}>
            Fee excluding VAT. Use +50/-50 to adjust.
          </div>
        </div>

        {vatInfo && (
          <div style={{
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(7, 16, 32, 0.92) 0%, rgba(11, 30, 55, 0.86) 100%)'
              : 'linear-gradient(135deg, rgba(248, 250, 252, 0.96) 0%, rgba(255, 255, 255, 0.92) 100%)',
            border: `1px solid ${isDarkMode ? 'rgba(96, 165, 250, 0.3)' : 'rgba(148, 163, 184, 0.22)'}`,
            borderRadius: 14,
            padding: '20px 24px',
            display:'grid',
            gap:12,
            gridTemplateColumns:'auto 1fr',
            alignItems:'center',
            boxShadow: isDarkMode 
              ? '0 10px 22px rgba(4, 9, 20, 0.55)' 
              : '0 6px 16px rgba(13, 47, 96, 0.12)',
            backdropFilter: 'blur(8px)'
          }}>
            <span style={labelStyle(isDarkMode ? '#94A3B8' : '#64748B')}>Ex VAT:</span><span style={valueStyle(isDarkMode ? '#E0F2FE' : '#0F172A')}>{vatInfo.ex}</span>
            <span style={labelStyle(isDarkMode ? '#94A3B8' : '#64748B')}>VAT (20%):</span><span style={valueStyle(isDarkMode ? '#E0F2FE' : '#0F172A')}>{vatInfo.vat}</span>
            <div style={{ gridColumn:'1 / -1', height:1, background:isDarkMode?'rgba(125, 211, 252, 0.24)':'rgba(148, 163, 184, 0.3)', margin:'6px 0 4px' }} />
            <span style={{ fontSize:15, fontWeight:700, color: isDarkMode ? '#E0F2FE' : '#0F172A' }}>Total inc VAT:</span>
            <span style={{ fontSize:18, fontWeight:700, color: isDarkMode ? '#60A5FA' : '#3690CE', textAlign:'right' }}>{vatInfo.total}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const buttonStyle = (isDarkMode: boolean): React.CSSProperties => ({
  padding:'4px 10px',
  border:'1px solid #94A3B8',
  background: isDarkMode ? colours.dark.inputBackground : '#FFFFFF',
  color: isDarkMode ? '#E0F2FE' : '#0F172A',
  borderRadius:6,
  cursor:'pointer',
  fontSize:12,
  fontWeight:600,
  lineHeight:1,
  transition:'all .15s ease',
  boxShadow: isDarkMode ? '0 1px 2px rgba(0,0,0,0.4)' : '0 1px 2px rgba(0,0,0,0.08)',
});

const inlineButton = (isDarkMode: boolean, positive: boolean): React.CSSProperties => ({
  padding:'4px 8px',
  border:'1px solid ' + (isDarkMode ? colours.dark.border : '#94A3B8'),
  background: isDarkMode ? colours.dark.inputBackground : '#FFFFFF',
  color: positive ? (isDarkMode ? '#60A5FA' : '#3690CE') : (isDarkMode ? '#E0F2FE' : '#0F172A'),
  borderRadius:4,
  cursor:'pointer',
  fontSize:11,
  fontWeight:600,
  lineHeight:1,
  display:'inline-flex',
  alignItems:'center',
  transition:'all .15s ease',
});

const integratedButton = (isDarkMode: boolean, positive: boolean): React.CSSProperties => ({
  padding:'8px 10px',
  margin:'2px',
  border:'none',
  background: positive 
    ? (isDarkMode 
      ? 'linear-gradient(135deg, rgba(54, 144, 206, 0.24) 0%, rgba(59, 130, 246, 0.18) 100%)'
      : 'linear-gradient(135deg, rgba(54, 144, 206, 0.16) 0%, rgba(96, 165, 250, 0.18) 100%)')
    : (isDarkMode 
      ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.12) 0%, rgba(203, 213, 225, 0.08) 100%)'
      : 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(226, 232, 240, 0.6) 100%)'),
  color: positive 
    ? (isDarkMode ? '#60A5FA' : '#3690CE') 
    : (isDarkMode ? '#E0F2FE' : '#0F172A'),
  borderRadius:8,
  cursor:'pointer',
  fontSize:12,
  fontWeight:600,
  lineHeight:1,
  display:'inline-flex',
  alignItems:'center',
  transition:'all .2s ease',
  boxShadow: isDarkMode 
    ? '0 2px 4px rgba(4, 9, 20, 0.3)' 
    : '0 1px 3px rgba(13, 47, 96, 0.08)'
});

const labelStyle = (col:string): React.CSSProperties => ({ fontSize:13, fontWeight:600, color:col });
const valueStyle = (col:string): React.CSSProperties => ({ fontSize:15, fontWeight:600, color:col, textAlign:'right' });

export default DealCapture;
