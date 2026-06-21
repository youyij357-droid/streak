import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResend() {
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@streak.io';
const NOTIFY_TO = process.env.RESEND_NOTIFY_EMAIL ?? '';

// ─── HTML テンプレート ──────────────────────────────────────

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Streak</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e5e5;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #e5e5e5;">
              <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#111111;">STREAK</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e5e5e5;background:#fafafa;">
              <p style="margin:0;font-size:12px;color:#999999;line-height:1.6;">
                © 2026 Streak. Web3 Payment Infrastructure.<br />
                support@streak.io
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function blackButton(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:24px;padding:14px 32px;background:#111111;color:#ffffff;text-decoration:none;border-radius:100px;font-size:14px;font-weight:600;letter-spacing:0.2px;">${label}</a>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#666666;width:160px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;font-size:13px;color:#111111;font-weight:500;word-break:break-all;">${value}</td>
  </tr>`;
}

// ─── ① 運営宛：新規加盟店申込通知 ───────────────────────────

export async function sendAdminNotification({
  shopName,
  walletAddress,
  email,
  appliedAt,
}: {
  shopName: string;
  walletAddress: string;
  email?: string | null;
  appliedAt: string;
}) {
  if (!NOTIFY_TO) return;

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111111;">新規加盟店申込</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555555;">以下の加盟店が Streak に申し込みました。</p>

    <table cellpadding="0" cellspacing="0" width="100%"
      style="border:1px solid #e5e5e5;border-radius:12px;padding:16px 20px;background:#fafafa;">
      ${infoRow('ショップ名', shopName)}
      ${infoRow('ウォレット', walletAddress)}
      ${infoRow('メール', email ?? '未登録')}
      ${infoRow('申込日時', appliedAt)}
    </table>
  `;

  await getResend().emails.send({
    from: FROM,
    to: NOTIFY_TO,
    subject: `[Streak] 新規加盟店申込 - ${shopName}`,
    html: baseLayout(content),
  });
}

// ─── ② メールアドレス確認メール ─────────────────────────────

export async function sendEmailVerification({
  toEmail,
  shopName,
  verifyUrl,
}: {
  toEmail: string;
  shopName: string;
  verifyUrl: string;
}) {
  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111111;">メールアドレスの確認</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555555;line-height:1.7;">
      <strong>${shopName}</strong> へのご登録ありがとうございます。<br />
      以下のボタンをクリックしてメールアドレスを確認してください。<br />
      このリンクは<strong>24時間</strong>有効です。
    </p>

    ${blackButton(verifyUrl, 'メールアドレスを確認する →')}

    <p style="margin:24px 0 0;font-size:12px;color:#999999;line-height:1.6;">
      このメールに心当たりがない場合は無視してください。
    </p>
  `;

  await getResend().emails.send({
    from: FROM,
    to: toEmail,
    subject: '【Streak】メールアドレスの確認をお願いします',
    html: baseLayout(content),
  });
}

// ─── ③ 加盟店宛：決済完了通知 ───────────────────────────────

export async function sendPaymentNotification({
  shopName,
  toEmail,
  productName,
  amountJpy,
  amountUsdc,
  paymentMethod,
  txHash,
}: {
  shopName: string;
  toEmail: string;
  productName: string;
  amountJpy: number | null;
  amountUsdc: number;
  paymentMethod: string;
  txHash: string;
}) {
  const polygonScanUrl = `https://polygonscan.com/tx/${txHash}`;
  const paidAt = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  const methodLabel = paymentMethod === 'wallet' ? 'ウォレット (USDC)' : 'クレジットカード';
  const amountLabel = amountJpy
    ? `¥${amountJpy.toLocaleString('ja-JP')}`
    : `${amountUsdc.toFixed(2)} USDC`;

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111111;">決済完了</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555555;">以下の決済が完了しました。</p>

    <table cellpadding="0" cellspacing="0" width="100%"
      style="border:1px solid #e5e5e5;border-radius:12px;padding:16px 20px;background:#fafafa;">
      ${infoRow('商品名', productName)}
      ${infoRow('決済金額', amountLabel)}
      ${infoRow('USDC', `${amountUsdc.toFixed(6)} USDC`)}
      ${infoRow('決済方法', methodLabel)}
      ${infoRow('決済日時', paidAt)}
      ${infoRow('TXハッシュ', `<span style="font-family:monospace;font-size:11px;">${txHash.slice(0, 16)}...${txHash.slice(-8)}</span>`)}
    </table>

    <a href="${polygonScanUrl}"
      style="display:inline-block;margin-top:24px;padding:14px 32px;background:#111111;color:#ffffff;text-decoration:none;border-radius:100px;font-size:14px;font-weight:600;">
      PolygonScanで確認 →
    </a>
  `;

  await getResend().emails.send({
    from: FROM,
    to: toEmail,
    subject: `[Streak] ${shopName} - ${amountLabel}`,
    html: baseLayout(content),
  });
}

// ─── ④ 加盟店宛：申込完了自動返信 ───────────────────────────

export async function sendWelcomeEmail({
  shopName,
  toEmail,
  dashboardUrl,
}: {
  shopName: string;
  toEmail: string;
  dashboardUrl: string;
}) {
  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111111;">Welcome to Streak</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555555;line-height:1.7;">
      <strong>${shopName}</strong> のショップ設定が完了しました。<br />
      決済リンクを共有して、すぐに販売を開始できます。
    </p>

    <table cellpadding="0" cellspacing="0" width="100%"
      style="border:1px solid #e5e5e5;border-radius:12px;padding:16px 20px;background:#fafafa;">
      ${infoRow('手数料', '2.5%（スマートコントラクトで自動徴収）')}
      ${infoRow('着金タイミング', '即時（ブロックチェーン確認後）')}
      ${infoRow('リザーブ', 'なし')}
      ${infoRow('対応通貨', 'USDC（Polygon）')}
    </table>

    ${blackButton(dashboardUrl, 'ダッシュボードを開く →')}

    <p style="margin:32px 0 0;font-size:13px;color:#888888;line-height:1.7;">
      ご不明な点は <a href="mailto:support@streak.io" style="color:#111111;">support@streak.io</a> までお問い合わせください。
    </p>
  `;

  await getResend().emails.send({
    from: FROM,
    to: toEmail,
    subject: 'Welcome to Streak - Setup Complete',
    html: baseLayout(content),
  });
}
