# 2026-06-22 STREAK ステーブルコイン決済調査アップデート

確認日: 2026-06-22  
対象: 日本のステーブルコイン決済、USDC決済プロバイダー、関連法規制  
注意: これはプロダクト判断用の調査メモであり、法的助言ではない。実装・提供前に弁護士、登録業者、各プロバイダーへ確認すること。

## 結論

- 金融庁の電子決済手段等取引業者登録一覧は、2025-03-04現在のまま。登録業者はSBI VCトレード株式会社1社、取扱電子決済手段はUSDCのみ。
- SBI VCトレードの電子決済手段取引説明書では、USDCの入出庫対象ネットワークは「Ethereum」のみ。STREAKのMVP方針である「Polygon USDCを加盟店ウォレットへ直接送る」導線には、そのままではSBI VCトレードを入出庫先として使いにくい。
- Stripeのstablecoin paymentsは、公式ドキュメント上「現在は米国事業者のみ受け付け」と明記されている。日本アカウント向けの正式提供兆候は確認できない。
- Coinbase Businessは、公式FAQ上「United States and Singapore」が対象。日本法人向け提供は確認できない。
- Circle Mintは機関向けで、個人不可かつ対象地域制限あり。日本法人が利用可能かは公開情報だけでは断定できず、要事業者確認。

## 重要変更・差分

### 1. 金融庁登録一覧

- [免許・許可・登録等を受けている事業者一覧](https://www.fsa.go.jp/menkyo/menkyo.html)では、電子決済手段等取引業者登録一覧は「令和7年3月4日現在」のまま。
- [電子決済手段等取引業者登録一覧](https://www.fsa.go.jp/menkyo/menkyoj/denshikessaisyudan.pdf)は、SBI VCトレード株式会社のみ。登録番号は関東財務局長 第00001号、取扱電子決済手段はUSDC。
- [暗号資産交換業者登録一覧](https://www.fsa.go.jp/menkyo/menkyoj/kasoutuka.pdf)は「令和8年4月30日現在」で27社。暗号資産交換業者一覧上の取扱暗号資産としてUSDCを扱う国内事業者は確認できず、USDCは引き続き電子決済手段側で見る必要がある。

STREAKへの影響:
- 「SBI VCトレード以外の国内USDC取扱事業者」は未確認。MVPでは国内アグリゲーター前提にせず、非カストディのオンチェーン直接決済を維持するのが妥当。
- 登録一覧は価値保証・推奨ではないため、画面・規約ではUSDCの価格、為替、ネットワーク、発行体リスクを明記する。

次アクション:
- 次回も電子決済手段等取引業者登録一覧の登録追加を最優先で確認する。

### 2. SBI VCトレード / USDC

- [取扱電子決済手段ページ](https://www.sbivc.co.jp/services/handling-electronic-payment)では、取扱電子決済手段はUSDC。SBI VCトレードは電子決済手段等取引業 関東財務局長 第00001号。
- [電子決済手段取引説明書](https://www.sbivc.co.jp/assets/docs/manual-ex_electric-payment-instrument.pdf)では、本取引はUSDC/JPYの販売所取引で、流動性供給者としてCircle Internet Financial, LLCが記載されている。
- 同説明書の入出庫欄では、銘柄USDC、対応ブロックチェーンETH、出庫手数料は無料とされている。手数料ページでも暗号資産・電子決済手段の入庫・出庫手数料は無料とされている。Polygon USDCの入出庫対応は確認できない。
- [法人のお客さま](https://www.sbivc.co.jp/account-guide-houjin)ページでは、日本国内で本店または支店登記がある法人などの口座開設条件が記載されている。
- [SBIVC for Prime](https://www.sbivc.co.jp/services/prime)では、大口・法人向け相談導線があるが、加盟店決済APIやPolygon USDC対応は確認できない。

STREAKへの影響:
- 加盟店がPolygon USDCを受け取りたいMVPでは、SBI VCトレードをそのまま入出庫・換金導線にするにはチェーン不一致がある。PolygonからEthereumへのブリッジ、CCTP、または加盟店側の別導線が必要になる可能性がある。
- STREAKが換金やブリッジを代行するとカストディ/移転/交換の論点が強くなるため、MVPでは代行しない設計を維持する。要弁護士確認。

次アクション:
- SBI VCトレードに、Polygon USDC対応予定、法人API、決済事業者提携、加盟店向け機能の有無を直接確認する。

### 3. Stripe stablecoin payments

- [Stripe Stablecoin payments](https://docs.stripe.com/payments/stablecoin-payments)は、対応通貨としてUSDCのEthereum/Solana/Polygon/Base、USDP、USDGを記載。
- 同ページでは、Business locationsはUSのみ、かつ「currently only US businesses can accept stablecoin payments」とされている。
- Connect、Checkout、Elements、Billingには対応し、全stablecoin paymentsはUSDでStripe残高にsettleされる。

STREAKへの影響:
- 日本アカウントでの正式提供は確認できない。日本向けMVPの主決済導線にはできない。
- 仮に将来利用可能になっても、Stripe残高へのUSD settlement型であり、STREAKの「購入者ウォレットから加盟店・手数料ウォレットへPolygon USDCを自動分配」とは設計が変わる。

次アクション:
- Stripeに日本アカウントでのcrypto/stablecoin payment method提供予定と、Connectの日本connected account対応を確認する。

### 4. Circle Mint / API / Wallet / CCTP

- [Circle Mint](https://www.circle.com/circle-mint)は機関向けで、個人利用不可。申請にはKYC、制裁スクリーニング等の審査が必要。
- [Circle multichain USDC](https://www.circle.com/multi-chain-usdc)では、USDCは34 blockchain networksでnative supportとされ、Polygonを含む複数チェーンのUSDCが対象。
- [Circle CCTP](https://www.circle.com/cross-chain-transfer-protocol)とWalletsは引き続き提供されているが、日本法人が直接利用できるか、国内の電子決済手段規制上どう整理されるかは公開情報だけでは断定しない。

STREAKへの影響:
- Polygon USDCやCCTP自体は技術的な候補になり得るが、STREAKがCircle Mint/APIを日本法人として使えるかは要事業者確認。
- STREAKがユーザー資産のmint/redeem、ブリッジ、保管、送金を代行する場合は要弁護士確認。

次アクション:
- Circleに日本法人のMint/API/Wallet/CCTP利用可否、SBI VCトレード等国内登録業者との役割分担を確認する。

### 5. Coinbase Business / Payments

- [Coinbase Business](https://www.coinbase.com/business)のFAQでは、対応国はUnited States and Singapore。
- [Coinbase Business Payments](https://www.coinbase.com/business/payments)ではPayment Links、Invoicing、Payouts等が掲げられているが、日本法人向け提供は確認できない。

STREAKへの影響:
- 日本法人向けMVPの主候補にはしない。海外法人・海外展開時の再評価対象。

次アクション:
- 対象国にJapanが追加されたかだけを次回確認する。

## MVP方針への反映

- 既存方針の「非カストディのオンチェーン直接決済」は維持。
- 「Polygon USDCのみ」はUX/ガス費の観点では維持可能だが、国内登録業者での入出庫・換金導線はSBI VCトレードのEthereum対応に縛られる点を加盟店向け説明に入れる。
- STREAKは、換金、返金代行、チェーン間移転代行、加盟店残高管理をMVPで提供しない。
- 加盟店向けには「受取チェーンと換金導線は加盟店自身で確認」「SBI VCトレードを利用する場合は対応ネットワークを要確認」と明記する。

## 次回確認ポイント

- 金融庁の電子決済手段等取引業者登録一覧にSBI VCトレード以外が追加されたか。
- SBI VCトレードがPolygon USDC、法人API、加盟店・決済事業者向け機能を公表したか。
- Stripeが日本事業者にstablecoin paymentsを開放したか。
- Circle/Coinbaseの対象地域・日本法人利用条件に変化があるか。
