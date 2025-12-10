import pool from '../../../lib/db';

export async function getServerSideProps({ params }){
  const username = params.username;
  try{
    const [[user]] = await pool.query('SELECT id, username, display_name, pfp, created_at FROM users WHERE username = ?', [username]);
    const [posts] = await pool.query('SELECT p.*, (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.type="like") as likes, (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.type="dislike") as dislikes FROM posts p JOIN users u ON p.user_id = u.id WHERE u.username = ? ORDER BY p.created_at DESC', [username]);
    return { props: { user: user||null, posts }};
  }catch(err){ console.error('profile page error', err); return { props: { user:null, posts:[] } }; }
}

export default function Profile({ user, posts }){
  if (!user) return <div style={{padding:40}}>User not found</div>
  return (
    <div style={{maxWidth:900,margin:20}}>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <img src={user.pfp || '/default-pfp.png'} width={80} height={80} style={{borderRadius:40}} />
        <div>
          <h2 style={{margin:0}}>{user.username}</h2>
          <div style={{color:'#666'}}>Joined {new Date(user.created_at).toLocaleString()}</div>
        </div>
      </div>
      <h3 style={{marginTop:18}}>Posts</h3>
      {posts.length === 0 ? <div>No posts yet.</div> : posts.map(p=> (
        <div key={p.id} style={{border:'1px solid #eee',padding:10,borderRadius:8,marginBottom:8}}>
          <div style={{fontWeight:700}}>{p.title} <span style={{color:'#666'}}>({p.year})</span></div>
          <div style={{marginTop:6}}>{p.content}</div>
          <div style={{marginTop:8,color:'#666'}}>{p.likes} ↑ · {p.dislikes} ↓</div>
        </div>
      ))}
    </div>
  );
}
