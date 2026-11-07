# harmony-yokohama.github.io

Harmony（横浜・鶴見の国際交流コミュニティ）の公式サイト。GitHub Pagesでそのまま公開される静的サイトです。

## ページ
| ファイル | URL | 内容 |
|---|---|---|
| index.html | / | トップ（全イベント一覧・各イベントへの入口） |
| language-exchange.html | /language-exchange | 言語交換LP |
| board-games.html | /board-games | ボードゲームLP |
| sake.html | /sake | 日本酒テイスティングLP |
| matcha.html | /matcha | 抹茶・和菓子・書道LP |

各HTMLにはPC用（`.v-pc`）とスマホ用（`.v-sp`）のレイアウトが入っていて、画面幅1000pxを境に切り替わります。

## イベント日程・申し込み
- 日程は Google Apps Script（`assets/lp/site.js` の `API_URL`）の `?action=events` から自動で読み込みます。Meetupにイベントを作れば、トップのカード・各LPの日程・申し込みフォームの選択肢に自動で出ます（読み込めない時は `SNAPSHOT` を表示）。
- 申し込みは同じApps ScriptにPOST。項目は旧LPと同じ（eventId・name・email・country・ageRange・practice・firstTime・source・message・over20・consent・website・lang）。
- `?from=ig` などを付けたリンクは「何で知りましたか？」が自動で選ばれ、ページ移動しても引き継がれます。
- `?event=<イベントID>#join` で、LPの申し込みフォームの日程を最初から選んだ状態にできます（トップのカードはこれでLPにつないでいます）。

## 日本語／英語
ヘッダーのEN／日本語で切り替え。トップは英語、各LPは日本語が元の文章で、もう一方の言語は各HTML内の `window.HARMONY_I18N`（元の文 → 訳）で差し替えます。選んだ言語はブラウザに保存され、ほかのページでも引き継がれます。

## 画像
`assets/lp/` にLP用の写真・動画。`assets/thumbs/` などの旧ファイルは外部（Peatix等）から参照されている可能性があるため残しています。
