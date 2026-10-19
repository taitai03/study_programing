#!/usr/bin/env bash
# 中級3の追加のチェック（変更しないでください）。
# 受講者が書いたテスト（spec/models/point_calculator_spec.rb）が、バグを入れたポイント計算をすべて見つけられるかを確かめる
set -u
SPEC=spec/models/point_calculator_spec.rb
TARGET=app/models/point_calculator.rb

if [ ! -f "$SPEC" ]; then
  echo "❌ $SPEC がありません。ポイント計算のテストを書いてください"
  exit 1
fi

backup=$(mktemp)
cp "$TARGET" "$backup"
trap 'cp "$backup" "$TARGET"' EXIT

failed=0
for mutant in .task/mutants/*.rb; do
  description=$(head -1 "$mutant" | sed 's|^# ||')
  cp "$mutant" "$TARGET"
  if bundle exec rspec "$SPEC" > /dev/null 2>&1; then
    echo "❌ 見つけられませんでした: $description"
    failed=1
  else
    echo "✅ 見つけました: $description"
  fi
done

if [ "$failed" -ne 0 ]; then
  echo ""
  echo "あなたのテストでは見つけられないバグがあります。仕様（TASK.md）の境目の値や、会員ランクごとのケースを見直してください"
fi
exit $failed
