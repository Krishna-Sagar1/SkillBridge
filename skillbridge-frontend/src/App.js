import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { db, auth } from './firebaseConfig'; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, setDoc, getDoc, updateDoc, query, where, onSnapshot, deleteDoc } from 'firebase/firestore';

const SKILL_OPTIONS = ["React", "JavaScript", "Python", "HTML", "CSS", "Node.js", "Firebase", "Design", "AWS", "SQL"];

const styles = {
  nav: { background: '#1a2a6c', padding: '15px 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' },
  container: { padding: '40px 20px', maxWidth: '1000px', margin: 'auto', fontFamily: 'Arial, sans-serif' },
  card: { padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: '#fff', marginBottom: '20px' },
  input: { display: 'block', width: '100%', margin: '10px 0', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' },
  button: { padding: '10px 20px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' },
  btnSmall: { padding: '8px 15px', backgroundColor: '#1a2a6c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  btnReject: { padding: '8px 15px', backgroundColor: '#c0392b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' },
  skillGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px', margin: '10px 0' },
  skillTag: { padding: '5px 10px', borderRadius: '20px', border: '1px solid #1a2a6c', cursor: 'pointer', fontSize: '12px' },
  tabBar: { display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' },
  tab: { cursor: 'pointer', fontWeight: 'bold', padding: '5px 10px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '30px', borderRadius: '8px', width: '500px', maxWidth: '90%' },
  emptyText: { color: '#999', fontStyle: 'italic', margin: '10px 0', padding: '10px', background: '#f9f9f9', borderRadius: '4px' } // NEW: Styling for empty states
};

const AuthPage = ({ setUserData }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        setUserData({ uid: userCredential.user.uid, ...userDoc.data() });
        navigate('/');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = { email, name, role, skills: [] };
        await setDoc(doc(db, "users", userCredential.user.uid), newUser);
        setUserData({ uid: userCredential.user.uid, ...newUser });
        navigate('/');
      }
    } catch (err) { alert("Error: " + err.message); }
  };

  return (
    <div style={{...styles.container, maxWidth: '400px', marginTop: '50px'}}>
      <div style={styles.card}>
        <h2 style={{textAlign: 'center', color: '#1a2a6c'}}>{isLogin ? 'Login' : 'Join SkillBridge'}</h2>
        <form onSubmit={handleAuth}>
          {!isLogin && (
            <>
              <input style={styles.input} placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
              <select style={styles.input} value={role} onChange={e => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="organization">Organization</option>
              </select>
            </>
          )}
          <input style={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={styles.button} type="submit">{isLogin ? 'Login' : 'Register'}</button>
        </form>
        <p style={{textAlign: 'center', marginTop: '15px', color: '#1a2a6c', cursor: 'pointer'}} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Need an account? Register." : "Have an account? Login."}
        </p>
      </div>
    </div>
  );
};

const OrganizationDashboard = ({ userData }) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [apps, setApps] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [studentMessages, setStudentMessages] = useState([]);

  useEffect(() => {
    const fetchOrgData = async () => {
      const appSnap = await getDocs(collection(db, "applications"));
      setApps(appSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(app => app.orgId === userData.uid && app.status !== 'Rejected'));
      const jobSnap = await getDocs(collection(db, "opportunities"));
      setMyJobs(jobSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(job => job.orgId === userData.uid));
    };
    
    const q = query(collection(db, "messages"), where("to", "==", userData.uid));
    const unsub = onSnapshot(q, (snap) => setStudentMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    fetchOrgData(); return () => unsub();
  }, [userData]);

  const postJob = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "opportunities"), { orgId: userData.uid, orgName: userData.name, title, desc, requiredSkills });
    alert("Role Published!"); window.location.reload();
  };

  return (
    <div style={styles.container}>
      <h2>Org Portal: {userData.name}</h2>
      
      {studentMessages.length > 0 && (
        <div style={{...styles.card, border: '2px solid #27ae60'}}>
          <h3 style={{color: '#27ae60', margin: 0}}>✉️ Messages from Students</h3>
          {studentMessages.map(m => (
            <div key={m.id} style={{borderBottom: '1px solid #eee', padding: '10px 0'}}>
              <p><strong>{m.fromName}:</strong> {m.text}</p>
              <button style={{...styles.btnSmall, background: '#999'}} onClick={() => deleteDoc(doc(db, "messages", m.id))}>Archive</button>
            </div>
          ))}
        </div>
      )}

      <div style={styles.card}>
        <h3>Post a New Project</h3>
        <form onSubmit={postJob}>
          <input style={styles.input} placeholder="Project Title" value={title} onChange={e=>setTitle(e.target.value)} required/>
          <textarea style={{...styles.input, height:'60px'}} placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} required/>
          <div style={styles.skillGrid}>
            {SKILL_OPTIONS.map(skill => (
              <div key={skill} onClick={() => setRequiredSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])} style={{...styles.skillTag, background: requiredSkills.includes(skill) ? '#1a2a6c' : 'transparent', color: requiredSkills.includes(skill) ? 'white' : '#1a2a6c'}}>{skill}</div>
            ))}
          </div>
          <button style={styles.btnSmall} type="submit">Publish Role</button>
        </form>
      </div>

      <h3>Active Posts</h3>
      {myJobs.length === 0 ? (
        <p style={styles.emptyText}>You currently have no active posts. Create one above!</p>
      ) : (
        myJobs.map(job => (
          <div key={job.id} style={{...styles.card, display: 'flex', justifyContent: 'space-between'}}>
            <strong>{job.title}</strong>
            <button style={styles.btnReject} onClick={async () => { await deleteDoc(doc(db, "opportunities", job.id)); window.location.reload(); }}>Remove</button>
          </div>
        ))
      )}

      <h3>Applications</h3>
      {apps.length === 0 ? (
        <p style={styles.emptyText}>No applications received yet. Check back soon.</p>
      ) : (
        apps.map(app => (
          <div key={app.id} style={styles.card}>
            <h4>{app.title}</h4>
            <p>Student: {app.studentName}</p>
            <p style={{background: '#f9f9f9', padding: '10px'}}>"{app.coverLetter}"</p>
            {app.status === 'Messaged' ? <b style={{color:'#27ae60'}}>✓ Messaged</b> : 
            <button style={{...styles.btnSmall, background:'#27ae60'}} onClick={async () => {
              await addDoc(collection(db, "messages"), { to: app.studentId, fromName: userData.name, fromId: userData.uid, orgId: userData.uid, text: `We liked your pitch for ${app.title}!`, timestamp: new Date() });
              await updateDoc(doc(db, "applications", app.id), { status: 'Messaged' });
              alert("Message Sent!"); window.location.reload();
            }}>✉️ Accept & Message</button>}
            <button style={styles.btnReject} onClick={() => updateDoc(doc(db, "applications", app.id), {status: 'Rejected'}).then(() => window.location.reload())}>Reject</button>
          </div>
        ))
      )}
    </div>
  );
};

const StudentDashboard = ({ userData }) => {
  const [jobs, setJobs] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [activeTab, setActiveTab] = useState('jobs');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [applyingJob, setApplyingJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      const snap = await getDocs(collection(db, "opportunities"));
      const jobsWithMatch = snap.docs.map(d => {
        const data = d.data();
        const matches = (data.requiredSkills || []).filter(s => (userData.skills || []).includes(s));
        const percent = (data.requiredSkills || []).length > 0 ? Math.round((matches.length / data.requiredSkills.length) * 100) : 0;
        return { id: d.id, ...data, matchPercentage: percent };
      });
      setJobs(jobsWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage));
    };
    const q = query(collection(db, "messages"), where("to", "==", userData.uid));
    const unsub = onSnapshot(q, (snap) => setInbox(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    fetchJobs(); return () => unsub();
  }, [userData]);

  const sendReply = async () => {
    const recipientId = replyingTo.fromId || replyingTo.orgId; 
    if (!recipientId) return alert("Error: Could not identify recipient for this message.");

    await addDoc(collection(db, "messages"), { 
        to: recipientId, 
        fromName: userData.name, 
        fromId: userData.uid, 
        text: replyText, 
        timestamp: new Date() 
    });
    alert("Reply Sent!"); setReplyingTo(null); setReplyText("");
  };

  return (
    <div style={styles.container}>
      {replyingTo && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>Reply to {replyingTo.fromName}</h3>
            <textarea style={{...styles.input, height: '100px'}} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your message here..." />
            <button style={styles.button} onClick={sendReply}>Send Message</button>
            <button style={{background: '#999', border:'none', color:'white', padding:'5px', marginTop:'10px', cursor:'pointer'}} onClick={() => setReplyingTo(null)}>Cancel</button>
          </div>
        </div>
      )}

      {applyingJob && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>Apply for {applyingJob.title}</h3>
            <textarea style={{...styles.input, height: '100px'}} value={coverLetter} onChange={e => setCoverLetter(e.target.value)} placeholder="Why you?" />
            <button style={styles.button} onClick={async () => {
              await addDoc(collection(db, "applications"), { jobId: applyingJob.id, title: applyingJob.title, orgId: applyingJob.orgId, orgName: applyingJob.orgName, studentId: userData.uid, studentName: userData.name, coverLetter, status: 'Pending' });
              alert("Submitted!"); setApplyingJob(null);
            }}>Submit</button>
          </div>
        </div>
      )}

      <div style={styles.tabBar}>
        <span style={{...styles.tab, borderBottom: activeTab === 'jobs' ? '3px solid #f39c12' : 'none'}} onClick={() => setActiveTab('jobs')}>Project Board</span>
        <span style={{...styles.tab, borderBottom: activeTab === 'messages' ? '3px solid #f39c12' : 'none'}} onClick={() => setActiveTab('messages')}>Inbox ({inbox.length})</span>
      </div>

      {activeTab === 'jobs' ? (
        <>
          <div style={styles.card}>
            <h4>My Skills:</h4>
            <div style={styles.skillGrid}>
              {SKILL_OPTIONS.map(s => <div key={s} onClick={async () => {
                const newS = (userData.skills || []).includes(s) ? userData.skills.filter(i => i !== s) : [...(userData.skills || []), s];
                await updateDoc(doc(db, "users", userData.uid), { skills: newS });
                window.location.reload();
              }} style={{...styles.skillTag, background: (userData.skills || []).includes(s) ? '#f39c12' : 'transparent', color: (userData.skills || []).includes(s) ? 'white' : '#f39c12', border: '1px solid #f39c12'}}>{s}</div>)}
            </div>
          </div>
          {jobs.length === 0 ? (
            <p style={styles.emptyText}>There are no projects available right now. Check back later!</p>
          ) : (
            jobs.map(job => (
              <div key={job.id} style={{...styles.card, borderLeft: job.matchPercentage > 50 ? '8px solid #27ae60' : '8px solid #eee'}}>
                <h4>{job.title} <span style={{fontSize:'14px', color:'#999'}}>by {job.orgName}</span></h4>
                <p>Needs: <strong>{job.requiredSkills?.join(', ')}</strong></p>
                <p>Match: 🔥 {job.matchPercentage}%</p>
                <button style={styles.btnSmall} onClick={() => setApplyingJob(job)}>Apply Now</button>
              </div>
            ))
          )}
        </>
      ) : (
        <div style={styles.card}>
          <h3>Your Inbox</h3>
          {inbox.length === 0 ? (
             <p style={styles.emptyText}>Your inbox is empty.</p>
          ) : (
            inbox.map(m => (
              <div key={m.id} style={{borderBottom:'1px solid #eee', padding:'10px 0'}}>
                <p><strong>From: {m.fromName}</strong></p>
                <p>{m.text}</p>
                <button style={styles.btnSmall} onClick={() => setReplyingTo(m)}>Reply</button>
                <button style={{...styles.btnSmall, background:'#999', marginLeft:'10px'}} onClick={() => deleteDoc(doc(db, "messages", m.id))}>Archive</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

function App() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) { const docSnap = await getDoc(doc(db, "users", user.uid)); if (docSnap.exists()) setUserData({ uid: user.uid, ...docSnap.data() }); }
      setLoading(false);
    });
    return () => unsub();
  }, []);
  if (loading) return <div>Loading SkillBridge...</div>;
  return (
    <Router>
      <nav style={styles.nav}><h2 style={{margin: 0, cursor: 'pointer'}} onClick={() => window.location.href='/'}>SkillBridge</h2>
        {userData && <button style={{...styles.btnSmall, background:'#c0392b'}} onClick={() => signOut(auth).then(() => window.location.reload())}>Logout</button>}
      </nav>
      <Routes>
        <Route path="/" element={!userData ? <Navigate to="/auth" /> : userData.role === 'organization' ? <OrganizationDashboard userData={userData} /> : <StudentDashboard userData={userData} />} />
        <Route path="/auth" element={!userData ? <AuthPage setUserData={setUserData} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
export default App;