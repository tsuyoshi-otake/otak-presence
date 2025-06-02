# otak-presence

otak-presenceは、センサーを使った部屋の占有状況を管理するWebアプリケーションです。GitHub Pages上で動作し、設定はブラウザのLocalStorageに自動保存されます。

## 機能

- **センサー管理**: UUIDとセンサー名でセンサーを追加・編集・削除
- **グループ管理**: センサーをグループに分類して組織的に管理
- **ドラッグ&ドロップ**: センサーをグループ間で直感的に移動
- **リアルタイム更新**: センサー状態のシミュレーション（30秒間隔）
- **ダークモード**: ライト/ダークテーマの切り替え
- **LocalStorage**: 設定の自動保存・復元

## 使い方

1. **センサーの追加**:
   - 「+ Add Sensor」ボタンをクリック
   - UUID（7桁）とセンサー名を入力

2. **グループの作成**:
   - 「+ Create Group」ボタンをクリック
   - グループ名と説明（任意）を入力

3. **センサーの整理**:
   - 未分類センサーをグループにドラッグ&ドロップ
   - グループ間でセンサーを移動

4. **設定の永続化**:
   - すべての設定はブラウザのLocalStorageに自動保存
   - ページリロード後も設定が復元されます

## デプロイ

GitHub Actionsを使用してmainブランチから自動デプロイされます。

### 手動デプロイ手順

1. リポジトリの設定でPages機能を有効化
2. Source: "GitHub Actions"を選択
3. mainブランチにpushすると自動デプロイ実行

## ファイル構成

- `index.html` - エントリーポイント
- `app.js` - メインアプリケーション（LocalStorage対応）
- `.github/workflows/deploy.yml` - GitHub Actionsワークフロー
- `room-occupancy-system.tsx` - 元のReactコンポーネント（参考用）

## 技術スタック

- React (CDN版)
- Tailwind CSS (CDN版)
- LocalStorage API
- GitHub Pages
- GitHub Actions

## LocalStorage仕様

- `otak-presence-sensors`: センサーデータ
- `otak-presence-groups`: グループデータ
- `otak-presence-dark-mode`: ダークモード設定

## ライセンス

MIT License