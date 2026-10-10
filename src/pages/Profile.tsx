import '../styles/profile-figma.css';
import { getTelegramUser } from '../lib/telegram';
import {
  UserRound, Phone, MapPin, IdCard, FileText, ShieldCheck, Shield,
  LockKeyhole, CircleHelp, Headset, ChevronRight, CheckCircle2,
  LogOut, Sun, Moon, Languages, Volume2, VolumeX, Wallet, ArrowDownToLine, ArrowUpFromLine,
  Pencil, X, Save, LoaderCircle, CalendarDays, Mail, Fingerprint, Landmark,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '../lib/store';
import { type ReactNode, type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { convertDigits } from '../lib/translation';
import { AddressSelector, AddressValue, emptyAddress } from '../components/AddressSelector';
import { getMyProfile, updateMyProfile, type ProfilePersonalDetails } from '../lib/api';
import { toast } from 'sonner';

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

type ProfileEditorFields = {
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  mobile: string;
  whatsapp: string;
  email: string;
  nidNumber: string;
  eTin: string;
  bloodGroup: string;
  maritalStatus: string;
  spouseProfession: string;
  spouseIncome: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  mobileBanking: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineeMobile: string;
  nomineeNid: string;
};

const blankProfileEditor: ProfileEditorFields = {
  fullName: '', fatherName: '', motherName: '', dob: '', gender: '',
  mobile: '', whatsapp: '', email: '', nidNumber: '', eTin: '',
  bloodGroup: '', maritalStatus: '', spouseProfession: '', spouseIncome: '',
};

function profileAddress(value: unknown, fallback?: string | null): AddressValue {
  let source = value;
  if (typeof source === 'string') {
    try { source = JSON.parse(source); } catch { source = null; }
  }
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    return { ...emptyAddress(), ...(source as Partial<AddressValue>) };
  }
  if (fallback?.trim()) return { ...emptyAddress(), village: fallback.trim() };
  return emptyAddress();
}

export default function Profile() {
  const user = getTelegramUser();
  const navigate = useNavigate();
  const {
    theme, toggleTheme, language, setLanguage, soundEnabled, setSoundEnabled, userProfile, setUserProfile,
  } = useAppStore();
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [editorFields, setEditorFields] = useState<ProfileEditorFields>(blankProfileEditor);
  const [editorCurrentAddress, setEditorCurrentAddress] = useState<AddressValue>(emptyAddress());
  const [editorPermanentAddress, setEditorPermanentAddress] = useState<AddressValue>(emptyAddress());
  const isBn = language === 'bn';

  useEffect(() => {
    getMyProfile()
      .then(profile => { if (profile) setUserProfile(profile); })
      .catch(error => console.error('Profile refresh failed:', error));
  }, [setUserProfile]);

  const openProfileEditor = () => {
    const details = (userProfile?.personal_details || {}) as Partial<ProfilePersonalDetails>;
    setEditorFields({
      fullName: details.fullName || [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(' '),
      fatherName: details.fatherName || '',
      motherName: details.motherName || '',
      dob: details.dob || '',
      gender: details.gender || '',
      mobile: details.mobile || userProfile?.phone || '',
      whatsapp: details.whatsapp || '',
      email: details.email || '',
      nidNumber: details.nidNumber || userProfile?.nid_number || '',
      eTin: details.eTin || '',
      bloodGroup: details.bloodGroup || '',
      maritalStatus: details.maritalStatus || '',
      spouseProfession: details.spouseProfession || '',
      spouseIncome: details.spouseIncome || '',
      bankName: details.bankName || '',
      accountName: details.accountName || '',
      accountNumber: details.accountNumber || '',
      routingNumber: details.routingNumber || '',
      mobileBanking: details.mobileBanking || '',
      nomineeName: details.nomineeName || '',
      nomineeRelation: details.nomineeRelation || '',
      nomineeMobile: details.nomineeMobile || '',
      nomineeNid: details.nomineeNid || '',
    });
    setEditorCurrentAddress(profileAddress(details.currentAddress, userProfile?.address));
    setEditorPermanentAddress(profileAddress(details.permanentAddress));
    setProfileEditorOpen(true);
  };

  const updateEditorField = (key: keyof ProfileEditorFields, value: string) => {
    setEditorFields(previous => ({ ...previous, [key]: value }));
  };

  const saveProfileEditor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (profileSaving) return;
    setProfileSaving(true);
    try {
      const payload: ProfilePersonalDetails = {
        ...editorFields,
        currentAddress: editorCurrentAddress as unknown as Record<string, string>,
        permanentAddress: editorPermanentAddress as unknown as Record<string, string>,
      };
      const saved = await updateMyProfile(payload);
      if (!saved) throw new Error('Profile was not saved');
      setUserProfile(saved);
      setProfileEditorOpen(false);
      toast.success(isBn ? 'প্রোফাইল সফলভাবে আপডেট হয়েছে' : 'Profile updated successfully');
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error(isBn ? 'প্রোফাইল আপডেট করা যায়নি। আবার চেষ্টা করুন।' : 'Could not update your profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Telegram User';
  const memberName = [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(' ') || fullName;
  const memberId = 'PSS-' + String(userProfile?.chat_id ?? user.id).slice(-6);
  const phone = userProfile?.phone?.trim() ? maskTail(userProfile.phone) : displayOrMissing(null, isBn);
  const address = displayOrMissing(userProfile?.address, isBn);
  const nid = userProfile?.nid_number?.trim() ? maskTail(userProfile.nid_number) : displayOrMissing(null, isBn);
  const personalDetails = (userProfile?.personal_details || {}) as Record<string, any>;
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
        <div className="fig-profile-edit-bar">
          <div>
            <strong>{isBn ? 'আপনার তথ্য হালনাগাদ রাখুন' : 'Keep your information up to date'}</strong>
            <span>{isBn ? 'এখানে সেভ করা তথ্য লোন আবেদনে অটো-ফিল হবে।' : 'Saved details will prefill your loan application.'}</span>
          </div>
          <button type="button" onClick={openProfileEditor}><Pencil size={15} />{isBn ? 'তথ্য সম্পাদনা' : 'Edit details'}</button>
        </div>
        <div className="fig-profile-separator" />

        <SectionCard title={isBn ? 'সদস্য পরিচিতি' : 'Member information'} icon={UserRound}>
          <InfoRow icon={UserRound} title={isBn ? 'Telegram নাম' : 'Telegram name'} value={memberName} /><RowDivider />
          <InfoRow icon={IdCard} title={isBn ? 'সদস্য আইডি' : 'Member ID'} value={memberId} /><RowDivider />
          <InfoRow icon={FileText} title={isBn ? 'Telegram ইউজারনেম' : 'Telegram username'} value={user.username ? '@' + user.username : displayOrMissing(null, isBn)} /><RowDivider />
          <InfoRow icon={IdCard} title={isBn ? 'জাতীয় পরিচয়পত্র' : 'National ID'} value={nid} onClick={openProfileEditor} />
        </SectionCard>

        <SectionCard title={isBn ? 'লোন আবেদনের ব্যক্তিগত তথ্য' : 'Loan application details'} icon={Fingerprint} action={<button type="button" className="fig-profile-text-action" onClick={openProfileEditor}>{isBn ? 'সম্পাদনা' : 'Edit'}</button>}>
          <InfoRow icon={UserRound} title={isBn ? 'আবেদনকারীর নাম' : 'Applicant name'} value={displayOrMissing((userProfile?.personal_details as any)?.fullName, isBn)} onClick={openProfileEditor} /><RowDivider />
          <InfoRow icon={UserRound} title={isBn ? 'পিতার নাম' : "Father's name"} value={displayOrMissing((userProfile?.personal_details as any)?.fatherName, isBn)} onClick={openProfileEditor} /><RowDivider />
          <InfoRow icon={UserRound} title={isBn ? 'মাতার নাম' : "Mother's name"} value={displayOrMissing((userProfile?.personal_details as any)?.motherName, isBn)} onClick={openProfileEditor} /><RowDivider />
          <InfoRow icon={CalendarDays} title={isBn ? 'জন্ম তারিখ' : 'Date of birth'} value={displayOrMissing((userProfile?.personal_details as any)?.dob, isBn)} onClick={openProfileEditor} /><RowDivider />
          <InfoRow icon={Mail} title={isBn ? 'ইমেইল' : 'Email'} value={displayOrMissing((userProfile?.personal_details as any)?.email, isBn)} onClick={openProfileEditor} />
        </SectionCard>

        <SectionCard title={isBn ? 'ব্যাংক ও নমিনি তথ্য' : 'Bank & nominee details'} icon={Wallet} action={<button type="button" className="fig-profile-text-action" onClick={openProfileEditor}>{isBn ? 'সম্পাদনা' : 'Edit'}</button>}>
          <InfoRow icon={Landmark} title={isBn ? 'ব্যাংক' : 'Bank'} value={displayOrMissing(personalDetails.bankName, isBn)} onClick={openProfileEditor} /><RowDivider />
          <InfoRow icon={UserRound} title={isBn ? 'হিসাবের নাম' : 'Account name'} value={displayOrMissing(personalDetails.accountName, isBn)} onClick={openProfileEditor} /><RowDivider />
          <InfoRow icon={Wallet} title={isBn ? 'হিসাব নম্বর' : 'Account number'} value={personalDetails.accountNumber ? maskTail(personalDetails.accountNumber) : displayOrMissing(null, isBn)} onClick={openProfileEditor} /><RowDivider />
          <InfoRow icon={UserRound} title={isBn ? 'নমিনি' : 'Nominee'} value={displayOrMissing(personalDetails.nomineeName, isBn)} onClick={openProfileEditor} /><RowDivider />
          <InfoRow icon={Phone} title={isBn ? 'নমিনির মোবাইল' : 'Nominee mobile'} value={personalDetails.nomineeMobile ? maskTail(personalDetails.nomineeMobile) : displayOrMissing(null, isBn)} onClick={openProfileEditor} />
        </SectionCard>

        <SectionCard title={isBn ? 'যোগাযোগ' : 'Contact'} icon={Phone}>
          <InfoRow icon={Phone} title={isBn ? 'মোবাইল' : 'Mobile'} value={phone} description={isBn ? 'সংরক্ষিত নম্বরের শেষ চারটি অঙ্ক দেখানো হচ্ছে' : 'Only the last four digits of a saved number are shown'} onClick={openProfileEditor} /><RowDivider />
          <InfoRow icon={MapPin} title={isBn ? 'ঠিকানা' : 'Address'} value={address} description={isBn ? 'প্রোফাইলে থাকা ঠিকানা' : 'Address currently saved in your profile'} onClick={openProfileEditor} />
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
        {profileEditorOpen && (
          <div className="fig-profile-editor-overlay" role="presentation" onClick={() => !profileSaving && setProfileEditorOpen(false)}>
            <section className="fig-profile-editor" role="dialog" aria-modal="true" aria-label={isBn ? 'প্রোফাইল সম্পাদনা' : 'Edit profile'} onClick={event => event.stopPropagation()}>
              <header className="fig-profile-editor-head">
                <div><span>{isBn ? 'সদস্য তথ্য' : 'MEMBER DETAILS'}</span><h2>{isBn ? 'প্রোফাইল আপডেট করুন' : 'Update your profile'}</h2><p>{isBn ? 'এখানে সেভ করা তথ্য পরবর্তী লোন আবেদনে স্বয়ংক্রিয়ভাবে পূরণ হবে।' : 'Saved details will automatically fill matching loan application fields.'}</p></div>
                <button type="button" aria-label={isBn ? 'বন্ধ করুন' : 'Close'} disabled={profileSaving} onClick={() => setProfileEditorOpen(false)}><X size={20}/></button>
              </header>
              <form onSubmit={saveProfileEditor} className="fig-profile-editor-form">
                <div className="fig-profile-editor-grid">
                  <label>{isBn ? 'আবেদনকারীর পূর্ণ নাম' : 'Applicant full name'}<input required minLength={3} maxLength={120} value={editorFields.fullName} onChange={e => updateEditorField('fullName',e.target.value)} autoComplete="name"/></label>
                  <label>{isBn ? 'পিতার নাম' : "Father's name"}<input value={editorFields.fatherName} onChange={e => updateEditorField('fatherName',e.target.value)} maxLength={120}/></label>
                  <label>{isBn ? 'মাতার নাম' : "Mother's name"}<input value={editorFields.motherName} onChange={e => updateEditorField('motherName',e.target.value)} maxLength={120}/></label>
                  <label>{isBn ? 'জন্ম তারিখ' : 'Date of birth'}<input type="date" value={editorFields.dob} onChange={e => updateEditorField('dob',e.target.value)}/></label>
                  <label>{isBn ? 'লিঙ্গ' : 'Gender'}<select value={editorFields.gender} onChange={e => updateEditorField('gender',e.target.value)}><option value="">{isBn ? 'নির্বাচন করুন' : 'Select'}</option><option value="Male">{isBn ? 'পুরুষ' : 'Male'}</option><option value="Female">{isBn ? 'নারী' : 'Female'}</option><option value="Other">{isBn ? 'অন্যান্য' : 'Other'}</option></select></label>
                  <label>{isBn ? 'মোবাইল নম্বর' : 'Mobile number'}<input inputMode="tel" autoComplete="tel" maxLength={20} value={editorFields.mobile} onChange={e => updateEditorField('mobile',e.target.value)} placeholder="01XXXXXXXXX"/></label>
                  <label>{isBn ? 'হোয়াটসঅ্যাপ নম্বর' : 'WhatsApp number'}<input inputMode="tel" maxLength={20} value={editorFields.whatsapp} onChange={e => updateEditorField('whatsapp',e.target.value)}/></label>
                  <label>{isBn ? 'ইমেইল' : 'Email'}<input type="email" autoComplete="email" maxLength={254} value={editorFields.email} onChange={e => updateEditorField('email',e.target.value)}/></label>
                  <label>{isBn ? 'জাতীয় পরিচয়পত্র (NID)' : 'National ID number'}<input inputMode="numeric" maxLength={40} value={editorFields.nidNumber} onChange={e => updateEditorField('nidNumber',e.target.value)}/></label>
                  <label>{isBn ? 'ই-টিন (ঐচ্ছিক)' : 'e-TIN (optional)'}<input maxLength={40} value={editorFields.eTin} onChange={e => updateEditorField('eTin',e.target.value)}/></label>
                  <label>{isBn ? 'রক্তের গ্রুপ' : 'Blood group'}<select value={editorFields.bloodGroup} onChange={e => updateEditorField('bloodGroup',e.target.value)}><option value="">{isBn ? 'নির্বাচন করুন' : 'Select'}</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(group=><option key={group} value={group}>{group}</option>)}</select></label>
                  <label>{isBn ? 'বৈবাহিক অবস্থা' : 'Marital status'}<select value={editorFields.maritalStatus} onChange={e => updateEditorField('maritalStatus',e.target.value)}><option value="">{isBn ? 'নির্বাচন করুন' : 'Select'}</option><option value="Single">{isBn ? 'অবিবাহিত' : 'Single'}</option><option value="Married">{isBn ? 'বিবাহিত' : 'Married'}</option><option value="Widowed">{isBn ? 'বিধবা/বিপত্নীক' : 'Widowed'}</option><option value="Divorced">{isBn ? 'তালাকপ্রাপ্ত' : 'Divorced'}</option></select></label>
                  <label>{isBn ? 'স্বামী/স্ত্রীর পেশা (ঐচ্ছিক)' : 'Spouse profession (optional)'}<input maxLength={120} value={editorFields.spouseProfession} onChange={e => updateEditorField('spouseProfession',e.target.value)}/></label>
                  <label>{isBn ? 'স্বামী/স্ত্রীর আয় (ঐচ্ছিক)' : 'Spouse income (optional)'}<input inputMode="numeric" maxLength={30} value={editorFields.spouseIncome} onChange={e => updateEditorField('spouseIncome',e.target.value)}/></label>
                </div>
                <h3 className="fig-profile-editor-subhead">{isBn ? 'ব্যাংক ও নমিনি তথ্য' : 'Bank & nominee details'}</h3>
                <div className="fig-profile-editor-grid">
                  <label>{isBn ? 'ব্যাংকের নাম' : 'Bank name'}<input autoComplete="off" maxLength={120} value={editorFields.bankName} onChange={e => updateEditorField('bankName',e.target.value)}/></label>
                  <label>{isBn ? 'হিসাবের নাম' : 'Account name'}<input autoComplete="off" maxLength={120} value={editorFields.accountName} onChange={e => updateEditorField('accountName',e.target.value)}/></label>
                  <label>{isBn ? 'ব্যাংক হিসাব নম্বর' : 'Bank account number'}<input autoComplete="off" inputMode="numeric" maxLength={50} value={editorFields.accountNumber} onChange={e => updateEditorField('accountNumber',e.target.value)}/></label>
                  <label>{isBn ? 'রাউটিং নম্বর (ঐচ্ছিক)' : 'Routing number (optional)'}<input autoComplete="off" inputMode="numeric" maxLength={30} value={editorFields.routingNumber} onChange={e => updateEditorField('routingNumber',e.target.value)}/></label>
                  <label>{isBn ? 'মোবাইল ব্যাংকিং (ঐচ্ছিক)' : 'Mobile banking (optional)'}<input autoComplete="off" maxLength={50} value={editorFields.mobileBanking} onChange={e => updateEditorField('mobileBanking',e.target.value)}/></label>
                  <label>{isBn ? 'নমিনির নাম' : 'Nominee name'}<input maxLength={120} value={editorFields.nomineeName} onChange={e => updateEditorField('nomineeName',e.target.value)}/></label>
                  <label>{isBn ? 'নমিনির সঙ্গে সম্পর্ক' : 'Nominee relationship'}<input maxLength={80} value={editorFields.nomineeRelation} onChange={e => updateEditorField('nomineeRelation',e.target.value)}/></label>
                  <label>{isBn ? 'নমিনির মোবাইল' : 'Nominee mobile'}<input inputMode="tel" maxLength={20} value={editorFields.nomineeMobile} onChange={e => updateEditorField('nomineeMobile',e.target.value)}/></label>
                  <label>{isBn ? 'নমিনির NID' : 'Nominee NID'}<input inputMode="numeric" maxLength={40} value={editorFields.nomineeNid} onChange={e => updateEditorField('nomineeNid',e.target.value)}/></label>
                </div>
                <div className="fig-profile-editor-address"><AddressSelector label={isBn ? 'বর্তমান ঠিকানা' : 'Current address'} value={editorCurrentAddress} onChange={setEditorCurrentAddress} isBn={isBn} prefix="profile-current" showDetailedFields showOwnershipFields /></div>
                <div className="fig-profile-editor-address"><AddressSelector label={isBn ? 'স্থায়ী ঠিকানা (NID অনুযায়ী)' : 'Permanent address (as per NID)'} value={editorPermanentAddress} onChange={setEditorPermanentAddress} isBn={isBn} prefix="profile-permanent" showDetailedFields /></div>
                <div className="fig-profile-editor-note"><ShieldCheck size={17}/><span>{isBn ? 'শুধু আপনার নিজের প্রোফাইলের তথ্য আপডেট হবে। ব্যাংক ও নমিনির তথ্য প্রতিটি আবেদনেই আলাদাভাবে যাচাই করে দিতে হবে।' : 'Only your own profile information is updated. Bank and nominee details should still be reviewed for each application.'}</span></div>
                <footer className="fig-profile-editor-actions">
                  <button type="button" disabled={profileSaving} onClick={() => setProfileEditorOpen(false)}>{isBn ? 'বাতিল' : 'Cancel'}</button>
                  <button type="submit" disabled={profileSaving}>{profileSaving ? <LoaderCircle size={16} className="animate-spin"/> : <Save size={16}/>} {profileSaving ? (isBn ? 'সেভ হচ্ছে…' : 'Saving…') : (isBn ? 'প্রোফাইল সেভ করুন' : 'Save profile')}</button>
                </footer>
              </form>
            </section>
          </div>
        )}
      </motion.main>
    </div>
  );
}
