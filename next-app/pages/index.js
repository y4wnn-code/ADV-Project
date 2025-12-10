import { useEffect, useState } from 'react';

export default function Dashboard(){
  const [posts,setPosts] = useState([]);
  const [token, setToken] = useState(null);
  const [sortOrder, setSortOrder] = useState('latest');
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('2024');
  const [content, setContent] = useState('');

  useEffect(()=>{ setToken(localStorage.getItem('token')); fetchPosts(); },[]);

  async function fetchPosts(){
    const r = await fetch('/api/posts');
    const data = await r.json();
    // sort on client to support latest / oldest toggles
    const sorted = (data || []).slice();
    if (sortOrder === 'latest') sorted.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
    else sorted.sort((a,b)=> new Date(a.created_at) - new Date(b.created_at));
    setPosts(sorted);
  }

  async function makePost(){
    if (!token) return alert('login required');
    if (!title || !year || !content) return alert('fill fields');
    const r = await fetch('/api/posts', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ title, year, content })});
    const data = await r.json();
    if (data.success){ setTitle(''); setYear('2024'); setContent(''); fetchPosts(); }
    else alert(data.error || 'error');
  }

  return (
    <div style={{maxWidth:900,margin:'20px auto',padding:16}}>
      <h1>BloggWatch (Next.js)</h1>
      <div style={{display:'flex',gap:12,marginBottom:20,alignItems:'center'}}>
        <input placeholder="title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input placeholder="year" value={year} onChange={e=>setYear(e.target.value)} style={{width:120}} />
        <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="content" style={{flex:1}} />
        <button onClick={makePost}>Post</button>
        <div style={{marginLeft:8,display:'flex',alignItems:'center',gap:6}}>
          <label style={{fontSize:13,color:'#555'}}>Sort</label>
          <select value={sortOrder} onChange={e=>{ setSortOrder(e.target.value); fetchPosts(); }} style={{padding:6,borderRadius:6}}>
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>
      <div>
        {posts.map(p => (
          <div key={p.id} style={{border:'1px solid #ddd',padding:10,borderRadius:8,marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <a href={`/profile/${p.username}`} style={{display:'inline-flex',alignItems:'center',textDecoration:'none',color:'inherit'}}>
                <img src={p.pfp || '/default-pfp.png'} width={36} height={36} style={{borderRadius:18}} />
                <div style={{marginLeft:8}}><strong>{p.username}</strong></div>
              </a>
              <div style={{marginLeft:8}}><span style={{fontWeight:700}}>{p.title}</span> <span style={{color:'#666'}}>({p.year})</span></div>
            </div>
            <div style={{marginTop:8}}>{p.content}</div>
            <div style={{marginTop:8,color:'#666'}}>{p.likes} ↑ · {p.dislikes} ↓ · {p.comments.length} comments</div>
          </div>
        ))}
      </div>
    </div>
  );
}
