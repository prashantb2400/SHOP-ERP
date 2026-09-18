import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[RetailFlow] Render error:', error, info);
  }

  render() {
    if (this.state.error) {
      const err = this.state.error;
      return (
        <div style={{
          minHeight:'100vh', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:16,
          background:'#f5f6fa', color:'#0f1421', padding:24, textAlign:'center',
          fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
        }}>
          <div style={{fontSize:32, fontWeight:800}}>Retail<span style={{color:'#2563eb'}}>Flow</span></div>
          <div style={{fontSize:40}}>⚠️</div>
          <div style={{fontSize:16, fontWeight:700}}>Something went wrong</div>
          <div style={{fontSize:13, color:'#64748b', maxWidth:480, fontFamily:'monospace', background:'#fff',
            border:'1px solid #e2e6f0', borderRadius:8, padding:12, wordBreak:'break-word'}}>
            {err?.message || String(err)}
          </div>
          <div style={{display:'flex', gap:10}}>
            <button onClick={()=>{ this.setState({error:null}); }}
              style={{padding:'10px 20px', borderRadius:8, border:'1.5px solid #2563eb',
                background:'#eff6ff', color:'#2563eb', fontWeight:700, cursor:'pointer', fontSize:13}}>
              ↩ Try Again
            </button>
            <button onClick={()=>{ window.location.reload(); }}
              style={{padding:'10px 20px', borderRadius:8, border:'1.5px solid #e2e6f0',
                background:'#fff', color:'#0f1421', fontWeight:700, cursor:'pointer', fontSize:13}}>
              🔄 Reload Page
            </button>
            <button onClick={()=>{
                try {
                  localStorage.removeItem('rf_dark');
                  indexedDB.deleteDatabase('RetailFlowDB');
                } catch {}
                window.location.reload();
              }}
              style={{padding:'10px 20px', borderRadius:8, border:'1.5px solid #dc2626',
                background:'#fef2f2', color:'#dc2626', fontWeight:700, cursor:'pointer', fontSize:13}}>
              🗑 Reset Local Data
            </button>
          </div>
          <div style={{fontSize:11, color:'#8b949e', marginTop:8}}>
            If this keeps happening, try "Reset Local Data" — your cloud-synced data (if signed in) is safe.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
