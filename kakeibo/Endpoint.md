# 消費、収入、サブスク編
以下のエンドポイントがあります

- /data/purchase
- /data/income
- /data/subscription

以下は/data/purchaseで例示しますが、この三つのリクエストボディはほとんど共通です(subscriptionは年と月は要りません)

## /data/puurchhase/add
物の追加

### リクエスト
```:json
{
    "product_name": 商品名,
    "price": 値段,
    "year": 購入年,
    "month": 購入月,
    "day": 購入日
}
```

## /data/purchase/get?year=[year]&month=[month]
登録した物の一覧取得

### クエリ
year: 対象の年、省略すると今年

month: 対象の月、省略すると指定された年の全てのデータを取得

なお、両方省略で全てのデータ取得

### レスポンス
```:json
{
    [{
        "product_id": 商品id,
        "product_name": 商品名,
        "price": 値段,
        "year": 購入年,
        "month": 購入月,
        "day": 購入日
    }],
    ...
}
```

## /data/purchase/edit
登録した物の編集

### リクエスト
```:json
{
    "product_id": 商品id,
    // 以下更新内容
    "product_name": 商品名,
    "price": 値段,
    "year": 購入年,
    "month": 購入月,
    "day": 購入日
}
```

## /data/purchase/delete
登録した物の削除

### リクエスト
```:json
{
    "product_id": 商品id
}
```

# 家計簿編
以下のエンドポイントがあります
- /data/budget

## /data/budget/get
一覧取得

### クエリ
year: 対象の年、省略すると今年
month: 対象の月、省略すると指定された年の全てのデータを取得

なお、両方省略で全てのデータ取得

### レスポンス
```:json
{
    [{
		"budget_id": id,
		"income":    収入,
		"outgo":     消費,
		"year":      年,
		"month":     月
    }],
    ...
}
```

なお、家計簿の内容は内部で自動的に記録します
