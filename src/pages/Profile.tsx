import { getTelegramUser } from '../lib/telegram';
import {
  UserRound, Phone, MapPin, IdCard, FileText, ShieldCheck, Shield,
  LockKeyhole, Bell, Fingerprint, CircleHelp, Headset, ChevronRight,
  CheckCircle2, LogOut, Sun, Moon, Languages, Volume2, VolumeX,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '../lib/store';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type InfoRowProps = {
  icon: typeof UserRound;
  title: string;
  value?: string;
  description?: string;
  right?: ReactNode;
  onClick?: () => void;
};

function InfoRow({ icon: Icon, title, value, description, right, onClick }: InfoRowProps) {
  const content = (
    <>
      <div className="fig-profile-row-icon"><Icon size={16} strokeWidth={2} /></div>
      <div className="fig-profile-row-copy">
        <div className="fig-profile-row-title">{title}</div>
        {description && <div className="fig-profile-row-description">{description}</div>}
      </div>
      {value && <div className="fig-profile-row-value">{value}</div>}
      {right ?? (!value && <ChevronRight size={15} className="fig-profile-chevron" />)}
    </>
  );
  if (onClick) return <button type="button" className="fig-profile-row fig-profile-row-button" onClick={onClick}>{content}</button>;
  return <div className="fig-profile-row">{content}</div>;
}

function SectionCard({ title, icon: Icon, action, children }: {
  title: string; icon: typeof UserRound; action?: ReactNode; children: ReactNode;
}) {
  return (
    <section className="fig-profile-section">
      <div className="fig-profile-section-card">
        <div className="fig-profile-section-head">
          <div className="fig-profile-section-title-wrap">
            <div className="fig-profile-section-icon"><Icon size={15} strokeWidth={2} /></div>
            <h2>{title}</h2>
          </div>
          {action}
        </div>
        <div className="fig-profile-section-body">{children}</div>
      </div>
    </section>
  );
}
function RowDivider() { return <div className="fig-profile-divider" />; }
function StatusPill({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'gray' }) {
  return <span className={'fig-profile-pill ' + (tone === 'green' ? 'is-green' : 'is-gray')}>{children}</span>;
}

export default function Profile() {
  const user = getTelegramUser();
  const { theme, toggleTheme, language, setLanguage, soundEnabled, setSoundEnabled, userProfile } = useAppStore();
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const isBn = language === 'bn';
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Telegram User';
  const memberName = [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(' ') || fullName;
  const memberId = userProfile?.chat_id ? 'PSS-' + String(userProfile.chat_id).slice(-6) : 'PSS-MEMBER';
  const accountState = userProfile?.is_locked
    ? (isBn ? 'অ্যাকাউন্ট লকড' : 'Account locked')
    : userProfile?.is_banned
      ? (isBn ? 'সীমাবদ্ধ' : 'Restricted')
      : (isBn ? 'সক্রিয়' : 'Active');
  const phone = userProfile?.phone || '+880 1•••••••••';
  const address = userProfile?.address || (isBn ? 'ঠিকানা যোগ করা হয়নি' : 'Address not added');

  return (
    <div className="fig-profile-page">
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="fig-profile-content">
        <section className="fig-profile-hero">
          <div className="fig-profile-identity">
            <div className="fig-profile-avatar-wrap">
              <img
                src={user.photo_url || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(memberName) + '&background=2a9d8f&color=fff&bold=true')}
                alt={isBn ? 'প্রোফাইল ছবি' : 'Profile'}
                className="fig-profile-avatar"
                onError={(e) => {
                  const fallback = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(memberName) + '&background=2a9d8f&color=fff&bold=true';
                  if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                }}
              />
              <span className="fig-profile-avatar-check"><CheckCircle2 size={11} /></span>
            </div>
            <div className="fig-profile-identity-copy">
              <h1>{memberName}</h1>
              <p>@{user.username || 'telegram-user'} • {memberId}</p>
              <span className="fig-profile-active"><span /> {isBn ? 'সক্রিয় সদস্য' : 'Active member'}</span>
            </div>
          </div>

          <div className="fig-profile-completion">
            <div className="fig-profile-completion-head"><span>{isBn ? 'প্রোফাইল সম্পূর্ণ' : 'Profile completion'}</span><strong>৯৫%</strong></div>
            <div className="fig-profile-progress"><span /></div>
          </div>

          <div className="fig-profile-tip">
            <ShieldCheck size={15} />
            <span>{isBn ? 'আপনার প্রোফাইল সম্পূর্ণ হলে লোন আবেদন আরও দ্রুত যাচাই করা যাবে।' : 'A complete profile helps us review your loan application faster.'}</span>
          </div>
        </section>

        <div className="fig-profile-separator" />

        <SectionCard title={isBn ? 'ব্যক্তিগত তথ্য' : 'Personal information'} icon={UserRound}>
          <InfoRow icon={UserRound} title={isBn ? 'জন্মতারিখ' : 'Date of birth'} value={isBn ? '১১ এপ্রিল, ১৯৯৯' : '11 April, 1999'} />
          <RowDivider />
          <InfoRow icon={IdCard} title={isBn ? 'জাতীয় পরিচয়পত্র' : 'National ID'} value="•••• •••• 4321" />
          <RowDivider />
          <InfoRow icon={UserRound} title={isBn ? 'লিঙ্গ' : 'Gender'} value={isBn ? 'পুরুষ' : 'Male'} />
          <RowDivider />
          <InfoRow icon={FileText} title={isBn ? 'পেশা' : 'Occupation'} value={isBn ? 'ব্যবসায়ী' : 'Business'} />
        </SectionCard>

        <SectionCard title={isBn ? 'যোগাযোগ' : 'Contact'} icon={Phone}>
          <InfoRow icon={Phone} title={isBn ? 'মোবাইল' : 'Mobile'} value={phone} description={isBn ? 'প্রাথমিক যোগাযোগ নম্বর' : 'Primary contact number'} />
          <RowDivider />
          <InfoRow icon={MapPin} title={isBn ? 'ঠিকানা' : 'Address'} value={address} description={isBn ? 'বর্তমান ঠিকানা' : 'Current address'} />
          <RowDivider />
          <InfoRow icon={FileText} title={isBn ? 'ইমেইল' : 'Email'} value="ra••••@gmail.com" />
        </SectionCard>

        <SectionCard title={isBn ? 'কেওয়াইসি ও নথি' : 'KYC & documents'} icon={ShieldCheck} action={<span className="fig-profile-count">৩/৩ সম্পূর্ণ</span>}>
          <InfoRow icon={IdCard} title={isBn ? 'জাতীয় পরিচয়পত্র' : 'National ID'} description={isBn ? 'NID-এর তথ্য যাচাই সম্পন্ন' : 'NID verified'} right={<StatusPill>যাচাইকৃত</StatusPill>} />
          <RowDivider />
          <InfoRow icon={FileText} title={isBn ? 'প্রোফাইল ছবি' : 'Profile photo'} description={isBn ? 'প্রোফাইল ছবি আপলোড করা হয়েছে' : 'Profile photo uploaded'} right={<StatusPill>সম্পন্ন</StatusPill>} />
          <RowDivider />
          <InfoRow icon={MapPin} title={isBn ? 'ঠিকানা প্রমাণ' : 'Address proof'} description={isBn ? 'ঠিকানা যাচাইয়ের নথি' : 'Address verification document'} right={<StatusPill>যাচাইকৃত</StatusPill>} />
        </SectionCard>

        <SectionCard title={isBn ? 'পেমেন্ট অ্যাকাউন্ট' : 'Payment account'} icon={IdCard} action={<button type="button" className="fig-profile-text-action">{isBn ? 'পরিবর্তন' : 'Change'}</button>}>
          <InfoRow icon={FileText} title={isBn ? 'প্রধান মাধ্যম' : 'Primary method'} value={isBn ? 'বিকাশ ব্যক্তিগত' : 'bKash Personal'} description="01•••••••••" />
          <RowDivider />
          <InfoRow icon={IdCard} title={isBn ? 'ব্যাংক' : 'Bank'} value={isBn ? 'সোনালী ব্যাংক' : 'Sonali Bank'} description="•••• 4051" />
          <RowDivider />
          <InfoRow icon={UserRound} title={isBn ? 'হিসাবধারী' : 'Account holder'} value={memberName} />
        </SectionCard>

        <SectionCard title={isBn ? 'নিরাপত্তা ও সেটিংস' : 'Security & settings'} icon={LockKeyhole}>
          <InfoRow icon={LockKeyhole} title={isBn ? 'অ্যাকাউন্ট লগইন' : 'Account login'} description={isBn ? 'Telegram নিরাপত্তা ব্যবহৃত হচ্ছে' : 'Secured with Telegram identity'} />
          <RowDivider />
          <InfoRow icon={Fingerprint} title={isBn ? 'বায়োমেট্রিক লগইন' : 'Biometric login'} description={isBn ? 'ডিভাইসের বায়োমেট্রিক ব্যবহার করুন' : 'Use device biometrics'} onClick={() => setBiometricEnabled(v => !v)} right={<span className={'fig-profile-toggle ' + (biometricEnabled ? 'on' : '')}><span /></span>} />
          <RowDivider />
          <InfoRow icon={Bell} title={isBn ? 'অ্যাপ ও নোটিফিকেশন' : 'App & notifications'} description={isBn ? 'গুরুত্বপূর্ণ আপডেট ও বার্তা' : 'Important updates and messages'} onClick={() => setSoundEnabled(!soundEnabled)} right={<span className={'fig-profile-toggle ' + (soundEnabled ? 'on' : '')}><span /></span>} />
          <RowDivider />
          <InfoRow icon={Shield} title={isBn ? 'গোপনীয়তা ও অনুমতি' : 'Privacy & permissions'} />
        </SectionCard>

        <SectionCard title={isBn ? 'সহায়তা' : 'Support'} icon={CircleHelp}>
          <Link to="/support" className="fig-profile-link-row"><InfoRow icon={Headset} title={isBn ? 'লাইভ সাপোর্ট' : 'Live support'} description={isBn ? 'সাহায্যের জন্য আমাদের সাথে কথা বলুন' : 'Talk to our support team'} /></Link>
          <RowDivider />
          <Link to="/faq" className="fig-profile-link-row"><InfoRow icon={CircleHelp} title={isBn ? 'সাধারণ প্রশ্ন ও সাহায্য কেন্দ্র' : 'FAQ & Help Center'} description={isBn ? 'প্রশ্নের উত্তর ও নির্দেশিকা' : 'Answers and guides'} /></Link>
        </SectionCard>

        <button type="button" className="fig-profile-logout"><LogOut size={17} /><span>{isBn ? 'লগআউট' : 'Log out'}</span><ChevronRight size={15} /></button>

        <div className="fig-profile-footer">
          <strong>PROVATI LOAN • PROVATI SOMOBAY SOMITI</strong>
          <span>{isBn ? 'সদস্য সেবা • সংস্করণ ১.১' : 'Member service • Version 1.1'}</span>
        </div>

        <div className="fig-profile-utility">
          <button type="button" onClick={toggleTheme} aria-label="Theme">{theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}</button>
          <button type="button" onClick={() => setLanguage(isBn ? 'en' : 'bn')} aria-label="Language"><Languages size={14} /></button>
          <button type="button" onClick={() => setSoundEnabled(!soundEnabled)} aria-label="Sound">{soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}</button>
        </div>
      </motion.main>
    </div>
  );
}
