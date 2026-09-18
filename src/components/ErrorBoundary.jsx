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
          <div style={{display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center'}}>
            <button onClick={()=>{ this.setState({error:null}); }}
              className="btn btn-pri" style={{padding:'8px 18px', fontSize:12.5}}>
              Try Again
            </button>
            <button onClick={()=>{ window.location.reload(); }}
              className="btn btn-ghost" style={{padding:'8px 18px', fontSize:12.5}}>
              Reload Page
            </button>
            <button onClick={()=>{
                try {
                  localStorage.removeItem('rf_dark');
                  indexedDB.deleteDatabase('RetailFlowDB');
                } catch {}
                window.location.reload();
              }}
              className="btn btn-red" style={{padding:'8px 18px', fontSize:12.5}}>
              Reset Local Data
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
