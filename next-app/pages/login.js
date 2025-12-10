import {useState, useEffect} from 'react';

export default function Login(){
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(()=>{
    if (!error) return;
    const t = setTimeout(()=>setError(''), 5000);
    return ()=>clearTimeout(t);
  }, [error]);

  useEffect(()=>{
    if (!success) return;
    const t = setTimeout(()=>setSuccess(''), 4000);
    return ()=>clearTimeout(t);
  }, [success]);

  async function sub(e){
    e.preventDefault();
    setError(''); setSuccess('');
    try{
      const r = await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
      const data = await r.json();
      if (data.success){
        localStorage.setItem('token', data.token);
        setSuccess('Successfully logged in — redirecting…');
        setTimeout(()=>window.location.href='/', 800);
      } else {
        // server sends clear errors like "invalid credentials"
        setError(data.error || 'Invalid username or password');
      }
    }catch(err){
      console.error('login err', err);
      setError('Network or server error — please try again');
    }
  }

  return (
    <div style={{maxWidth:420,margin:'50px auto',padding:16}}>
      <h2>Login</h2>
      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}
      <form onSubmit={sub} style={{display:'flex',flexDirection:'column',gap:8}}>
        <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} />
        <input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
