#!/bin/bash
# API定義書生成テスト: openapi.yaml更新後にHTMLが生成されるか確認
set -e

# テスト用一時ディレクトリ
TMP_DOCS="/tmp/api-docs-test"
rm -rf "$TMP_DOCS"
mkdir -p "$TMP_DOCS"

# OpenAPI Generator CLIのパス
GEN_JAR="openapi-generator-cli.jar"

# contracts/openapi.yamlの存在確認
if [ ! -f "contracts/openapi.yaml" ]; then
  echo "contracts/openapi.yaml が存在しません" >&2
  exit 1
fi

# API定義HTML生成
java -jar "$GEN_JAR" generate -i contracts/openapi.yaml -g html -o "$TMP_DOCS"

# index.htmlの生成確認
if [ -f "$TMP_DOCS/index.html" ]; then
  echo "API定義HTML生成テスト: 成功"
  exit 0
else
  echo "API定義HTML生成テスト: 失敗 (index.htmlがありません)" >&2
  exit 1
fi
