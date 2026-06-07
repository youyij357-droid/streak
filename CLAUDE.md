# Streak - WEB3決済プラットフォーム

## サービス概要
加盟店（クライアント）ごとに独立したホワイトラベル型のWEB3決済環境を提供するSaaS。
スマートコントラクトで手数料2.5%を自動受取。リザーブなし・即時着金が最大の特徴。

## 技術スタック
- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui（Nova preset・Geistフォント）
- Supabase（DB・Auth・Storage）
- wagmi v2 + RainbowKit（MetaMask・ウォレット接続）
- Crossmint SDK（BYOC・クレカ/ApplePay/GooglePay決済）
- Polygon（ブロックチェーン・USDC）
- Resend（メール通知）

## デザイン方針
- Instagramライクなスタイリッシュなデザイン
- ダーク系＋紫グラデーション（#534AB7 → #7C3AED）
- カード型レイアウト・ゆとりある余白
- モバイルファースト

## ディレクトリ構成
- app/ : Next.js App Router
- app/(auth)/ : ログイン・オンボーディング
- app/dashboard/ : 加盟店ダッシュボード
- app/pay/[shopId]/[productId]/ : 購入者向け決済ページ
- app/shop/[shopId]/ : ショップ一覧ページ
- components/ui/ : shadcn/uiコンポーネント
- components/wallet/ : ウォレット接続関連
- components/payment/ : 決済関連
- lib/supabase/ : Supabaseクライアント
- lib/wagmi/ : wagmi設定
- contracts/ : Solidityコントラクト

## データベース（Supabase）
- shops : 加盟店情報（wallet_address・shop_name・crossmint_api_key等）
- products : 商品情報（shop_id・name・price_usdc・is_published等）
- orders : 取引履歴（shop_id・product_id・amount_usdc・tx_hash等）

## 決済フロー
1. 購入者が決済リンクを開く（/pay/[shopId]/[productId]）
2. MetaMask直接送金 または Crossmint（クレカ/ApplePay/GooglePay）を選択
3. BYOCスマートコントラクトが自動分配（加盟店97.5%・Streak2.5%）
4. 加盟店ウォレットに即時着金

## コーディングルール
- TypeScriptで型定義必須
- コンポーネントはServer Componentsを優先・必要な時だけ'use client'
- Supabaseクライアントはlib/supabase/から使う
- 環境変数はNEXT_PUBLIC_プレフィックスのルールを守る
- コメントは日本語でOK
- エラーハンドリングは必ず実装する