### 家計簿アプリ詳細仕様書

#### 1. アプリケーション概要

* **アプリケーション名**: (仮) 危機感家計簿アプリ
* **コンセプト**: ユーザーの金銭感覚を研ぎ澄まし、無駄な支出を抑制するための「危機感を煽る」家計管理アプリ。特に学生層をメインターゲットとしつつ、幅広い層が直感的に利用できるシンプルさと高機能性を両立する。
* **解決する課題**:
    * 漠然とした支出不安
    * いつの間にか使いすぎている現状
    * 資産状況の不透明性
* **提供価値**:
    * リアルタイムに近い支出状況の把握
    * 予算超過や異常な支出傾向に対する自動警告
    * 目標設定による貯蓄意識の向上
    * 簡便なデータ入力と多様な可視化

#### 2. フロントエンド仕様

**2.1. 技術スタック**

* **フレームワーク/ライブラリ**: React (with JSX)
* **ビルドツール**: Vite
* **UIコンポーネントライブラリ**: shadcn/ui
* **CSSフレームワーク**: Tailwind CSS

**2.2. 対応プラットフォーム**

* **Webブラウザ** (PC、スマートフォン、タブレット)
* レスポンシブデザインにより、各デバイスに最適化された表示を提供。

**2.3. 主要機能とUI/UX**

**2.3.1. ログイン・ユーザー認証機能**

* **ログイン方法**:
    * パスキー認証
    * LINEログイン
* **UI**: ログインフォーム、パスキー登録/削除UI、LINEログインボタン。

**2.3.2. ユーザー登録機能**

* **UI**: ユーザー登録フォーム（必要に応じてメールアドレス、パスワード入力欄）。
* **処理**: `POST /account/signup` を介してユーザー情報をバックエンドに送信。

**2.3.3. 支出・収入記録機能**

* **手入力**:
    * **UI**: 入力フォーム（項目：日付、金額、カテゴリ、メモ）。
    * **入力補助**: カテゴリは選択式（カスタムカテゴリ含む）、日付はカレンダーピッカー。
* **レシート撮影・読み取り**: (MVPでは手入力のみ。将来的な拡張候補)
    * カメラアクセス許可、画像アップロード機能。
    * OCR (Optical Character Recognition) による項目抽出。
    * 抽出結果の確認・修正画面。
* **銀行口座・クレジットカード連携（自動取得）**: (MVPでは手入力のみ。将来的な拡張候補)
    * 連携サービス選択UI（例: Zaim連携、Moneytree連携など）。
    * 外部サービス認証・認可フローへのリダイレクト。
    * 連携口座選択、取得期間指定。
* **PayPay等QRコード決済連携（自動取得）**: (MVPでは手入力のみ。将来的な拡張候補)
    * 連携サービス選択UI。
    * 外部サービス認証・認可フローへのリダイレクト。

**2.3.4. データ表示・可視化機能**

* **UI**: ダッシュボード、詳細リスト、グラフ表示エリア。
* **表示項目**:
    * **日次/週次/月次使用記録**:
        * 表形式での一覧表示（日付、カテゴリ、項目、金額、メモ）。
        * 棒グラフや折れ線グラフでの推移表示。
    * **総資産推移**:
        * 折れ線グラフによる時系列での総資産の変動表示。
    * **カテゴリ別集計**:
        * 円グラフ、棒グラフによる支出・収入の内訳表示。
* **期間選択**: 日/週/月/年単位での表示期間切り替え機能。

**2.3.5. カテゴリ管理機能**

* **UI**: カテゴリ一覧表示、追加・編集・削除フォーム。
* **機能**:
    * 推奨カテゴリの表示と選択。
    * ユーザーによるカスタムカテゴリの追加（カテゴリ名入力）。
    * 既存カテゴリ名の編集。
    * カテゴリの削除（紐づくデータがある場合の警告と処理選択）。

**2.3.6. 「危機感を煽る」機能**

* **予算超過時の通知**:
    * **UI**: ダッシュボード上での警告メッセージ、またはモーダル表示。
    * **ロジック**: 設定された月間予算やカテゴリ別予算に対し、現在の支出額がXX%を超えた場合や、予算残高が一定額を下回った場合に警告をトリガー。
* **金銭使用頻度警告**:
    * **UI**: ダッシュボード上での警告メッセージ、またはモーダル表示、特定の項目やグラフに警告アイコン表示。
    * **ロジック**: 過去のデータ（例: 直近X週間の平均支出額、特定カテゴリの支出頻度）と比較し、現在の支出頻度や額が著しく高くなった場合に警告をトリガー。異常値検知アルゴリズムを導入。
* **警告表現**: 警告メッセージの文言、色、アイコンなどで危機感を強調。

**2.3.7. 目標設定機能**

* **UI**: 目標設定フォーム。
* **設定項目**: 期間（月、年など）、目標残額。
* **進捗表示**: 目標残額に対する現在の残額の達成度を視覚的に表示（プログレスバー、残額からの残り日数など）。

**2.3.8. ユーザー設定・プロフィール編集**

* **UI**: 設定画面。
* **機能**:
    * ユーザー情報更新フォーム（`PUT /account/state`）。
    * パスワード変更。

**2.4. エラー表示**

* バックエンドからのエラーレスポンス（`!response.ok`）を検知し、ユーザーフレンドリーなエラーメッセージを画面上部に表示（例: Toast通知、エラーモーダル）。
* 入力値検証エラーは、各入力フォームの直下に表示。

---

#### 3. バックエンド仕様

**3.1. 技術スタック**


* **プログラミング言語**: Go言語
* **フレームワーク**: Fiber
* **データベース**: MySQL

**3.2. データストレージ**

* すべてのユーザーデータはサーバー上の**MySQLデータベース**に保管される。
* ユーザーアカウントごとにデータが紐付けられ、ログインすることで共有・アクセス可能。

**3.3. APIエンドポイント**

**3.3.1. 認証・アカウント関連**

* `POST /account/signin`
    * **目的**: ユーザーログイン
    * **リクエストボディ**: `{ email: string, password: string }`
    * **レスポンス**: 成功時: `{ token: string, user: { id: string, email: string, ... } }`
        * (トークンはJWTなどを想定), 失敗時: `{ error: string, message: string }` (例: 401 Unauthorized)
* `POST /account/signup`
    * **目的**: 新規ユーザー登録
    * **リクエストボディ**: `{ email: string, password: string, ... }`
    * **レスポンス**: 成功時: `{ user: { id: string, email: string, ... } }`, 失敗時: `{ error: string, message: string }` (例: 409 Conflict)
* `PUT /account/state` (認証必須)
    * **目的**: ユーザー情報の更新（パスワード変更含む）
    * **リクエストボディ**: `{ password?: string, newPassword?: string, ... }`
    * **レスポンス**: 成功時: `{ message: string }`, 失敗時: `{ error: string, message: string }`

**3.3.2. 家計簿データ関連**

* `POST /data/register` (認証必須)
    * **目的**: 支出または収入の新規登録
    * **リクエストボディ**: `{ type: 'expense' | 'income', amount: number, date: string, categoryId: string, memo?: string }`
    * **レスポンス**: 成功時: `{ id: string, message: string }`, 失敗時: `{ error: string, message: string }`
* `GET /data/search` (認証必須)
    * **目的**: 特定の条件（期間、カテゴリなど）での支出・収入データ取得
    * **クエリパラメータ**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&categoryId=string&type=expense|income` など
    * **レスポンス**: 成功時: `[{ id: string, type: 'expense'|'income', amount: number, date: string, category: {id:string, name:string}, memo?: string }, ...]` の配列, 失敗時: `{ error: string, message: string }`
* `PUT /data/edit` (認証必須)
    * **目的**: 既存の支出・収入データの編集
    * **リクエストボディ**: `{ id: string, type?: 'expense'|'income', amount?: number, date?: string, categoryId?: string, memo?: string }`
    * **レスポンス**: 成功時: `{ message: string }`, 失敗時: `{ error: string, message: string }` (例: 404 Not Found)
* `DELETE /data/:id` (認証必須)
    * **目的**: 特定の支出・収入データの削除
    * **パスパラメータ**: `:id` (削除対象のデータID)
    * **レスポンス**: 成功時: `{ message: string }`, 失敗時: `{ error: string, message: string }` (例: 404 Not Found)

**3.3.3. カテゴリ管理関連**

* `GET /data/category` (認証必須)
    * **目的**: ユーザーが利用可能なカテゴリ一覧の取得
    * **レスポンス**: 成功時: `[{ id: string, name: string, type: 'expense'|'income' }, ...]` の配列, 失敗時: `{ error: string, message: string }`
* `POST /data/category` (認証必須)
    * **目的**: 新規カテゴリの追加
    * **リクエストボディ**: `{ name: string, type: 'expense'|'income' }`
    * **レスポンス**: 成功時: `{ id: string, message: string }`, 失敗時: `{ error: string, message: string }`
* `PUT /data/category` (認証必須)
    * **目的**: 既存カテゴリの編集
    * **リクエストボディ**: `{ id: string, name?: string, type?: 'expense'|'income' }`
    * **レスポンス**: 成功時: `{ message: string }`, 失敗時: `{ error: string, message: string }`
* `DELETE /data/category` (認証必須)
    * **目的**: 特定カテゴリの削除
    * **リクエストボディ**: `{ id: string }`
    * **レスポンス**: 成功時: `{ message: string }`, 失敗時: `{ error: string, message: string }`

**3.4. データベーススキーマ (MySQL)**

* **`users` テーブル**:
    * `id` (PK, INTEGER)
    * `email` (TEXT, UNIQUE, NOT NULL)
    * `password_hash` (TEXT, NOT NULL)
    * `created_at` (TEXT, DEFAULT CURRENT_TIMESTAMP)
    * `updated_at` (TEXT, DEFAULT CURRENT_TIMESTAMP)
* **`categories` テーブル**:
    * `id` (PK, INTEGER)
    * `user_id` (FK to users.id, INTEGER, NOT NULL) - ユーザー固有のカテゴリ
    * `name` (TEXT, NOT NULL)
    * `type` (TEXT, CHECK(type IN ('expense', 'income')), NOT NULL)
    * `is_custom` (INTEGER, DEFAULT 0) - 0:推奨カテゴリ, 1:カスタムカテゴリ
* **`transactions` テーブル**: (支出・収入データ)
    * `id` (PK, INTEGER)
    * `user_id` (FK to users.id, INTEGER, NOT NULL)
    * `type` (TEXT, CHECK(type IN ('expense', 'income')), NOT NULL)
    * `amount` (REAL, NOT NULL)
    * `date` (TEXT, NOT NULL) - `YYYY-MM-DD` 形式を推奨
    * `category_id` (FK to categories.id, INTEGER, NOT NULL)
    * `memo` (TEXT)
    * `created_at` (TEXT, DEFAULT CURRENT_TIMESTAMP)
    * `updated_at` (TEXT, DEFAULT CURRENT_TIMESTAMP)

**3.5. エラーハンドリング**

* HTTPステータスコードを適切に利用 (例: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error`)。
* エラー発生時は、HTTPステータスコードと合わせてJSON形式でエラーメッセージを返却 (例: `{ "error": "Unauthorized", "message": "Invalid credentials." }`)。
* 重要なエラーはサーバーログに記録。

---

#### 4. セキュリティ

* **パスワードハッシュ化**: bcryptなどの強力なハッシュアルゴリズムを使用してパスワードをハッシュ化し、ソルトを付加してデータベースに保存。
* **SQLインジェクション対策**: プリペアドステートメントまたはORMを使用して、データベースクエリを構築し、ユーザー入力を適切にエスケープ処理。
* **HTTPS通信**: 全ての通信はTLS/SSLで暗号化される。
* **外部サービス連携**: (将来的な拡張) 各外部サービスのOAuth/APIキー管理を厳重に行い、連携時のデータフローと権限範囲を明確にする。ユーザーの機微情報へのアクセスは最小限に留める。
* **API認証**: 各APIエンドポイントでJWTトークンなどを用いた認証を行い、ログイン済みのユーザーのみがアクセスできるようにする。
* **XSS (クロスサイトスクリプティング) 対策**: フロントエンドでのレンダリング時、バックエンドでのデータ保存時、出力時のエスケープ処理を徹底。
* **CORS (Cross-Origin Resource Sharing) 設定**: 適切なCORSポリシーを設定し、許可されたオリジンからのリクエストのみを受け付ける。

---

#### 5. デプロイ・運用 (保留)

* デプロイ環境や具体的なサーバー、ドメインについては開発進捗に応じて検討。
