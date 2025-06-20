# SQLのセットアップ

## 1. 環境変数の登録
以下の三つを定義
- SQL_USERNAME
- SQL_PASSWORD
- JWT_SECRET

## 2. DBの作成
```:bash
$ envsubst < CreateDB.sql | sudo mysql -u root
```
