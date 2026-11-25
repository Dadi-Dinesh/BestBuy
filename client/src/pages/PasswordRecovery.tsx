import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Input } from '../components/ui/Input';
import { authService } from '../services/authService';

export function PasswordRecovery({reset=false}:{reset?:boolean}) {
  const [code,setCode]=useState('');
  const [password,setPassword]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
    <section className="card w-full max-w-md space-y-5 p-7">
      <header className="flex justify-between gap-4"><Link to="/" className="font-bold">BestBuy India</Link><ThemeToggle/></header>
      <h1 className="page-title">{reset?'Reset your password':'Recover your account'}</h1>
      {reset?<form className="space-y-4" onSubmit={async event=>{
        event.preventDefault();setError('');setMessage('');setBusy(true);
        try{
          const result=await authService.resetPassword(code.trim(),password);
          if(!result.success){setError(result.error||'The password could not be changed.');return;}
          setPassword('');setCode('');setMessage('Password changed. You can now sign in.');
        }catch{setError('Password recovery is temporarily unavailable.');}
        finally{setBusy(false);}
      }}>
        <Input label="Recovery code" value={code} onChange={event=>setCode(event.target.value)} required autoComplete="off"/>
        <Input label="New password" value={password} onChange={event=>setPassword(event.target.value)} required minLength={12} maxLength={256} type="password" autoComplete="new-password"/>
        <button className="btn-primary" disabled={busy||!!message}>{busy?'Saving…':'Reset password'}</button>
      </form>:<><p className="text-sm leading-6 text-slate-500">Ask your BestBuy administrator for a one-time recovery code. Codes expire after 30 minutes.</p>
        <Link className="btn-primary" to="/reset-password">I have a recovery code</Link></>}
      {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
      <Link className="block text-sm font-semibold underline" to="/login">Back to sign in</Link>
    </section>
  </main>;
}
