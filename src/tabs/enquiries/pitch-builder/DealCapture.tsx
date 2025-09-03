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
  const accent = colours.blue;

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
      background: isDarkMode ? 'linear-gradient(135deg, #2d2d2d 0%, #1e1e1e 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
      border: `1px solid ${border}`,
      borderRadius: 14,
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      boxShadow: isDarkMode ? '0 4px 8px rgba(0,0,0,0.4)' : '0 4px 6px rgba(0,0,0,0.07)',
      position: 'relative'
    }}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <label style={{
          fontSize: 16,
          fontWeight: 600,
          color: text,
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
              fontSize:14,
              lineHeight:1.55,
              background:isDarkMode?colours.dark.inputBackground:'#FFFFFF',
              color:text,
              fontFamily:'inherit',
              padding:'12px 14px'
            },
            fieldGroup:{
              border:`1px solid ${isDarkMode ? colours.dark.border : '#CBD5E1'}`,
              borderRadius:8,
              selectors:{
                ':hover':{ borderColor: accent },
                '.is-focused':{ borderColor:accent, boxShadow:`0 0 0 3px ${isDarkMode?'rgba(54,144,206,0.35)':'rgba(54,144,206,0.25)'}` }
              }
            }
          }}
        />
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <div style={{ width:'100%' }}>
          <label style={{
            fontSize:14,
            fontWeight:600,
            color:text,
            marginBottom:6,
            display:'flex',
            alignItems:'center',
            gap:6
          }}>
            Estimated Fee (£) <span style={{ color: colours.red, fontSize: 11 }}>*</span>
          </label>
          <div 
            style={{
              border:`1px solid ${isDarkMode?colours.dark.border:'#94A3B8'}`,
              borderRadius:10,
              background:isDarkMode?colours.dark.inputBackground:'#FFFFFF',
              display:'flex',
              alignItems:'stretch',
              transition:'all .15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = accent}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = isDarkMode?colours.dark.border:'#94A3B8'}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = accent;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${isDarkMode?'rgba(54,144,206,0.35)':'rgba(54,144,206,0.25)'}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = isDarkMode?colours.dark.border:'#94A3B8';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              display:'flex',
              alignItems:'center',
              paddingLeft:12,
              paddingRight:8,
              fontSize:18,
              fontWeight:600,
              color:accent,
              borderRight:`1px solid ${isDarkMode?colours.dark.border:'#E2E8F0'}`
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
                  color:text,
                  fontFamily:'inherit',
                  padding:'14px 12px',
                  border:'none'
                },
                fieldGroup:{
                  border:'none',
                  borderRadius:0,
                  background:'transparent'
                }
              }}
            />
            <div style={{
              display:'flex',
              alignItems:'center',
              gap:1,
              paddingRight:4,
              borderLeft:`1px solid ${isDarkMode?colours.dark.border:'#E2E8F0'}`
            }}>
              <button type="button" onClick={() => adjust(50)} style={integratedButton(isDarkMode, true)}>+50</button>
              <button type="button" onClick={() => adjust(-50)} style={integratedButton(isDarkMode, false)}>-50</button>
            </div>
          </div>
          <div style={{ marginTop:6, fontSize:12, lineHeight:1.4, color: subtle }}>
            Fee excluding VAT. Use +50/-50 to adjust.
          </div>
        </div>

        {vatInfo && (
          <div style={{
            background: isDarkMode ? colours.dark.inputBackground : '#FFFFFF',
            border: `1px solid ${isDarkMode ? colours.dark.border : '#CBD5E1'}`,
            borderRadius: 12,
            padding: '18px 20px',
            display:'grid',
            gap:10,
            gridTemplateColumns:'auto 1fr',
            alignItems:'center'
          }}>
            <span style={labelStyle(subtle)}>Ex VAT:</span><span style={valueStyle(text)}>{vatInfo.ex}</span>
            <span style={labelStyle(subtle)}>VAT (20%):</span><span style={valueStyle(text)}>{vatInfo.vat}</span>
            <div style={{ gridColumn:'1 / -1', height:1, background:isDarkMode?'#3a3a3a':'#E2E8F0', margin:'4px 0 2px' }} />
            <span style={{ fontSize:14, fontWeight:700, color:text }}>Total inc VAT:</span>
            <span style={{ fontSize:18, fontWeight:700, background:'linear-gradient(135deg, #3690CE, #60A5FA)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', textAlign:'right' }}>{vatInfo.total}</span>
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
  color: isDarkMode ? colours.dark.text : colours.darkBlue,
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
  color: positive ? colours.blue : (isDarkMode ? colours.dark.text : colours.darkBlue),
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
  padding:'6px 8px',
  margin:'2px',
  border:'none',
  background: positive ? 'rgba(54,144,206,0.1)' : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
  color: positive ? colours.blue : (isDarkMode ? colours.dark.text : colours.darkBlue),
  borderRadius:6,
  cursor:'pointer',
  fontSize:11,
  fontWeight:600,
  lineHeight:1,
  display:'inline-flex',
  alignItems:'center',
  transition:'all .15s ease',
});

const labelStyle = (col:string): React.CSSProperties => ({ fontSize:12, fontWeight:600, color:col });
const valueStyle = (col:string): React.CSSProperties => ({ fontSize:14, fontWeight:600, color:col, textAlign:'right' });

export default DealCapture;
