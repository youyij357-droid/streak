# STREAK DB設計

## 1. 前提

- データベースは Supabase PostgreSQL を第一候補とする。
- 認証ユーザーは Supabase Auth の `auth.users` を利用する。
- 業務データは `public` スキーマに保持する。
- 加盟店ユーザーは自分のデータのみ参照できるよう Row Level Security を前提に設計する。
- 金額は USDC の最小単位、または小数桁を固定した `numeric` で保存する。MVP では読みやすさと集計性を優先し、`numeric(20, 6)` を候補とする。

## 2. テーブル一覧

| テーブル | 目的 |
| --- | --- |
| `profiles` | 認証ユーザーの基本情報とロール |
| `merchants` | 加盟店情報 |
| `merchant_settings` | 加盟店ごとの手数料率や運用設定 |
| `products` | 商品情報 |
| `payment_links` | 購入用リンク |
| `orders` | 購入者注文 |
| `payments` | オンチェーン決済記録 |
| `email_events` | メール送信ログ |
| `audit_logs` | 管理操作ログ |

## 3. Enum 案

### user_role

- `merchant`
- `admin`

### merchant_status

- `active`
- `suspended`

### product_status

- `draft`
- `active`
- `archived`

### payment_link_status

- `active`
- `disabled`

### order_status

- `pending`
- `payment_submitted`
- `paid`
- `failed`
- `cancelled`

### payment_status

- `submitted`
- `confirmed`
- `failed`

## 4. テーブル定義

### 4.1 profiles

Supabase Auth ユーザーに紐づくアプリ内プロフィール。

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | `auth.users.id` と同一 |
| `role` | `user_role` | yes | `merchant` または `admin` |
| `email` | `text` | yes | メールアドレス |
| `created_at` | `timestamptz` | yes | 作成日時 |
| `updated_at` | `timestamptz` | yes | 更新日時 |

### 4.2 merchants

加盟店の店舗情報。

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | 主キー |
| `user_id` | `uuid` | yes | `profiles.id` |
| `status` | `merchant_status` | yes | 有効 / 停止 |
| `store_name` | `text` | yes | 店舗名 |
| `contact_name` | `text` | yes | 氏名 / 担当者名 |
| `phone` | `text` | yes | 電話番号 |
| `country` | `text` | yes | 国 |
| `business_description` | `text` | yes | 事業内容 |
| `website_url` | `text` | no | Web サイト |
| `wallet_address` | `text` | yes | 受取ウォレット |
| `terms_accepted_at` | `timestamptz` | yes | 利用規約同意日時 |
| `anti_social_confirmed_at` | `timestamptz` | yes | 反社確認日時 |
| `created_at` | `timestamptz` | yes | 作成日時 |
| `updated_at` | `timestamptz` | yes | 更新日時 |

制約:

- `user_id` は一意。
- `wallet_address` は EVM アドレス形式をアプリ側で検証する。

### 4.3 merchant_settings

加盟店ごとの決済設定。

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | 主キー |
| `merchant_id` | `uuid` | yes | 加盟店ID |
| `fee_bps` | `integer` | yes | STREAK 手数料率。2.5% は 250 |
| `created_at` | `timestamptz` | yes | 作成日時 |
| `updated_at` | `timestamptz` | yes | 更新日時 |

制約:

- `merchant_id` は一意。
- `fee_bps` は `0` 以上 `10000` 以下。
- 初期値は `250`。

### 4.4 products

加盟店の商品。

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | 主キー |
| `merchant_id` | `uuid` | yes | 加盟店ID |
| `status` | `product_status` | yes | 商品状態 |
| `name` | `text` | yes | 商品名 |
| `description` | `text` | no | 商品説明 |
| `price_usdc` | `numeric(20, 6)` | yes | 価格 USDC |
| `created_at` | `timestamptz` | yes | 作成日時 |
| `updated_at` | `timestamptz` | yes | 更新日時 |

制約:

- `price_usdc` は `0` より大きい。

### 4.5 payment_links

購入者向け決済リンク。

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | 主キー |
| `merchant_id` | `uuid` | yes | 加盟店ID |
| `product_id` | `uuid` | yes | 商品ID |
| `slug` | `text` | yes | 公開URL用ID |
| `status` | `payment_link_status` | yes | 有効 / 無効 |
| `created_at` | `timestamptz` | yes | 作成日時 |
| `updated_at` | `timestamptz` | yes | 更新日時 |

制約:

- `slug` は一意。

### 4.6 orders

購入者の注文。

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | 主キー |
| `merchant_id` | `uuid` | yes | 加盟店ID |
| `product_id` | `uuid` | yes | 商品ID |
| `payment_link_id` | `uuid` | yes | 決済リンクID |
| `status` | `order_status` | yes | 注文状態 |
| `buyer_name` | `text` | yes | 購入者名 |
| `buyer_email` | `text` | yes | 購入者メール |
| `buyer_phone` | `text` | yes | 購入者電話番号 |
| `buyer_postal_code` | `text` | yes | 郵便番号 |
| `buyer_address` | `text` | yes | 住所 |
| `buyer_note` | `text` | no | 備考 |
| `product_name_snapshot` | `text` | yes | 決済時点の商品名 |
| `merchant_name_snapshot` | `text` | yes | 決済時点の加盟店名 |
| `amount_usdc` | `numeric(20, 6)` | yes | 決済金額 |
| `fee_bps` | `integer` | yes | 決済時点の手数料率 |
| `merchant_amount_usdc` | `numeric(20, 6)` | yes | 加盟店配分額 |
| `streak_fee_usdc` | `numeric(20, 6)` | yes | STREAK 手数料 |
| `created_at` | `timestamptz` | yes | 作成日時 |
| `updated_at` | `timestamptz` | yes | 更新日時 |
| `paid_at` | `timestamptz` | no | 決済完了日時 |

### 4.7 payments

オンチェーン決済記録。

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | 主キー |
| `order_id` | `uuid` | yes | 注文ID |
| `merchant_id` | `uuid` | yes | 加盟店ID |
| `status` | `payment_status` | yes | 決済状態 |
| `chain_id` | `integer` | yes | Polygon のチェーンID |
| `token_address` | `text` | yes | USDC コントラクト |
| `contract_address` | `text` | yes | STREAK 決済コントラクト |
| `tx_hash` | `text` | yes | トランザクションハッシュ |
| `payer_address` | `text` | no | 購入者ウォレット |
| `merchant_wallet_address` | `text` | yes | 加盟店ウォレット |
| `streak_wallet_address` | `text` | yes | STREAK 手数料ウォレット |
| `amount_usdc` | `numeric(20, 6)` | yes | 決済金額 |
| `merchant_amount_usdc` | `numeric(20, 6)` | yes | 加盟店配分額 |
| `streak_fee_usdc` | `numeric(20, 6)` | yes | STREAK 手数料 |
| `confirmed_at` | `timestamptz` | no | 確定日時 |
| `created_at` | `timestamptz` | yes | 作成日時 |

制約:

- `tx_hash` は一意。
- `order_id` は MVP では一意。

### 4.8 email_events

メール送信ログ。

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | 主キー |
| `order_id` | `uuid` | no | 関連注文 |
| `merchant_id` | `uuid` | no | 関連加盟店 |
| `type` | `text` | yes | メール種別 |
| `to_email` | `text` | yes | 宛先 |
| `status` | `text` | yes | `queued` / `sent` / `failed` |
| `provider_message_id` | `text` | no | Resend 側ID |
| `error_message` | `text` | no | エラー内容 |
| `created_at` | `timestamptz` | yes | 作成日時 |
| `sent_at` | `timestamptz` | no | 送信日時 |

### 4.9 audit_logs

管理者操作ログ。

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | 主キー |
| `actor_user_id` | `uuid` | yes | 操作者 |
| `action` | `text` | yes | 操作名 |
| `target_type` | `text` | yes | 対象種別 |
| `target_id` | `uuid` | no | 対象ID |
| `metadata` | `jsonb` | no | 変更内容 |
| `created_at` | `timestamptz` | yes | 作成日時 |

## 5. 主なリレーション

- `profiles.id` 1:1 `merchants.user_id`
- `merchants.id` 1:1 `merchant_settings.merchant_id`
- `merchants.id` 1:N `products.merchant_id`
- `products.id` 1:N `payment_links.product_id`
- `payment_links.id` 1:N `orders.payment_link_id`
- `orders.id` 1:1 `payments.order_id`
- `orders.id` 1:N `email_events.order_id`

## 6. RLS 方針

### 加盟店

- 自分の `merchants` レコードのみ参照・更新可能。
- 自分の `products`、`payment_links`、`orders`、`payments` のみ参照可能。
- 商品と決済リンクは自分の加盟店IDに紐づくものだけ作成・更新可能。

### 管理者

- `profiles.role = 'admin'` のユーザーは全加盟店・全注文・全決済を参照可能。
- 加盟店停止、手数料率変更などの管理操作が可能。

### 公開決済リンク

- `payment_links.status = 'active'`
- `products.status = 'active'`
- `merchants.status = 'active'`

上記を満たす公開情報のみ匿名閲覧を許可する。

## 7. インデックス案

- `merchants(user_id)`
- `merchants(status)`
- `products(merchant_id, status)`
- `payment_links(slug)`
- `payment_links(merchant_id)`
- `orders(merchant_id, created_at desc)`
- `orders(status)`
- `payments(tx_hash)`
- `payments(merchant_id, created_at desc)`
- `email_events(order_id)`
- `audit_logs(created_at desc)`

## 8. 実装時の注意

- 決済金額・手数料率・配分額は注文作成時点の値をスナップショットとして保存する。
- 商品名や加盟店名も注文にスナップショット保存し、後から商品名が変わっても購入者メールや履歴が崩れないようにする。
- TX ハッシュの重複登録を防ぐ。
- メール送信は決済確定後の副作用として扱い、失敗しても注文の paid 状態は維持する。
- 管理者ロール付与は通常UIから行わず、初期はDB操作または安全な管理手順で行う。

