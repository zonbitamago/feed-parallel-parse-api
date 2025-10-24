#!/bin/bash
# API定義書参照テスト: 最新API定義書が参照可能か確認
set -e

# API定義HTMLのパス
API_DOC_HTML="contracts/api-docs/index.html"
README="contracts/api-docs/README.md"

# index.htmlの存在確認
if [ ! -f "$API_DOC_HTML" ]; then
  echo "API定義HTML (index.html) が存在しません" >&2
  exit 1
fi

# READMEの存在確認
if [ ! -f "$README" ]; then
  echo "API定義書参照READMEが存在しません" >&2
  exit 1
fi

# index.htmlの内容チェック（最低限のOpenAPI HTMLタグ確認）
grep -q "<html" "$API_DOC_HTML"
HTML_TAG_STATUS=$?
grep -q "OpenAPI" "$API_DOC_HTML"
OPENAPI_STATUS=$?
if [ $HTML_TAG_STATUS -eq 0 ] && [ $OPENAPI_STATUS -eq 0 ]; then
  echo "API定義書参照テスト: 成功"
  exit 0
else
  echo "API定義書参照テスト: 失敗 (HTML内容不正)" >&2
  exit 1
fi
