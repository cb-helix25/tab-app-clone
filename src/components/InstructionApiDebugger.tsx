import React, { useEffect } from 'react';
import { Text, DefaultButton, IconButton } from '@fluentui/react';
import { useTheme } from '../app/functionality/ThemeContext';
import { colours } from '../app/styles/colours';

interface InstructionApiDebuggerProps {
  currentInstructions: any[];
  onClose: () => void;
}

/** Instruction API Debugger (mirrors Enquiry/Matter debuggers) */
const InstructionApiDebugger: React.FC<InstructionApiDebuggerProps> = ({ currentInstructions, onClose }) => {
  const { isDarkMode } = useTheme();

  const analyzeCurrentData = () => {
    console.log('CURRENT INSTRUCTIONS ANALYSIS:');
    console.log('Total instructions:', currentInstructions.length);
    if (currentInstructions.length) {
      console.log('Sample keys:', Object.keys(currentInstructions[0]));
      const claimCounts: Record<string, number> = {};
      currentInstructions.forEach(i => {
        const claimed = i.InstructionRef ? 'claimed' : 'unclaimed';
        claimCounts[claimed] = (claimCounts[claimed] || 0) + 1;
      });
      console.log('Claim distribution:', claimCounts);
    }
  };

  useEffect(() => { analyzeCurrentData(); }, [currentInstructions]);

  return (
    <div
      style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: isDarkMode?'#1a1a1a':'#fff', borderRadius:12, width:'90%', height:'90%', maxWidth:1200, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'16px 24px', borderBottom:`1px solid ${isDarkMode?'#404040':'#e5e7eb'}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:isDarkMode?'#2d2d2d':'#fff' }}>
          <div>
            <Text variant="large" styles={{ root:{ fontWeight:600, color:isDarkMode?'#fff':'#111827' } }}>Instruction API Debugger</Text>
            <Text variant="small" styles={{ root:{ color:isDarkMode?'#888':'#6b7280', marginTop:2 } }}>Inspect instruction data & filtering logic</Text>
          </div>
            <IconButton iconProps={{ iconName:'Cancel' }} onClick={onClose} styles={{ root:{ background:isDarkMode?'#404040':'#f3f4f6', color:isDarkMode?'#fff':'#374151' } }} />
        </div>
        <div style={{ flex:1, overflow:'auto', padding:20 }}>
          <div style={{ marginBottom:24, padding:16, background:isDarkMode?'#2d2d2d':'#f8f9fa', borderRadius:8, border:`1px solid ${isDarkMode?'#404040':'#e1e4e8'}` }}>
            <Text variant="mediumPlus" styles={{ root:{ fontWeight:600, marginBottom:12 } }}>Current Instructions Summary</Text>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px,1fr))', gap:12 }}>
              <div>
                <Text variant="large" styles={{ root:{ fontWeight:600, color:colours.blue } }}>{currentInstructions.length}</Text>
                <Text variant="small">Total</Text>
              </div>
              <div>
                <Text variant="large" styles={{ root:{ fontWeight:600, color:colours.green } }}>{currentInstructions.filter(i=>i.InstructionRef).length}</Text>
                <Text variant="small">Claimed</Text>
              </div>
              <div>
                <Text variant="large" styles={{ root:{ fontWeight:600, color:colours.orange } }}>{currentInstructions.filter(i=>!i.InstructionRef).length}</Text>
                <Text variant="small">Unclaimed</Text>
              </div>
            </div>
            <DefaultButton text="Analyze in Console" onClick={analyzeCurrentData} styles={{ root:{ marginTop:12 } }} />
          </div>
          <div style={{ padding:16, background:isDarkMode?'#2d2d2d':'#f8f9fa', borderRadius:8, border:`1px solid ${isDarkMode?'#404040':'#e1e4e8'}` }}>
            <Text variant="mediumPlus" styles={{ root:{ fontWeight:600, marginBottom:12 } }}>Raw Sample (first 2)</Text>
            <pre style={{ margin:0, maxHeight:300, overflow:'auto', fontSize:12 }}>{JSON.stringify(currentInstructions.slice(0,2), null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionApiDebugger;
