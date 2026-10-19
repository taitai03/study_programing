#!/usr/bin/env bash
# 中級6の追加のチェック（変更しないでください）。
# 受講者が書いたテスト（PointCalculatorTests）が、バグを入れたポイント計算をすべて見つけられるかを確かめる
set -u
TEST=SakuraMartKit/Tests/SakuraMartKitTests/PointCalculatorTests.swift
TARGET=SakuraMartKit/Sources/SakuraMartKit/PointCalculator.swift

if [ ! -f "$TEST" ]; then
  echo "❌ $TEST がありません。ポイント計算のテストを書いてください"
  exit 1
fi

backup=$(mktemp)
cp "$TARGET" "$backup"
trap 'cp "$backup" "$TARGET"' EXIT

failed=0
for mutant in .task/mutants/*.swift; do
  description=$(head -1 "$mutant" | sed 's|^// ||')
  cp "$mutant" "$TARGET"
  if swift test --package-path SakuraMartKit --filter PointCalculatorTests > /dev/null 2>&1; then
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
