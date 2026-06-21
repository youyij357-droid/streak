# STREAK スマートコントラクト仕様

## 1. 目的

購入者が Polygon USDC で支払った金額を、決済時点の手数料率に基づいて加盟店ウォレットと STREAK 手数料ウォレットへ自動配分する。

## 2. 基本方針

- STREAK は購入代金を長時間保管しない。
- 決済関数内で USDC を購入者から回収し、同一トランザクション内で加盟店と STREAK に配分する。
- MVP では単一 USDC トークン、単一 STREAK 手数料ウォレットを前提とする。
- 管理者は手数料ウォレット、対応トークン、停止状態を管理できる。
- 加盟店別の手数料率は原則アプリDBで管理し、決済時にコントラクトへ渡す。ただし改ざん対策として署名方式またはサーバー検証を実装前に決める。

## 3. 想定ネットワーク

| 環境 | ネットワーク |
| --- | --- |
| 開発 | Hardhat local |
| テスト | Polygon Amoy などのテストネット |
| 本番 | Polygon PoS |

USDC コントラクトアドレスは環境変数で管理する。

## 4. コントラクト構成案

### StreakPaymentRouter

主な責務:

- USDC の `transferFrom` を実行する。
- 手数料を計算する。
- 加盟店ウォレットへ加盟店分を送金する。
- STREAK 手数料ウォレットへ手数料分を送金する。
- 決済イベントを発行する。
- 緊急停止する。

## 5. 主要パラメータ

| 項目 | 型 | 説明 |
| --- | --- | --- |
| `usdc` | `address` | 対応 USDC トークン |
| `feeRecipient` | `address` | STREAK 手数料受取ウォレット |
| `owner` | `address` | 管理者 |
| `paused` | `bool` | 緊急停止状態 |

## 6. 決済関数案

```solidity
function pay(
    bytes32 orderId,
    address merchantRecipient,
    uint256 amount,
    uint16 feeBps
) external;
```

### 引数

| 引数 | 説明 |
| --- | --- |
| `orderId` | DB 注文IDに対応する識別子。UUIDを bytes32 に変換する案 |
| `merchantRecipient` | 加盟店の受取ウォレット |
| `amount` | USDC 最小単位の支払総額 |
| `feeBps` | STREAK 手数料率。2.5% は 250 |

### 処理

1. コントラクトが停止中でないことを確認する。
2. `merchantRecipient` がゼロアドレスでないことを確認する。
3. `amount` が 0 より大きいことを確認する。
4. `feeBps` が上限以下であることを確認する。
5. `feeAmount = amount * feeBps / 10000` を計算する。
6. `merchantAmount = amount - feeAmount` を計算する。
7. 購入者からコントラクトへ `amount` を `transferFrom` する。
8. コントラクトから加盟店へ `merchantAmount` を送る。
9. コントラクトから STREAK へ `feeAmount` を送る。
10. `PaymentSettled` イベントを発行する。

## 7. イベント案

```solidity
event PaymentSettled(
    bytes32 indexed orderId,
    address indexed payer,
    address indexed merchantRecipient,
    uint256 amount,
    uint256 merchantAmount,
    uint256 feeAmount,
    uint16 feeBps
);
```

```solidity
event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
event Paused(address indexed account);
event Unpaused(address indexed account);
```

## 8. 管理関数案

```solidity
function setFeeRecipient(address newFeeRecipient) external onlyOwner;
function pause() external onlyOwner;
function unpause() external onlyOwner;
```

## 9. 重複決済対策

MVP では以下のどちらかを実装前に選ぶ。

### 案A: コントラクトで orderId の使用済み管理

- `mapping(bytes32 => bool) paidOrders` を持つ。
- 同じ `orderId` の二重決済を拒否できる。
- ガスコストは増えるが安全性が高い。

### 案B: DB と TX ハッシュで管理

- コントラクトはステートレスに近く保つ。
- DB 側で注文状態と TX ハッシュを一意管理する。
- 同じ注文に対する複数送金をオンチェーンでは止められない。

推奨は案A。お金を扱うため、MVPでも `orderId` の使用済み管理を入れる。

## 10. feeBps 改ざん対策

フロントから `feeBps` を直接渡すだけでは、購入者または改ざんされた画面が手数料率を変更できるリスクがある。

MVP では以下のいずれかを採用する。

### 推奨案: サーバー署名方式

- アプリサーバーが `orderId`、`merchantRecipient`、`amount`、`feeBps`、`expiresAt` に署名する。
- コントラクトは署名者が STREAK の許可アドレスであることを検証する。
- 署名済みデータと異なる内容の決済を拒否する。

### 簡易案: 管理者が加盟店別 feeBps をオンチェーン登録

- コントラクトに加盟店ウォレットごとの `feeBps` を保存する。
- DB とオンチェーン状態の同期が必要になる。

低コストMVPではサーバー署名方式を第一候補とする。

## 11. フロント決済フロー

1. 購入者情報を入力する。
2. アプリDBに `pending` 注文を作成する。
3. サーバーが決済パラメータと署名を返す。
4. 購入者が USDC の `approve` を実行する。
5. 購入者が `pay` を実行する。
6. フロントが TX ハッシュをDBへ送る。
7. アプリ側が TX を確認し、注文を `paid` にする。
8. メール通知を送る。

## 12. セキュリティ要件

- `ReentrancyGuard` を利用する。
- `SafeERC20` を利用する。
- `Pausable` を利用する。
- `Ownable` または同等の権限管理を使う。
- ゼロアドレスを拒否する。
- `feeBps` の上限を設定する。
- 同一 `orderId` の二重決済を拒否する。
- 署名にはチェーンID、コントラクトアドレス、有効期限を含める。

## 13. テスト観点

- 標準手数料 2.5% で正しく配分される。
- 加盟店ごとの手数料率で正しく配分される。
- `amount = 0` を拒否する。
- ゼロアドレス加盟店を拒否する。
- 手数料率上限超過を拒否する。
- USDC approve 不足を拒否する。
- 同一 `orderId` の二重決済を拒否する。
- 停止中は決済できない。
- 管理者以外は管理関数を呼べない。

