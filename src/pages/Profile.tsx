import { getTelegramUser } from '../lib/telegram';
import {
  ShieldCheck,
  HelpCircle,
  ChevronRight,
  Moon,
  Sun,
  Languages,
  Volume2,
  VolumeX,
  UserRound,
  IdCard,
  MapPin,
  Phone,
  MessageCircle,
  LockKeyhole,
  Bell,
  FileText,
  Copy,
  Check,
  LogOut,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '../lib/store';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const user = getTelegramUser();
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    soundEnabled,
    setSoundEnabled,
    userProfile,
  } = useAppStore();

  const [copied, setCopied] = useState(false);
  const isBn = language === 'bn';

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
  const memberName = [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(' ') || fullName;
  const memberId = userProfile?.chat_id ? `PSS-${String(userProfile.chat_id).slice(-6)}` : 'PSS-MEMBER';
  const accountState = userProfile?.is_locked
    ? (isBn ? 'অ্যাকাউন্ট লকড' : 'Account locked')
    : userProfile?.is_banned
      ? (isBn ? 'অ্যাকাউন্ট সীমাবদ্ধ' : 'Account restricted')
      : (isBn ? 'সক্রিয় সদস্য' : 'Active member');

  const copyTelegramId = async () => {
    try {
      await navigator.clipboard.writeText(String(user.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be unavailable inside some Telegram WebViews.
    }
  };

  const Row = ({
    icon: Icon,
    title,
    description,
    onClick,
    right,
    tone = 'default',
  }: {
    icon: typeof UserRound;
    title: string;
    description?: string;
    onClick?: () => void;
    right?: React.ReactNode;
    tone?: 'default' | 'danger';
  }) => {
    const content = (
      <>
        <div className={`profile-row-icon w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          tone === 'danger'
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
        }`}>
          <Icon size={19} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className={`font-bold text-sm ${
            tone === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
          }`}>{title}</div>
          {description && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-4">{description}</div>}
        </div>
        {right ?? <ChevronRight size={17} className="text-slate-400 shrink-0" />}
      </>
    );

    if (onClick) {
      return (
        <button type="button" onClick={onClick} className="w-full flex items-center gap-3.5 px-3 py-3 text-left active:scale-[0.99] transition-transform">
          {content}
        </button>
      );
    }

    return <div className="w-full flex items-center gap-3.5 px-3 py-3">{content}</div>;
  };

  return (
    <div className="profile-theme min-h-full bg-white dark:bg-black text-slate-900 dark:text-slate-100 pb-[calc(6rem+env(safe-area-inset-bottom))] transition-colors">
      {/* Profile identity — modern member hero */}
      <section className="profile-hero-wrap">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="profile-hero"
        >
          <div className="profile-hero-bg">
            <div className="profile-hero-orb profile-hero-orb-a" />
            <div className="profile-hero-orb profile-hero-orb-b" />
            <div className="profile-hero-wave" />
            <div className="profile-hero-title">{isBn ? 'আমার প্রোফাইল' : 'My Profile'}</div>
          </div>

          <div className="profile-hero-content">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar-ring">
                <img
                  src={user.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=14b8a6&color=fff&bold=true`}
                  alt={isBn ? 'প্রোফাইল ছবি' : 'Profile photo'}
                  className="profile-avatar"
                  onError={(e) => {
                    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=14b8a6&color=fff&bold=true`;
                    if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                  }}
                />
              </div>
              <span className="profile-online-dot" />
            </div>

            <div className="profile-hero-name">
              <h1>{memberName}</h1>
              <span className="profile-verified"><ShieldCheck size={15} /> {accountState}</span>
            </div>
            <p className="profile-hero-username">@{user.username || 'telegram-user'}</p>

            <div className="profile-stat-grid">
              <div className="profile-stat">
                <span>{isBn ? 'সদস্য আইডি' : 'MEMBER ID'}</span>
                <strong>{memberId}</strong>
              </div>
              <div className="profile-stat">
                <span>TELEGRAM ID</span>
                <strong>{user.id}</strong>
              </div>
              <div className="profile-stat profile-stat-action">
                <span>{isBn ? 'অ্যাকাউন্ট' : 'ACCOUNT'}</span>
                <strong>{accountState}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => document.getElementById('profile-member-info')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="profile-primary-action"
            >
              <UserRound size={18} />
              {isBn ? 'প্রোফাইল তথ্য দেখুন' : 'View Profile Information'}
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Member information */}
      <section id="profile-member-info" className="profile-section profile-section-member px-4 mt-5">
        <SectionTitle title={isBn ? 'সদস্য তথ্য' : 'Member information'} />
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
          <Row icon={UserRound} title={isBn ? 'ব্যক্তিগত তথ্য' : 'Personal information'} description={isBn ? 'নাম ও প্রাথমিক সদস্য তথ্য' : 'Name and basic member details'} />
          <Divider />
          <Row
            icon={Phone}
            title={isBn ? 'মোবাইল নম্বর' : 'Mobile number'}
            description={userProfile?.phone || (isBn ? 'প্রোফাইলে এখনো যোগ করা হয়নি' : 'Not added to profile')}
          />
          <Divider />
          <Row
            icon={MapPin}
            title={isBn ? 'ঠিকানা' : 'Address'}
            description={userProfile?.address || (isBn ? 'প্রোফাইলে এখনো যোগ করা হয়নি' : 'Not added to profile')}
          />
          <Divider />
          <Row icon={IdCard} title={isBn ? 'পরিচয় ও ডকুমেন্ট' : 'Identity & documents'} description={isBn ? 'আপনার জমা দেওয়া তথ্য ও নথি' : 'Submitted identity information and documents'} />
        </div>
      </section>

      {/* Account & security */}
      <section className="profile-section profile-section-security px-4 mt-5">
        <SectionTitle title={isBn ? 'অ্যাকাউন্ট ও নিরাপত্তা' : 'Account & security'} />
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
          <Row icon={LockKeyhole} title={isBn ? 'নিরাপত্তা' : 'Security'} description={isBn ? 'Telegram ভিত্তিক অ্যাকাউন্ট পরিচয়' : 'Telegram-based account identity'} />
          <Divider />
          <Row icon={Bell} title={isBn ? 'নোটিফিকেশন' : 'Notifications'} description={isBn ? 'লোন ও লেনদেনের আপডেট' : 'Loan and transaction updates'} />
          <Divider />
          <Row icon={FileText} title={isBn ? 'আমার ডকুমেন্ট' : 'My documents'} description={isBn ? 'আবেদনের সঙ্গে জমা দেওয়া নথি' : 'Documents submitted with applications'} />
        </div>
      </section>

      {/* Preferences */}
      <section className="profile-section profile-section-preferences px-4 mt-5">
        <SectionTitle title={isBn ? 'পছন্দ ও অ্যাপ সেটিংস' : 'Preferences & app settings'} />
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
          <Row
            icon={theme === 'dark' ? Moon : Sun}
            title={isBn ? 'ডার্ক মোড' : 'Dark mode'}
            description={theme === 'dark' ? (isBn ? 'চালু আছে' : 'Enabled') : (isBn ? 'বন্ধ আছে' : 'Disabled')}
            onClick={toggleTheme}
            right={
              <span className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                theme === 'dark' ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}>
                <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  theme === 'dark' ? 'translate-x-5' : ''
                }`} />
              </span>
            }
          />
          <Divider />
          <Row
            icon={Languages}
            title={isBn ? 'ভাষা' : 'Language'}
            description={isBn ? 'বাংলা' : 'English'}
            onClick={() => setLanguage(isBn ? 'en' : 'bn')}
            right={<span className="text-xs font-black text-sky-600 dark:text-sky-400">{isBn ? 'বাংলা' : 'EN'}</span>}
          />
          <Divider />
          <Row
            icon={soundEnabled ? Volume2 : VolumeX}
            title={isBn ? 'ক্লিক সাউন্ড' : 'Click sounds'}
            description={soundEnabled ? (isBn ? 'চালু আছে' : 'Enabled') : (isBn ? 'বন্ধ আছে' : 'Disabled')}
            onClick={() => setSoundEnabled(!soundEnabled)}
            right={
              <span className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                soundEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}>
                <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  soundEnabled ? 'translate-x-5' : ''
                }`} />
              </span>
            }
          />
        </div>
      </section>

      {/* Support */}
      <section className="profile-section profile-section-support px-4 mt-5">
        <SectionTitle title={isBn ? 'সহায়তা' : 'Support'} />
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
          <Link to="/support" className="block">
            <Row icon={HelpCircle} title={isBn ? 'সাপোর্ট ও সাহায্য' : 'Support & help'} description={isBn ? 'FAQ ও লাইভ সাপোর্ট' : 'FAQ and live support'} />
          </Link>
        </div>
      </section>

      {/* Telegram account note */}
      <section className="profile-section profile-section-telegram px-4 mt-5">
        <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 p-4 flex gap-3">
          <MessageCircle className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" size={19} />
          <div>
            <p className="text-sm font-black text-sky-900 dark:text-sky-200">{isBn ? 'Telegram অ্যাকাউন্ট' : 'Telegram account'}</p>
            <p className="text-[11px] leading-5 text-sky-700 dark:text-sky-300 mt-1">
              {isBn
                ? 'এই Mini App আপনার Telegram পরিচয়ের সঙ্গে সংযুক্ত। আলাদা username/password তৈরি করার প্রয়োজন নেই।'
                : 'This Mini App is linked to your Telegram identity. No separate username or password is required.'}
            </p>
          </div>
        </div>
      </section>

      <p className="px-5 pt-6 pb-4 text-center text-[10px] font-bold text-slate-400">
        PROVATI LOAN • PROVATI SOMOBAY SOMITI
      </p>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{title}</h2>;
}

function Divider() {
  return <div className="ml-[72px] border-t border-slate-100 dark:border-slate-800" />;
}
