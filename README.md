# セットアップ

1. Google SheetsのURLからスプレッドシートIDを取り、`Code.gs` の `SPREADSHEET_ID` に設定。
2. GASのプロジェクト設定 > スクリプト プロパティで `API_SHARED_SECRET` に長いランダム文字列を設定。
3. GASをウェブアプリとしてデプロイ。実行ユーザーは自分、アクセス権は「全員」。この公開エンドポイントは共有シークレットで保護されるが、URLを知る第三者によるリクエストは可能なのでシークレットを漏らさないこと。
4. GASデプロイURL（`.../exec`）を控える。
5. Cloudflare Pagesで `pages/` をデプロイ（Git連携ならルートディレクトリを `pages`、ビルドコマンドなし、出力ディレクトリ `.`）。Functionsを有効にするにはGit連携またはWranglerでデプロイする。ダッシュボードのドラッグ&ドロップのみではFunctionsが動作しないことがある。
6. Pagesプロジェクトの Settings > Variables and Secrets に `GAS_URL`（GAS /exec URL）と `GAS_SHARED_SECRET`（手順2と同じ文字列）を設定。両方Secretとして扱い、再デプロイ。
7. **必須**：Cloudflare AccessでPagesのホスト名全体を本人のメールアドレスだけに許可する。これをしないと、PagesのAPIを第三者が呼び出してDBを閲覧・変更できる。`*.pages.dev` とカスタムドメインなど全ての公開ホストを保護する。
8. iPhone Safariで保護されたPages URLを開き、カメラを許可。バーコードを読み取って登録。

注: GAS ContentServiceのPOST応答はリダイレクトする。環境によりCloudflare Workers fetchがPOSTリダイレクトで失敗する場合があるため、まず /api/barcodes の list 動作を確認すること。
