import '../styles/profile-figma.css';
import { getTelegramUser } from '../lib/telegram';
import {
  UserRound, Phone, MapPin, IdCard, FileText, ShieldCheck, Shield,
  LockKeyhole, CircleHelp, Headset, ChevronRight, CheckCircle2,
  LogOut, Sun, Moon, Languages, Volume2, VolumeX, Wallet, ArrowDownToLine, ArrowUpFromLine,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '../lib/store';
import { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { convertDigits } from '../lib/translation';

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
      {right ?? (onClick ? <ChevronRight size={15} className="fig-profile-chevron" /> : null)}
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

const displayOrMissing = (value: string | null | undefined, isBn: boolean) =>
  value?.trim() ? value.trim() : (isBn ? 'যোগ করা হয়নি' : 'Not added');

const maskTail = (value: string | null | undefined) => {
  if (!value?.trim()) return '';
  const cleaned = value.trim();
  return '•••• ' + cleaned.slice(-4);
};

export default function Profile() {
  const user = getTelegramUser();
  const navigate = useNavigate();
  const {
    theme, toggleTheme, language, setLanguage, soundEnabled, setSoundEnabled, userProfile,
  } = useAppStore();
  const isBn = language === 'bn';
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Telegram User';
  const memberName = [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(' ') || fullName;
  const memberId = 'PSS-' + String(userProfile?.chat_id ?? user.id).slice(-6);
  const phone = userProfile?.phone?.trim() ? maskTail(userProfile.phone) : displayOrMissing(null, isBn);
  const address = displayOrMissing(userProfile?.address, isBn);
  const nid = userProfile?.nid_number?.trim() ? maskTail(userProfile.nid_number) : displayOrMissing(null, isBn);
  const hasProfilePhoto = Boolean(userProfile?.photo_url || user.photo_url);
  const profileChecks = [
    Boolean(userProfile?.phone?.trim()),
    Boolean(userProfile?.address?.trim()),
    Boolean(userProfile?.nid_number?.trim()),
    hasProfilePhoto,
  ];
  const profileCompletion = Math.round((profileChecks.filter(Boolean).length / profileChecks.length) * 100);
  const profileRestricted = Boolean(userProfile?.is_banned || userProfile?.is_locked);
  const profileStatus = profileRestricted
    ? (isBn ? 'সীমাবদ্ধ' : 'Restricted')
    : userProfile
      ? (isBn ? 'প্রোফাইল সংযুক্ত' : 'Profile connected')
      : (isBn ? 'Telegram সংযুক্ত' : 'Telegram connected');

  const closeMiniApp = () => {
    const webApp = (window as any).Telegram?.WebApp;
    if (typeof webApp?.close === 'function') webApp.close();
    else navigate('/');
  };

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
              />
            </div>
            <div className="fig-profile-identity-copy">
              <h1>{memberName}</h1>
              <p>@{user.username || (isBn ? 'ইউজারনেম নেই' : 'no username')} • {memberId}</p>
              <span className="fig-profile-active"><span /> {profileStatus}</span>
            </div>
          </div>
          <div className="fig-profile-completion">
            <div className="fig-profile-completion-head">
              <span>{isBn ? 'প্রোফাইলে তথ্য যোগ' : 'Profile information added'}</span>
              <strong>{convertDigits(profileCompletion, isBn)}%</strong>
            </div>
            <div className="fig-profile-progress"><span style={{ width: profileCompletion + '%' }} /></div>
          </div>
          <div className="fig-profile-tip">
            <ShieldCheck size={15} />
            <span>{isBn ? 'এটি শুধু প্রোফাইলে থাকা তথ্যের হিসাব—KYC যাচাই সম্পন্ন হওয়ার প্রমাণ নয়।' : 'This measures profile information only; it does not mean KYC verification is complete.'}</span>
          </div>
        </section>
        <div className="fig-profile-separator" />

        <SectionCard title={isBn ? 'সদস্য পরিচিতি' : 'Member information'} icon={UserRound}>
          <InfoRow icon={UserRound} title={isBn ? 'Telegram নাম' : 'Telegram name'} value={memberName} /><RowDivider />
          <InfoRow icon={IdCard} title={isBn ? 'সদস্য আইডি' : 'Member ID'} value={memberId} /><RowDivider />
          <InfoRow icon={FileText} title={isBn ? 'Telegram ইউজারনেম' : 'Telegram username'} value={user.username ? '@' + user.username : displayOrMissing(null, isBn)} /><RowDivider />
          <InfoRow icon={IdCard} title={isBn ? 'জাতীয় পরিচয়পত্র' : 'National ID'} value={nid} />
        </SectionCard>

        <SectionCard title={isBn ? 'যোগাযোগ' : 'Contact'} icon={Phone}>
          <InfoRow icon={Phone} title={isBn ? 'মোবাইল' : 'Mobile'} value={phone} description={isBn ? 'সংরক্ষিত নম্বরের শেষ চারটি অঙ্ক দেখানো হচ্ছে' : 'Only the last four digits of a saved number are shown'} /><RowDivider />
          <InfoRow icon={MapPin} title={isBn ? 'ঠিকানা' : 'Address'} value={address} description={isBn ? 'প্রোফাইলে থাকা ঠিকানা' : 'Address currently saved in your profile'} />
        </SectionCard>

        <SectionCard title={isBn ? 'প্রোফাইল তথ্যের অবস্থা' : 'Profile information status'} icon={ShieldCheck} action={<span className="fig-profile-count">{convertDigits(profileChecks.filter(Boolean).length, isBn)}/4</span>}>
          <InfoRow icon={IdCard} title={isBn ? 'NID নম্বর' : 'NID number'} description={isBn ? 'শুধু নম্বর যোগ করা আছে কি না' : 'Checks whether an ID number is present'} right={<StatusPill tone={userProfile?.nid_number ? 'green' : 'gray'}>{userProfile?.nid_number ? (isBn ? 'যোগ করা আছে' : 'Added') : (isBn ? 'নেই' : 'Missing')}</StatusPill>} /><RowDivider />
          <InfoRow icon={FileText} title={isBn ? 'প্রোফাইল ছবি' : 'Profile photo'} description={isBn ? 'Telegram প্রোফাইল ছবি পাওয়া গেছে কি না' : 'Whether a Telegram profile photo is available'} right={<StatusPill tone={hasProfilePhoto ? 'green' : 'gray'}>{hasProfilePhoto ? (isBn ? 'আছে' : 'Available') : (isBn ? 'নেই' : 'Missing')}</StatusPill>} /><RowDivider />
          <InfoRow icon={MapPin} title={isBn ? 'ঠিকানা' : 'Address'} description={isBn ? 'প্রোফাইলে ঠিকানা আছে কি না' : 'Whether an address is saved in your profile'} right={<StatusPill tone={userProfile?.address ? 'green' : 'gray'}>{userProfile?.address ? (isBn ? 'যোগ করা আছে' : 'Added') : (isBn ? 'নেই' : 'Missing')}</StatusPill>} />
        </SectionCard>

        <SectionCard title={isBn ? 'লেনদেন ও পেমেন্ট' : 'Payments & transfers'} icon={Wallet}>
          <Link to="/deposit" className="fig-profile-link-row"><InfoRow icon={ArrowDownToLine} title={isBn ? 'ডিপোজিট' : 'Deposit'} description={isBn ? 'ডিপোজিট রিকোয়েস্ট ও পেমেন্ট প্রুফ দিন' : 'Submit a deposit request and payment proof'} /></Link><RowDivider />
          <Link to="/withdraw" className="fig-profile-link-row"><InfoRow icon={ArrowUpFromLine} title={isBn ? 'উত্তোলন' : 'Withdraw'} description={isBn ? 'ব্যাংক তথ্য দিয়ে উত্তোলন রিকোয়েস্ট করুন' : 'Request a withdrawal to a bank account'} /></Link><RowDivider />
          <Link to="/transactions" className="fig-profile-link-row"><InfoRow icon={FileText} title={isBn ? 'লেনদেনের ইতিহাস' : 'Transaction history'} description={isBn ? 'সাবমিট করা ও সম্পন্ন লেনদেন দেখুন' : 'View submitted and completed transactions'} /></Link>
        </SectionCard>

        <SectionCard title={isBn ? 'নিরাপত্তা ও সেটিংস' : 'Security & settings'} icon={LockKeyhole}>
          <InfoRow icon={LockKeyhole} title={isBn ? 'অ্যাকাউন্ট পরিচয়' : 'Account identity'} description={isBn ? 'সাইন-ইন Telegram পরিচয়ের মাধ্যমে' : 'Sign-in uses Telegram identity'} /><RowDivider />
          <InfoRow icon={theme === 'dark' ? Moon : Sun} title={isBn ? 'থিম' : 'Theme'} description={isBn ? 'অ্যাপের রং ও উজ্জ্বলতা বদলান' : 'Change the app appearance'} onClick={toggleTheme} right={<StatusPill tone="gray">{theme === 'dark' ? (isBn ? 'ডার্ক' : 'Dark') : (isBn ? 'লাইট' : 'Light')}</StatusPill>} /><RowDivider />
          <InfoRow icon={Languages} title={isBn ? 'ভাষা' : 'Language'} description={isBn ? 'বাংলা ও ইংরেজির মধ্যে বদলান' : 'Switch between Bangla and English'} onClick={() => setLanguage(isBn ? 'en' : 'bn')} right={<StatusPill tone="gray">{isBn ? 'বাংলা' : 'English'}</StatusPill>} /><RowDivider />
          <InfoRow icon={soundEnabled ? Volume2 : VolumeX} title={isBn ? 'বাটনের শব্দ' : 'Button sounds'} description={isBn ? 'ট্যাপের শব্দ চালু বা বন্ধ করুন' : 'Turn interface tap sounds on or off'} onClick={() => setSoundEnabled(!soundEnabled)} right={<span className={'fig-profile-toggle ' + (soundEnabled ? 'on' : '')}><span /></span>} /><RowDivider />
          <InfoRow icon={Shield} title={isBn ? 'KYC যাচাই' : 'KYC verification'} description={isBn ? 'প্রোফাইলে তথ্য থাকা মানেই যাচাইকৃত নয়' : 'Profile details do not mean KYC has been verified'} right={<StatusPill tone="gray">{isBn ? 'আলাদা যাচাই' : 'Separate review'}</StatusPill>} />
        </SectionCard>

        <SectionCard title={isBn ? 'সহায়তা' : 'Support'} icon={CircleHelp}>
          <Link to="/support" className="fig-profile-link-row"><InfoRow icon={Headset} title={isBn ? 'লাইভ সাপোর্ট' : 'Live support'} description={isBn ? 'সহায়তার জন্য যোগাযোগ করুন' : 'Contact the support team'} /></Link><RowDivider />
          <Link to="/support#faqs" className="fig-profile-link-row"><InfoRow icon={CircleHelp} title={isBn ? 'সাধারণ প্রশ্ন' : 'FAQs'} description={isBn ? 'সাধারণ প্রশ্ন ও নির্দেশিকা' : 'Common questions and guidance'} /></Link>
        </SectionCard>

        <button type="button" onClick={closeMiniApp} className="fig-profile-logout"><LogOut size={17} /><span>{isBn ? 'মিনি অ্যাপ বন্ধ করুন' : 'Close Mini App'}</span><ChevronRight size={15} /></button>
        <div className="fig-profile-footer"><strong>PROVATI LOAN • PROVATI SOMOBAY SOMITI</strong><span>{isBn ? 'সদস্য সেবা • সংস্করণ ১.১' : 'Member service • Version 1.1'}</span></div>
      </motion.main>
    </div>
  );
}
