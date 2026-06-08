'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';

type Language = 'EN' | 'JP';

const translations = {
  EN: {
    nav: {
      features: 'Features',
      getStarted: 'Get Started',
    },
    badge: 'Web3 Payment Infrastructure',
    hero: {
      title: ['No Reserve.', 'Instant Settlement.', 'Web3 Payments.'],
      subtitle: 'White-label Web3 payment infrastructure for every merchant. 2.5% fee via smart contract. Zero reserve, instant to your wallet.',
    },
    buttons: {
      getStarted: 'Get Started',
      seeDemo: 'See Demo',
    },
    features: {
      fee: {
        title: '2.5% Fee Only',
        desc: 'No reserve, instant to wallet',
      },
      instant: {
        title: 'Instant Settlement',
        desc: 'Funds arrive in seconds',
      },
      whitelabel: {
        title: 'White Label',
        desc: 'Independent environment per merchant',
      },
    },
    howItWorks: {
      title: 'How It Works',
      subtitle: 'Get started in 10 minutes',
      steps: [
        { title: 'Connect Wallet', desc: 'Connect MetaMask or Crossmint wallet' },
        { title: 'Setup Your Shop', desc: 'Register shop name and receiving wallet' },
        { title: 'Add Products', desc: 'Set product name and price in USDC' },
        { title: 'Share & Sell', desc: 'Share payment link and start selling instantly' },
      ],
    },
    pricing: {
      title: 'Simple Pricing',
      subtitle: 'No monthly fees. Pay only when you sell.',
    },
    faq: {
      title: 'Frequently Asked Questions',
      items: [
        { q: 'What is Streak?', a: 'Streak is a white-label Web3 payment platform that enables merchants to accept payments instantly without reserve periods. We use smart contracts to automatically distribute fees (2.5%) and send the remaining funds directly to your wallet.' },
        { q: 'Do I need crypto knowledge?', a: 'No. Just connect your wallet and start selling. Our platform handles all the technical complexity, so you can focus on running your business.' },
        { q: 'When do I receive my funds?', a: 'Instantly. Funds are sent directly to your wallet via smart contract. There are no settlement delays or hold periods.' },
        { q: 'Is there a reserve or hold period?', a: 'Never. Unlike traditional payment processors, Streak never holds your funds. What you sell is what you get, instantly.' },
        { q: 'What payment methods are supported?', a: 'MetaMask, credit card (via Crossmint), Apple Pay, and Google Pay. We support multiple entry points so your customers can choose their preferred payment method.' },
      ],
    },
  },
  JP: {
    nav: {
      features: '特徴',
      getStarted: '始める',
    },
    badge: 'WEB3決済プラットフォーム',
    hero: {
      title: ['リザーブなし。', '即時着金。', 'WEB3決済。'],
      subtitle: '加盟店ごとに独立したホワイトラベル型のWEB3決済環境。スマートコントラクトで手数料2.5%を自動受取。リザーブなし、資金は即座にあなたのウォレットへ。',
    },
    buttons: {
      getStarted: '今すぐ始める',
      seeDemo: 'デモを見る',
    },
    features: {
      fee: {
        title: '手数料2.5%のみ',
        desc: 'リザーブなし・即座にウォレットへ',
      },
      instant: {
        title: '即時着金',
        desc: '資金は数秒でウォレットに届く',
      },
      whitelabel: {
        title: 'ホワイトラベル',
        desc: '加盟店ごとに独立した決済環境',
      },
    },
    howItWorks: {
      title: 'はじめ方',
      subtitle: '10分で販売開始',
      steps: [
        { title: 'ウォレット接続', desc: 'MetaMaskまたはCrossmintウォレットを接続' },
        { title: 'ショップ設定', desc: 'ショップ名と受取ウォレットを登録' },
        { title: '商品追加', desc: '商品名と価格（USDC）を設定' },
        { title: 'シェアして売上', desc: '決済リンクをシェアしてすぐに販売開始' },
      ],
    },
    pricing: {
      title: 'シンプルな料金体系',
      subtitle: '月額不要。売れた時だけ。',
    },
    faq: {
      title: 'よくある質問',
      items: [
        { q: 'Streakとは？', a: 'Streakはホワイトラベル型のWEB3決済プラットフォームで、加盟店がリザーブなしで即座に決済を受け付けることができます。スマートコントラクトにより手数料（2.5%）を自動分配し、残りの資金を直接ウォレットに送付します。' },
        { q: '暗号資産の知識が必要ですか？', a: 'いいえ。ウォレットを接続してすぐに販売を開始できます。複雑な技術はすべてプラットフォームが対応するので、ビジネスに専念できます。' },
        { q: 'いつ資金を受け取れますか？', a: 'すぐにです。資金はスマートコントラクト経由でウォレットに送付されます。決済延長や保留期間はありません。' },
        { q: 'リザーブ期間や保留はありますか？', a: 'ありません。従来の決済プロセッサーと異なり、Streakは資金を保留しません。売上がそのまま即座に受け取れます。' },
        { q: 'どの決済方法に対応していますか？', a: 'MetaMask、クレジットカード（Crossmint経由）、Apple Pay、Google Payに対応しています。複数の決済手段があるため、顧客が好みの方法を選べます。' },
      ],
    },
  },
};

export default function Home() {
  const [language, setLanguage] = useState<Language>('EN');
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 overflow-hidden">
      {/* Background Gradient Accent */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-gray-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-gray-300/20 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Image 
            src="/images/logo.png" 
            alt="STREAK Logo" 
            width={120} 
            height={40}
            priority
            className="h-10 w-auto"
          />
          <div className="hidden md:flex gap-8 items-center">
            <a href="#features" className="text-gray-700 hover:text-gray-900 transition font-medium">
              {t.nav.features}
            </a>
            <a href="#cta" className="text-gray-700 hover:text-gray-900 transition font-medium">
              {t.nav.getStarted}
            </a>
            <Link
              href="/login"
              className="px-5 py-2 rounded-full border border-gray-300 text-gray-900 font-medium hover:bg-black hover:text-white hover:border-black transition-all"
            >
              Login →
            </Link>
            {/* Language Toggle */}
            <div className="flex gap-2 border border-gray-300 rounded-full p-1">
              <button
                onClick={() => setLanguage('EN')}
                className={`px-4 py-1 rounded-full transition-all font-medium ${
                  language === 'EN'
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('JP')}
                className={`px-4 py-1 rounded-full transition-all font-medium ${
                  language === 'JP'
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                JP
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 border border-gray-400">
              <span className="w-2 h-2 rounded-full bg-black" />
              <span className="text-sm font-medium text-gray-900">{t.badge}</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900">
                {t.hero.title[0]}
                <br />
                <span className="text-black">
                  {t.hero.title[1]}
                </span>
                <br />
                {t.hero.title[2]}
              </h1>
              <p className="text-lg text-gray-600 max-w-lg leading-relaxed font-light">
                {t.hero.subtitle}
              </p>
            </div>

            {/* CTA Button */}
            <div className="pt-4 flex gap-4">
              <Link
                id="cta"
                href="/login"
                className="px-8 py-4 rounded-full bg-black text-white font-semibold hover:shadow-lg hover:shadow-black/30 transition-all duration-300 text-lg"
              >
                {t.buttons.getStarted}
              </Link>
              <button className="px-8 py-4 rounded-full border border-black text-black font-semibold hover:bg-black hover:text-white transition-all duration-300 text-lg">
                {t.buttons.seeDemo}
              </button>
            </div>
          </div>

          {/* Right Visual - Hero Image */}
          <div className="relative h-96 md:h-full flex items-center justify-center bg-white rounded-3xl">
            <Image 
              src="/images/hero.png" 
              alt="Web3 Payment Platform Illustration" 
              width={500} 
              height={500}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: t.features.fee.title,
              description: t.features.fee.desc,
              icon: '/images/fee-icon.png',
            },
            {
              title: t.features.instant.title,
              description: t.features.instant.desc,
              icon: '/images/instant-icon.png',
            },
            {
              title: t.features.whitelabel.title,
              description: t.features.whitelabel.desc,
              icon: '/images/whitelabel-icon.png',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="group p-8 rounded-3xl bg-white border border-gray-200 hover:shadow-lg hover:border-gray-400 transition-all duration-300 cursor-pointer"
            >
              <div className="w-20 h-20 mb-4 bg-gray-100 rounded-2xl flex items-center justify-center shadow-md">
                <Image 
                  src={feature.icon} 
                  alt={feature.title} 
                  width={80} 
                  height={80}
                  className="w-16 h-16"
                />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-700 font-light">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* How It Works Section */}
        <div className="mt-24 pt-24 border-t border-gray-200">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">{t.howItWorks.title}</h2>
            <p className="text-lg text-gray-600 font-light">{t.howItWorks.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {t.howItWorks.steps.map((item, idx) => (
              <div key={idx + 1} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg mb-4">
                    {idx + 1}
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 font-light">{item.desc}</p>
                </div>
                {idx + 1 < 4 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[100%] h-0.5 bg-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mt-24 pt-24 border-t border-gray-200">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">{t.pricing.title}</h2>
            <p className="text-lg text-gray-600 font-light">{t.pricing.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: language === 'EN' ? 'Free' : '無料', price: language === 'EN' ? '0' : '$0', fee: language === 'EN' ? '2.5%' : '2.5%', features: language === 'EN' ? ['Transaction fee 2.5%', 'Up to 5 products', 'Payment link'] : ['手数料 2.5%', '最大5商品', '決済リンク'] },
              { name: language === 'EN' ? 'Starter' : 'スターター', price: language === 'EN' ? '$9.80/mo' : '$9.80/月', fee: language === 'EN' ? '2.0%' : '2.0%', features: language === 'EN' ? ['Transaction fee 2.0%', 'Up to 50 products', 'Email notifications'] : ['手数料 2.0%', '最大50商品', 'メール通知'] },
              { name: language === 'EN' ? 'Pro' : 'プロ', price: language === 'EN' ? '$49.80/mo' : '$49.80/月', fee: language === 'EN' ? '1.5%' : '1.5%', features: language === 'EN' ? ['Transaction fee 1.5%', 'Unlimited products', 'Custom domain', 'Priority support'] : ['手数料 1.5%', '無制限商品', 'カスタムドメイン', '優先サポート'], highlight: true },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-3xl border transition-all duration-300 ${
                  plan.highlight
                    ? 'bg-black text-white border-black'
                    : 'bg-white border-gray-200 hover:border-gray-400'
                }`}
              >
                <h3 className="text-2xl font-bold tracking-tight mb-2">{plan.name}</h3>
                <p className={`text-3xl font-bold mb-6 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className={`text-sm font-light ${plan.highlight ? 'text-gray-300' : 'text-gray-600'}`}>
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`block w-full py-3 rounded-full font-semibold text-center transition-all duration-300 ${
                    plan.highlight
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'border border-black text-black hover:bg-black hover:text-white'
                  }`}
                >
                  {language === 'EN' ? 'Get Started' : '今すぐ始める'}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 pt-24 border-t border-gray-200">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">{t.faq.title}</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {t.faq.items.map((item, idx) => (
              <FAQItem key={idx} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-24 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <h3 className="font-bold tracking-tight text-gray-900 mb-4">{language === 'EN' ? 'Links' : 'リンク'}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/terms" className="text-gray-600 hover:text-gray-900 transition font-light">
                    {language === 'EN' ? 'Terms of Service' : '利用規約'}
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-gray-600 hover:text-gray-900 transition font-light">
                    {language === 'EN' ? 'Privacy Policy' : 'プライバシーポリシー'}
                  </a>
                </li>
                <li>
                  <a href="/about" className="text-gray-600 hover:text-gray-900 transition font-light">
                    {language === 'EN' ? 'About' : 'について'}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold tracking-tight text-gray-900 mb-4">{language === 'EN' ? 'Support' : 'サポート'}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:support@streak.io" className="text-gray-600 hover:text-gray-900 transition font-light">
                    support@streak.io
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold tracking-tight text-gray-900 mb-4">{language === 'EN' ? 'About' : 'について'}</h3>
              <p className="text-sm text-gray-600 font-light">
                {language === 'EN' ? 'Web3 payment infrastructure for every merchant.' : 'すべての加盟店のためのWEB3決済インフラ。'}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-sm text-gray-600 font-light">
              © 2026 Streak. {language === 'EN' ? 'All rights reserved.' : 'すべての権利を保有。'}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-400 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 bg-white hover:bg-gray-50 flex items-center justify-between transition-all duration-300"
      >
        <h3 className="text-lg font-bold tracking-tight text-gray-900 text-left">{question}</h3>
        <span className={`text-black font-bold transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-gray-700 font-light leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
